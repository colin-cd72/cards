const express = require('express');
const router = express.Router();
const cardController = require('../controllers/cardController');
const { requireAuth, requireProducer } = require('../middleware/auth');
const { validate } = require('../utils/validators');

// Current card is public (for output page)
router.get('/current', cardController.current);

// Protected routes
router.post('/send', requireProducer, validate('card'), cardController.send);
router.post('/clear', requireProducer, cardController.clear);
router.get('/history', requireAuth, cardController.history);

module.exports = router;
