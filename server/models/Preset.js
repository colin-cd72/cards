const { db } = require('../config/database');

const Preset = {
  findByUserId(userId) {
    return db.prepare(`
      SELECT * FROM presets
      WHERE user_id = ? OR is_global = 1
      ORDER BY preset_number
    `).all(userId);
  },

  findById(id) {
    return db.prepare('SELECT * FROM presets WHERE id = ?').get(id) || null;
  },

  findByNumber(userId, presetNumber) {
    return db.prepare(`
      SELECT * FROM presets
      WHERE (user_id = ? OR is_global = 1) AND preset_number = ?
    `).get(userId, presetNumber) || null;
  },

  findGlobal() {
    return db.prepare('SELECT * FROM presets WHERE is_global = 1 ORDER BY preset_number').all();
  },

  search(userId, query) {
    const searchTerm = `%${query}%`;
    return db.prepare(`
      SELECT * FROM presets
      WHERE (user_id = ? OR is_global = 1)
        AND (subject LIKE ? OR CAST(preset_number AS TEXT) LIKE ?)
      ORDER BY preset_number
    `).all(userId, searchTerm, searchTerm);
  },

  create(data) {
    const result = db.prepare(`
      INSERT INTO presets
      (user_id, preset_number, subject, header_text, body_content, body_html, badge_number, is_global)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      data.user_id,
      data.preset_number,
      data.subject,
      data.header_text,
      JSON.stringify(data.body_content),
      data.body_html,
      data.badge_number || null,
      data.is_global ? 1 : 0
    );
    return result.lastInsertRowid;
  },

  update(id, data) {
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
      values.push(data.is_global ? 1 : 0);
    }

    if (fields.length === 0) return false;

    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    db.prepare(`UPDATE presets SET ${fields.join(', ')} WHERE id = ?`).run(...values);
    return true;
  },

  delete(id) {
    db.prepare('DELETE FROM presets WHERE id = ?').run(id);
  },

  belongsToUser(id, userId) {
    const result = db.prepare('SELECT id FROM presets WHERE id = ? AND user_id = ?').get(id, userId);
    return !!result;
  }
};

module.exports = Preset;
