const { db } = require('../config/database');

const Card = {
  create(data) {
    const result = db.prepare(`
      INSERT INTO cards
      (user_id, preset_id, header_text, body_content, body_html, badge_number)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      data.user_id,
      data.preset_id || null,
      data.header_text,
      JSON.stringify(data.body_content),
      data.body_html,
      data.badge_number || null
    );
    return result.lastInsertRowid;
  },

  findById(id) {
    return db.prepare(`
      SELECT c.*, u.username as sent_by
      FROM cards c
      JOIN users u ON c.user_id = u.id
      WHERE c.id = ?
    `).get(id) || null;
  },

  getHistory(limit = 50, offset = 0) {
    return db.prepare(`
      SELECT c.*, u.username as sent_by
      FROM cards c
      JOIN users u ON c.user_id = u.id
      ORDER BY c.sent_at DESC
      LIMIT ? OFFSET ?
    `).all(limit, offset);
  },

  getHistoryByUser(userId, limit = 50, offset = 0) {
    return db.prepare(`
      SELECT c.*, u.username as sent_by
      FROM cards c
      JOIN users u ON c.user_id = u.id
      WHERE c.user_id = ?
      ORDER BY c.sent_at DESC
      LIMIT ? OFFSET ?
    `).all(userId, limit, offset);
  },

  getLatest() {
    return db.prepare(`
      SELECT c.*, u.username as sent_by
      FROM cards c
      JOIN users u ON c.user_id = u.id
      ORDER BY c.sent_at DESC
      LIMIT 1
    `).get() || null;
  }
};

module.exports = Card;
