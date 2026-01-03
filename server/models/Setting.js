const { pool } = require('../config/database');

const Setting = {
  async findAll() {
    const [rows] = await pool.execute(
      'SELECT * FROM settings ORDER BY setting_key'
    );
    return rows;
  },

  async findByKey(key) {
    const [rows] = await pool.execute(
      'SELECT * FROM settings WHERE setting_key = ?',
      [key]
    );
    return rows[0] || null;
  },

  async getValue(key, defaultValue = null) {
    const setting = await this.findByKey(key);
    if (!setting) return defaultValue;
    return typeof setting.setting_value === 'string'
      ? JSON.parse(setting.setting_value)
      : setting.setting_value;
  },

  async update(key, value, description = null) {
    const existingSetting = await this.findByKey(key);

    if (existingSetting) {
      await pool.execute(
        'UPDATE settings SET setting_value = ? WHERE setting_key = ?',
        [JSON.stringify(value), key]
      );
    } else {
      await pool.execute(
        'INSERT INTO settings (setting_key, setting_value, description) VALUES (?, ?, ?)',
        [key, JSON.stringify(value), description]
      );
    }
  },

  async delete(key) {
    await pool.execute('DELETE FROM settings WHERE setting_key = ?', [key]);
  }
};

module.exports = Setting;
