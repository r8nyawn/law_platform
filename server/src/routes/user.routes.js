const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const userController = require('../controllers/user.controller');
const { auth, requireVerification, requireAdmin } = require('../middleware/auth.middleware');
const { uploadAvatar } = require('../middleware/upload.middleware');

// Публичные маршруты
router.get('/', userController.getAllUsers);
router.get('/search/experts', userController.searchExperts);
router.get('/:id', userController.getUserById);
router.get('/:id/ratings', userController.getUserRatings);

// Защищенные маршруты
router.put('/profile', [
  auth,
  body('firstName').optional().notEmpty().withMessage('Имя не может быть пустым'),
  body('lastName').optional().notEmpty().withMessage('Фамилия не может быть пустой'),
  body('profile.bio').optional().isLength({ max: 1000 }).withMessage('Био не должно превышать 1000 символов')
], userController.updateProfile);

router.post('/avatar', auth, uploadAvatar, userController.uploadAvatar);

// Админ маршруты
router.get('/admin/verification-requests', auth, requireAdmin, userController.getVerificationRequests);
router.put('/admin/verification/:id', auth, requireAdmin, userController.processVerification);

module.exports = router;