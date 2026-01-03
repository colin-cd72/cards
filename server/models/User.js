const { pool } = require('../config/database');
const bcrypt = require('bcryptjs');

const User = {
  async findByUsername(username) {
    const [rows] = await pool.execute(
      'SELECT * FROM users WHERE username = ?',
      [username]
    );
    return rows[0] || null;
  },

  async findById(id) {
    const [rows] = await pool.execute(
      'SELECT id, username, email, role, is_active, created_at, last_login FROM users WHERE id = ?',
      [id]
    );
    return rows[0] || null;
  },

  async findAll() {
    const [rows] = await pool.execute(
      'SELECT id, username, email, role, is_active, created_at, last_login FROM users ORDER BY username'
    );
    return rows;
  },

  async create({ username, email, password, role = 'producer' }) {
    const password_hash = await bcrypt.hash(password, 10);
    const [result] = await pool.execute(
      'INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)',
      [username, email, password_hash, role]
    );
    return result.insertId;
  },

  async update(id, data) {
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
      values.push(data.is_active);
    }

    if (fields.length === 0) return false;

    values.push(id);
    await pool.execute(
      `UPDATE users SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
    return true;
  },

  async updatePassword(id, password) {
    const password_hash = await bcrypt.hash(password, 10);
    await pool.execute(
      'UPDATE users SET password_hash = ? WHERE id = ?',
      [password_hash, id]
    );
  },

  async updateLastLogin(id) {
    await pool.execute(
      'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?',
      [id]
    );
  },

  async verifyPassword(user, password) {
    return bcrypt.compare(password, user.password_hash);
  },

  async delete(id) {
    await pool.execute('DELETE FROM users WHERE id = ?', [id]);
  }
};

module.exports = User;
