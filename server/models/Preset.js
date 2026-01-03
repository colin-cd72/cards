const { pool } = require('../config/database');

const Preset = {
  async findByUserId(userId) {
    const [rows] = await pool.execute(
      `SELECT * FROM presets
       WHERE user_id = ? OR is_global = TRUE
       ORDER BY preset_number`,
      [userId]
    );
    return rows;
  },

  async findById(id) {
    const [rows] = await pool.execute(
      'SELECT * FROM presets WHERE id = ?',
      [id]
    );
    return rows[0] || null;
  },

  async findByNumber(userId, presetNumber) {
    const [rows] = await pool.execute(
      `SELECT * FROM presets
       WHERE (user_id = ? OR is_global = TRUE) AND preset_number = ?`,
      [userId, presetNumber]
    );
    return rows[0] || null;
  },

  async findGlobal() {
    const [rows] = await pool.execute(
      'SELECT * FROM presets WHERE is_global = TRUE ORDER BY preset_number'
    );
    return rows;
  },

  async search(userId, query) {
    const searchTerm = `%${query}%`;
    const [rows] = await pool.execute(
      `SELECT * FROM presets
       WHERE (user_id = ? OR is_global = TRUE)
         AND (subject LIKE ? OR CAST(preset_number AS CHAR) LIKE ?)
       ORDER BY preset_number`,
      [userId, searchTerm, searchTerm]
    );
    return rows;
  },

  async create(data) {
    const [result] = await pool.execute(
      `INSERT INTO presets
       (user_id, preset_number, subject, header_text, body_content, body_html, badge_number, is_global)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.user_id,
        data.preset_number,
        data.subject,
        data.header_text,
        JSON.stringify(data.body_content),
        data.body_html,
        data.badge_number || null,
        data.is_global || false
      ]
    );
    return result.insertId;
  },

  async update(id, data) {
    const fields = [];
    const values = [];

    if (data.preset_number !== undefined) {
      fields.push('preset_number = ?');
      values.push(data.preset_number);
    }
    if (data.subject !== undefined) {
      fields.push('subject = ?');
      values.push(data.subject);
    }
    if (data.header_text !== undefined) {
      fields.push('header_text = ?');
      values.push(data.header_text);
    }
    if (data.body_content !== undefined) {
      fields.push('body_content = ?');
      values.push(JSON.stringify(data.body_content));
    }
    if (data.body_html !== undefined) {
      fields.push('body_html = ?');
      values.push(data.body_html);
    }
    if (data.badge_number !== undefined) {
      fields.push('badge_number = ?');
      values.push(data.badge_number || null);
    }
    if (data.is_global !== undefined) {
      fields.push('is_global = ?');
      values.push(data.is_global);
    }

    if (fields.length === 0) return false;

    values.push(id);
    await pool.execute(
      `UPDATE presets SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
    return true;
  },

  async delete(id) {
    await pool.execute('DELETE FROM presets WHERE id = ?', [id]);
  },

  async belongsToUser(id, userId) {
    const [rows] = await pool.execute(
      'SELECT id FROM presets WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    return rows.length > 0;
  }
};

module.exports = Preset;
