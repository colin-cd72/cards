const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { requireAdmin } = require('../middleware/auth');
const { validate } = require('../utils/validators');

// All routes require admin access
router.use(requireAdmin);

router.get('/', userController.list);
router.get('/:id', userController.get);
router.post('/', validate('createUser'), userController.create);
router.put('/:id', validate('updateUser'), userController.update);
router.put('/:id/password', validate('changePassword'), userController.changePassword);
router.delete('/:id', userController.delete);

module.exports = router;
