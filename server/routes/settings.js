const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');
const { requireAdmin } = require('../middleware/auth');
const { validate } = require('../utils/validators');

// Public route for output settings (no auth required)
router.get('/public/output', settingsController.getOutputSettings);

// Admin routes
router.get('/', requireAdmin, settingsController.list);
router.get('/:key', requireAdmin, settingsController.get);
router.put('/:key', requireAdmin, validate('setting'), settingsController.update);

module.exports = router;
