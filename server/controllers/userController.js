const User = require('../models/User');
const logger = require('../utils/logger');

const userController = {
  list(req, res, next) {
    try {
      const users = User.findAll();
      res.json({ users });
    } catch (error) {
      next(error);
    }
  },

  get(req, res, next) {
    try {
      const user = User.findById(req.params.id);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      res.json({ user });
    } catch (error) {
      next(error);
    }
  },

  create(req, res, next) {
    try {
      const { username, email, password, role } = req.validatedBody;

      const id = User.create({ username, email, password, role });
      const user = User.findById(id);

      logger.info(`User created: ${username} by admin ${req.session.username}`);

      res.status(201).json({ user });
    } catch (error) {
      next(error);
    }
  },

  update(req, res, next) {
    try {
      const { id } = req.params;

      const existingUser = User.findById(id);
      if (!existingUser) {
        return res.status(404).json({ error: 'User not found' });
      }

      User.update(id, req.validatedBody);
      const user = User.findById(id);

      logger.info(`User updated: ${user.username} by admin ${req.session.username}`);

      res.json({ user });
    } catch (error) {
      next(error);
    }
  },

  changePassword(req, res, next) {
    try {
      const { id } = req.params;
      const { password } = req.validatedBody;

      const existingUser = User.findById(id);
      if (!existingUser) {
        return res.status(404).json({ error: 'User not found' });
      }

      User.updatePassword(id, password);

      logger.info(`Password changed for: ${existingUser.username} by admin ${req.session.username}`);

      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  },

  delete(req, res, next) {
    try {
      const { id } = req.params;

      const existingUser = User.findById(id);
      if (!existingUser) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Don't allow deleting yourself
      if (parseInt(id) === req.session.userId) {
        return res.status(400).json({ error: 'Cannot delete your own account' });
      }

      User.delete(id);

      logger.info(`User deleted: ${existingUser.username} by admin ${req.session.username}`);

      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = userController;
