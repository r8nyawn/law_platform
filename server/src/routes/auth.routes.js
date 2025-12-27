const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const authController = require('../controllers/auth.controller');
const { auth } = require('../middleware/auth.middleware');
const { uploadDocument } = require('../middleware/upload.middleware');

// Валидация
const registerValidation = [
  body('email').isEmail().withMessage('Неверный формат email'),
  body('password').isLength({ min: 6 }).withMessage('Пароль должен быть минимум 6 символов'),
  body('firstName').notEmpty().withMessage('Имя обязательно'),
  body('lastName').notEmpty().withMessage('Фамилия обязательна'),
  body('userType').isIn(['lawyer', 'journalist', 'activist', 'public']).withMessage('Неверный тип пользователя')
];

const loginValidation = [
  body('email').isEmail().withMessage('Неверный формат email'),
  body('password').notEmpty().withMessage('Пароль обязателен')
];

// Маршруты
router.post('/register', registerValidation, authController.register);
router.post('/login', loginValidation, authController.login);
router.post('/refresh', authController.refreshToken);
router.post('/logout', auth, authController.logout);
router.get('/me', auth, authController.getMe);
router.post('/verification/request', auth, authController.requestVerification);

module.exports = router;