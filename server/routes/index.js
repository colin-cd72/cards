const express = require('express');
const router = express.Router();

const authRoutes = require('./auth');
const userRoutes = require('./users');
const presetRoutes = require('./presets');
const cardRoutes = require('./cards');
const settingsRoutes = require('./settings');

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/presets', presetRoutes);
router.use('/cards', cardRoutes);
router.use('/settings', settingsRoutes);

// Health check
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

module.exports = router;
