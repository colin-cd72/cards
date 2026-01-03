const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');
const { requireAdmin } = require('../middleware/auth');
const { validate } = require('../utils/validators');

// All routes require admin access
router.use(requireAdmin);

router.get('/', settingsController.list);
router.get('/:key', settingsController.get);
router.put('/:key', validate('setting'), settingsController.update);

module.exports = router;
