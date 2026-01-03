const { db } = require('../config/database');
const bcrypt = require('bcryptjs');

const User = {
  findByUsername(username) {
    return db.prepare('SELECT * FROM users WHERE username = ?').get(username) || null;
  },

  findById(id) {
    return db.prepare(`
      SELECT id, username, email, role, is_active, created_at, last_login
      FROM users WHERE id = ?
    `).get(id) || null;
  },

  findAll() {
    return db.prepare(`
      SELECT id, username, email, role, is_active, created_at, last_login
      FROM users ORDER BY username
    `).all();
  },

  create({ username, email, password, role = 'producer' }) {
    const password_hash = bcrypt.hashSync(password, 10);
    const result = db.prepare(`
      INSERT INTO users (username, email, password_hash, role)
      VALUES (?, ?, ?, ?)
    `).run(username, email, password_hash, role);
    return result.lastInsertRowid;
  },

  update(id, data) {
    const fields = [];
    const values = [];

    if (data.username) {
      fields.push('username = ?');
      values.push(data.username);
    }
    if (data.email) {
      fields.push('email = ?');
      values.push(data.email);
    }
    if (data.role) {
      fields.push('role = ?');
      values.push(data.role);
    }
    if (typeof data.is_active === 'boolean') {
      fields.push('is_active = ?');
      values.push(data.is_active ? 1 : 0);
    }

    if (fields.length === 0) return false;

    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    db.prepare(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`).run(...values);
    return true;
  },

  updatePassword(id, password) {
    const password_hash = bcrypt.hashSync(password, 10);
    db.prepare('UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run(password_hash, id);
  },

  updateLastLogin(id) {
    db.prepare('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?').run(id);
  },

  verifyPassword(user, password) {
    return bcrypt.compareSync(password, user.password_hash);
  },

  delete(id) {
    db.prepare('DELETE FROM users WHERE id = ?').run(id);
  }
};

module.exports = User;
