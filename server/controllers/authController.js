const User = require('../models/User');
const logger = require('../utils/logger');

const authController = {
  login(req, res, next) {
    try {
      const { username, password } = req.validatedBody;

      const user = User.findByUsername(username);
      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      if (!user.is_active) {
        return res.status(401).json({ error: 'Account is deactivated' });
      }

      const validPassword = User.verifyPassword(user, password);
      if (!validPassword) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Update last login
      User.updateLastLogin(user.id);

      // Set session
      req.session.userId = user.id;
      req.session.username = user.username;
      req.session.role = user.role;

      logger.info(`User logged in: ${user.username}`);

      res.json({
        success: true,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role
        }
      });
    } catch (error) {
      next(error);
    }
  },

  logout(req, res, next) {
    try {
      const username = req.session.username;

      req.session.destroy((err) => {
        if (err) {
          logger.error('Session destroy error:', err);
          return res.status(500).json({ error: 'Logout failed' });
        }

        logger.info(`User logged out: ${username}`);
        res.json({ success: true });
      });
    } catch (error) {
      next(error);
    }
  },

  me(req, res, next) {
    try {
      const user = User.findById(req.session.userId);
      if (!user) {
        req.session.destroy(() => {});
        return res.status(401).json({ error: 'User not found' });
      }

      res.json({
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role
        }
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = authController;
