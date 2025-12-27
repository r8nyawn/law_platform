const User = require('../models/User.model');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');

// Генерация токенов
const generateTokens = (userId) => {
  const accessToken = jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );

  const refreshToken = jwt.sign(
    { userId },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRE || '30d' }
  );

  return { accessToken, refreshToken };
};

// Регистрация
exports.register = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, firstName, lastName, userType } = req.body;

    // Проверка существующего пользователя
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Пользователь с таким email уже существует' });
    }

    // Создание пользователя
    const user = new User({
      email,
      password,
      firstName,
      lastName,
      userType,
      verificationStatus: userType === 'public' ? 'unverified' : 'pending'
    });

    await user.save();

    // Генерация токенов
    const tokens = generateTokens(user._id);

    // Обновляем lastLogin
    user.lastLogin = new Date();
    await user.save();

    res.status(201).json({
      message: 'Пользователь успешно зарегистрирован',
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        userType: user.userType,
        verificationStatus: user.verificationStatus,
        avatar: user.avatar
      },
      tokens
    });
  } catch (error) {
    console.error('Ошибка регистрации:', error);
    res.status(500).json({ error: 'Ошибка сервера при регистрации' });
  }
};

// Вход
exports.login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Поиск пользователя
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ error: 'Неверный email или пароль' });
    }

    // Проверка пароля
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Неверный email или пароль' });
    }

    // Проверка активности
    if (!user.isActive) {
      return res.status(403).json({ error: 'Аккаунт деактивирован' });
    }

    // Генерация токенов
    const tokens = generateTokens(user._id);

    // Обновляем lastLogin
    user.lastLogin = new Date();
    await user.save();

    res.json({
      message: 'Вход выполнен успешно',
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        userType: user.userType,
        verificationStatus: user.verificationStatus,
        avatar: user.avatar,
        rating: user.rating
      },
      tokens
    });
  } catch (error) {
    console.error('Ошибка входа:', error);
    res.status(500).json({ error: 'Ошибка сервера при входе' });
  }
};

// Получение текущего пользователя
exports.getMe = async (req, res) => {
  try {
    res.json({
      user: req.user
    });
  } catch (error) {
    console.error('Ошибка получения профиля:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};

// Обновление токена
exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh токен обязателен' });
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({ error: 'Пользователь не найден' });
    }

    const tokens = generateTokens(user._id);

    res.json({
      message: 'Токен обновлен',
      tokens
    });
  } catch (error) {
    console.error('Ошибка обновления токена:', error);
    res.status(401).json({ error: 'Невалидный refresh токен' });
  }
};

// Выход
exports.logout = async (req, res) => {
  try {
    // В реальном приложении здесь можно добавить логику для добавления токена в черный список
    res.json({ message: 'Выход выполнен успешно' });
  } catch (error) {
    console.error('Ошибка выхода:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};

// Запрос верификации
exports.requestVerification = async (req, res) => {
  try {
    const user = req.user;
    
    if (user.userType === 'public') {
      return res.status(400).json({ 
        error: 'Пользователи типа "public" не могут запрашивать верификацию' 
      });
    }

    if (user.verificationStatus === 'verified') {
      return res.status(400).json({ 
        error: 'Аккаунт уже верифицирован' 
      });
    }

    if (user.verificationStatus === 'pending') {
      return res.status(400).json({ 
        error: 'Заявка на верификацию уже находится на рассмотрении' 
      });
    }

    user.verificationStatus = 'pending';
    user.verificationData = {
      ...user.verificationData,
      submittedAt: new Date()
    };

    await user.save();

    res.json({
      message: 'Заявка на верификацию отправлена',
      verificationStatus: user.verificationStatus
    });
  } catch (error) {
    console.error('Ошибка запроса верификации:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};