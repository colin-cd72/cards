const { pool } = require('../config/database');

const Card = {
  async create(data) {
    const [result] = await pool.execute(
      `INSERT INTO cards
       (user_id, preset_id, header_text, body_content, body_html, badge_number)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        data.user_id,
        data.preset_id || null,
        data.header_text,
        JSON.stringify(data.body_content),
        data.body_html,
        data.badge_number || null
      ]
    );
    return result.insertId;
  },

  async findById(id) {
    const [rows] = await pool.execute(
      `SELECT c.*, u.username as sent_by
       FROM cards c
       JOIN users u ON c.user_id = u.id
       WHERE c.id = ?`,
      [id]
    );
    return rows[0] || null;
  },

  async getHistory(limit = 50, offset = 0) {
    const [rows] = await pool.execute(
      `SELECT c.*, u.username as sent_by
       FROM cards c
       JOIN users u ON c.user_id = u.id
       ORDER BY c.sent_at DESC
       LIMIT ? OFFSET ?`,
      [limit, offset]
    );
    return rows;
  },

  async getHistoryByUser(userId, limit = 50, offset = 0) {
    const [rows] = await pool.execute(
      `SELECT c.*, u.username as sent_by
       FROM cards c
       JOIN users u ON c.user_id = u.id
       WHERE c.user_id = ?
       ORDER BY c.sent_at DESC
       LIMIT ? OFFSET ?`,
      [userId, limit, offset]
    );
    return rows;
  },

  async getLatest() {
    const [rows] = await pool.execute(
      `SELECT c.*, u.username as sent_by
       FROM cards c
       JOIN users u ON c.user_id = u.id
       ORDER BY c.sent_at DESC
       LIMIT 1`
    );
    return rows[0] || null;
  }
};

module.exports = Card;
