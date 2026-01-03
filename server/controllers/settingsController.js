const Setting = require('../models/Setting');
const logger = require('../utils/logger');

const settingsController = {
  list(req, res, next) {
    try {
      const settings = Setting.findAll();
      res.json({ settings });
    } catch (error) {
      next(error);
    }
  },

  get(req, res, next) {
    try {
      const setting = Setting.findByKey(req.params.key);
      if (!setting) {
        return res.status(404).json({ error: 'Setting not found' });
      }
      res.json({ setting });
    } catch (error) {
      next(error);
    }
  },

  // Public endpoint for output page settings
  getOutputSettings(req, res, next) {
    try {
      const outputSettings = Setting.getValue('output_settings', {
        inverse: false,
        blankOnStartup: true
      });
      res.json({ settings: outputSettings });
    } catch (error) {
      next(error);
    }
  },

  update(req, res, next) {
    try {
      const { key } = req.params;
      const { setting_value } = req.validatedBody;

      Setting.update(key, setting_value);
      const setting = Setting.findByKey(key);

      logger.info(`Setting updated: ${key} by admin ${req.session.username}`);

      // Broadcast settings change to output pages
      if (key === 'output_settings' && req.app.get('io')) {
        req.app.get('io').to('outputs').emit('settings:update', {
          settings: setting_value
        });
      }

      res.json({ setting });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = settingsController;
