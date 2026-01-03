const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

// Database file path
const dbPath = process.env.DB_PATH || path.join(__dirname, '../../data/broadcast_cards.db');

// Ensure data directory exists
const dataDir = path.dirname(dbPath);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Create database connection
const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

// Initialize schema
function initializeDatabase() {
  // Users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'producer' CHECK(role IN ('admin', 'producer', 'viewer')),
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      last_login TEXT
    )
  `);

  // Presets table
  db.exec(`
    CREATE TABLE IF NOT EXISTS presets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      preset_number INTEGER NOT NULL,
      subject TEXT NOT NULL,
      header_text TEXT NOT NULL,
      body_content TEXT NOT NULL,
      body_html TEXT NOT NULL,
      badge_number TEXT,
      is_global INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(user_id, preset_number)
    )
  `);

  // Cards table
  db.exec(`
    CREATE TABLE IF NOT EXISTS cards (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      preset_id INTEGER,
      header_text TEXT NOT NULL,
      body_content TEXT NOT NULL,
      body_html TEXT NOT NULL,
      badge_number TEXT,
      sent_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (preset_id) REFERENCES presets(id) ON DELETE SET NULL
    )
  `);

  // Settings table
  db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      setting_key TEXT NOT NULL UNIQUE,
      setting_value TEXT NOT NULL,
      description TEXT,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create indexes
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_presets_user_id ON presets(user_id);
    CREATE INDEX IF NOT EXISTS idx_presets_number ON presets(preset_number);
    CREATE INDEX IF NOT EXISTS idx_cards_user_id ON cards(user_id);
    CREATE INDEX IF NOT EXISTS idx_cards_sent_at ON cards(sent_at);
  `);

  // Create default admin user if no users exist
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get();
  if (userCount.count === 0) {
    const passwordHash = bcrypt.hashSync('admin123', 10);
    db.prepare(`
      INSERT INTO users (username, email, password_hash, role)
      VALUES (?, ?, ?, ?)
    `).run('admin', 'admin@4tmrw.net', passwordHash, 'admin');
    console.log('Default admin user created (username: admin, password: admin123)');
  }

  // Create default settings if not exist
  const settingsCount = db.prepare('SELECT COUNT(*) as count FROM settings').get();
  if (settingsCount.count === 0) {
    db.prepare(`
      INSERT INTO settings (setting_key, setting_value, description)
      VALUES (?, ?, ?)
    `).run('card_style', JSON.stringify({
      backgroundColor: '#ffffff',
      headerColor: '#000000',
      badgeColor: '#ffff00',
      fontFamily: 'Georgia, serif',
      fontSize: '20px'
    }), 'Default card styling');

    db.prepare(`
      INSERT INTO settings (setting_key, setting_value, description)
      VALUES (?, ?, ?)
    `).run('output_settings', JSON.stringify({
      blankOnStartup: true,
      transitionDuration: 300
    }), 'Output page behavior settings');
  }

  console.log('Database initialized successfully');
}

// Test connection
function testConnection() {
  try {
    db.prepare('SELECT 1').get();
    console.log('Database connected successfully');
    return true;
  } catch (error) {
    console.error('Database connection failed:', error.message);
    return false;
  }
}

module.exports = { db, initializeDatabase, testConnection };
