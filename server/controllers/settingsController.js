const Setting = require('../models/Setting');
const logger = require('../utils/logger');

const settingsController = {
  async list(req, res, next) {
    try {
      const settings = await Setting.findAll();
      res.json({ settings });
    } catch (error) {
      next(error);
    }
  },

  async get(req, res, next) {
    try {
      const setting = await Setting.findByKey(req.params.key);
      if (!setting) {
        return res.status(404).json({ error: 'Setting not found' });
      }
      res.json({ setting });
    } catch (error) {
      next(error);
    }
  },

  async update(req, res, next) {
    try {
      const { key } = req.params;
      const { setting_value } = req.validatedBody;

      await Setting.update(key, setting_value);
      const setting = await Setting.findByKey(key);

      logger.info(`Setting updated: ${key} by admin ${req.session.username}`);

      res.json({ setting });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = settingsController;
