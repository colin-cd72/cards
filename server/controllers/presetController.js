const Preset = require('../models/Preset');
const sanitizeHtml = require('sanitize-html');
const logger = require('../utils/logger');

// Sanitize HTML options - allow formatting but strip scripts
const sanitizeOptions = {
  allowedTags: ['p', 'br', 'strong', 'b', 'em', 'i', 'u', 'span', 'div'],
  allowedAttributes: {
    'span': ['style'],
    'p': ['style'],
    'div': ['style']
  },
  allowedStyles: {
    '*': {
      'font-size': [/^\d+(?:px|em|rem|%)$/],
      'font-weight': [/^(bold|normal|\d+)$/],
      'font-style': [/^(italic|normal)$/],
      'text-decoration': [/^(underline|none)$/]
    }
  }
};

const presetController = {
  list(req, res, next) {
    try {
      const presets = Preset.findByUserId(req.session.userId);
      res.json({ presets });
    } catch (error) {
      next(error);
    }
  },

  listGlobal(req, res, next) {
    try {
      const presets = Preset.findGlobal();
      res.json({ presets });
    } catch (error) {
      next(error);
    }
  },

  get(req, res, next) {
    try {
      const preset = Preset.findById(req.params.id);
      if (!preset) {
        return res.status(404).json({ error: 'Preset not found' });
      }

      // Check access
      if (!preset.is_global && preset.user_id !== req.session.userId) {
        return res.status(403).json({ error: 'Access denied' });
      }

      res.json({ preset });
    } catch (error) {
      next(error);
    }
  },

  getByNumber(req, res, next) {
    try {
      const preset = Preset.findByNumber(req.session.userId, req.params.number);
      if (!preset) {
        return res.status(404).json({ error: 'Preset not found' });
      }
      res.json({ preset });
    } catch (error) {
      next(error);
    }
  },

  search(req, res, next) {
    try {
      const { q } = req.query;
      if (!q) {
        return res.status(400).json({ error: 'Search query required' });
      }

      const presets = Preset.search(req.session.userId, q);
      res.json({ presets });
    } catch (error) {
      next(error);
    }
  },

  create(req, res, next) {
    try {
      const data = {
        ...req.validatedBody,
        user_id: req.session.userId,
        body_html: sanitizeHtml(req.validatedBody.body_html, sanitizeOptions)
      };

      // Only admins can create global presets
      if (data.is_global && req.session.role !== 'admin') {
        data.is_global = false;
      }

      const id = Preset.create(data);
      const preset = Preset.findById(id);

      logger.info(`Preset created: #${preset.preset_number} by ${req.session.username}`);

      res.status(201).json({ preset });
    } catch (error) {
      next(error);
    }
  },

  update(req, res, next) {
    try {
      const { id } = req.params;

      const existingPreset = Preset.findById(id);
      if (!existingPreset) {
        return res.status(404).json({ error: 'Preset not found' });
      }

      // Check ownership (or admin for global)
      if (existingPreset.user_id !== req.session.userId && req.session.role !== 'admin') {
        return res.status(403).json({ error: 'Access denied' });
      }

      const data = { ...req.validatedBody };
      if (data.body_html) {
        data.body_html = sanitizeHtml(data.body_html, sanitizeOptions);
      }

      // Only admins can change global status
      if (data.is_global !== undefined && req.session.role !== 'admin') {
        delete data.is_global;
      }

      Preset.update(id, data);
      const preset = Preset.findById(id);

      logger.info(`Preset updated: #${preset.preset_number} by ${req.session.username}`);

      res.json({ preset });
    } catch (error) {
      next(error);
    }
  },

  delete(req, res, next) {
    try {
      const { id } = req.params;

      const existingPreset = Preset.findById(id);
      if (!existingPreset) {
        return res.status(404).json({ error: 'Preset not found' });
      }

      // Check ownership (or admin)
      if (existingPreset.user_id !== req.session.userId && req.session.role !== 'admin') {
        return res.status(403).json({ error: 'Access denied' });
      }

      Preset.delete(id);

      logger.info(`Preset deleted: #${existingPreset.preset_number} by ${req.session.username}`);

      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = presetController;
