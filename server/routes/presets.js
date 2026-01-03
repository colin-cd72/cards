const express = require('express');
const router = express.Router();
const presetController = require('../controllers/presetController');
const { requireAuth } = require('../middleware/auth');
const { validate } = require('../utils/validators');

// All routes require authentication
router.use(requireAuth);

router.get('/', presetController.list);
router.get('/global', presetController.listGlobal);
router.get('/search', presetController.search);
router.get('/number/:number', presetController.getByNumber);
router.get('/:id', presetController.get);
router.post('/', validate('preset'), presetController.create);
router.put('/:id', validate('preset'), presetController.update);
router.delete('/:id', presetController.delete);

module.exports = router;
