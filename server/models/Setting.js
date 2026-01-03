const { db } = require('../config/database');

const Setting = {
  findAll() {
    return db.prepare('SELECT * FROM settings ORDER BY setting_key').all();
  },

  findByKey(key) {
    return db.prepare('SELECT * FROM settings WHERE setting_key = ?').get(key) || null;
  },

  getValue(key, defaultValue = null) {
    const setting = this.findByKey(key);
    if (!setting) return defaultValue;
    try {
      return JSON.parse(setting.setting_value);
    } catch {
      return setting.setting_value;
    }
  },

  update(key, value, description = null) {
    const existingSetting = this.findByKey(key);
    const valueStr = JSON.stringify(value);

    if (existingSetting) {
      db.prepare('UPDATE settings SET setting_value = ?, updated_at = CURRENT_TIMESTAMP WHERE setting_key = ?')
        .run(valueStr, key);
    } else {
      db.prepare('INSERT INTO settings (setting_key, setting_value, description) VALUES (?, ?, ?)')
        .run(key, valueStr, description);
    }
  },

  delete(key) {
    db.prepare('DELETE FROM settings WHERE setting_key = ?').run(key);
  }
};

module.exports = Setting;
