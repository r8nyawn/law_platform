const User = require('../models/User.model');
const Rating = require('../models/Rating.model');
const { validationResult } = require('express-validator');

// Получение всех пользователей
exports.getAllUsers = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      userType, 
      verificationStatus,
      search,
      sortBy = 'rating.average',
      order = 'desc'
    } = req.query;

    const query = {};

    if (userType) query.userType = userType;
    if (verificationStatus) query.verificationStatus = verificationStatus;
    
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const sort = {};
    sort[sortBy] = order === 'desc' ? -1 : 1;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const users = await User.find(query)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .select('-password -verificationData');

    const total = await User.countDocuments(query);

    res.json({
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Ошибка получения пользователей:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};

// Получение пользователя по ID
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password -verificationData')
      .populate('profile.education')
      .populate('profile.experience');

    if (!user) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Ошибка получения пользователя:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};

// Обновление профиля
exports.updateProfile = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const userId = req.user._id;
    const updateData = req.body;

    // Запрещаем обновление некоторых полей
    const forbiddenFields = ['_id', 'email', 'password', 'verificationStatus', 'rating', 'userType'];
    forbiddenFields.forEach(field => delete updateData[field]);

    // Обработка вложенных полей профиля
    if (updateData.profile) {
      const user = await User.findById(userId);
      updateData.profile = { ...user.profile.toObject(), ...updateData.profile };
    }

    const user = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    ).select('-password -verificationData');

    res.json({
      message: 'Профиль успешно обновлен',
      user
    });
  } catch (error) {
    console.error('Ошибка обновления профиля:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};

// Загрузка аватара
exports.uploadAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Файл не загружен' });
    }

    const avatarUrl = `/uploads/avatars/${req.file.filename}`;
    
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { avatar: avatarUrl },
      { new: true }
    ).select('-password');

    res.json({
      message: 'Аватар успешно загружен',
      avatar: avatarUrl,
      user
    });
  } catch (error) {
    console.error('Ошибка загрузки аватара:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};

// Получение рейтингов пользователя
exports.getUserRatings = async (req, res) => {
  try {
    const userId = req.params.id;
    const { page = 1, limit = 10 } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const ratings = await Rating.find({ toUser: userId })
      .populate('fromUser', 'firstName lastName avatar userType')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Rating.countDocuments({ toUser: userId });

    // Расчет статистики по категориям
    const stats = await Rating.aggregate([
      { $match: { toUser: userId } },
      {
        $group: {
          _id: '$category',
          average: { $avg: '$score' },
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      ratings,
      stats,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Ошибка получения рейтингов:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};

// Поиск экспертов
exports.searchExperts = async (req, res) => {
  try {
    const { 
      specialization, 
      location, 
      minRating = 0,
      userType = 'lawyer'
    } = req.query;

    const query = {
      userType,
      'rating.average': { $gte: parseFloat(minRating) },
      verificationStatus: 'verified'
    };

    if (specialization) {
      query['profile.specialization'] = { 
        $regex: specialization, 
        $options: 'i' 
      };
    }

    if (location) {
      query['profile.location.city'] = { 
        $regex: location, 
        $options: 'i' 
      };
    }

    const experts = await User.find(query)
      .sort({ 'rating.average': -1, 'rating.count': -1 })
      .limit(20)
      .select('firstName lastName avatar userType rating profile.specialization profile.location');

    res.json({ experts });
  } catch (error) {
    console.error('Ошибка поиска экспертов:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};

// Админ: получение заявок на верификацию
exports.getVerificationRequests = async (req, res) => {
  try {
    const { status = 'pending' } = req.query;

    const requests = await User.find({
      verificationStatus: status,
      userType: { $ne: 'public' }
    })
      .select('firstName lastName email userType verificationData verificationStatus createdAt')
      .sort({ 'verificationData.submittedAt': 1 });

    res.json({ requests });
  } catch (error) {
    console.error('Ошибка получения заявок:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};

// Админ: обработка заявки на верификацию
exports.processVerification = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, rejectionReason } = req.body;

    if (!['verified', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Неверный статус' });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    if (user.verificationStatus !== 'pending') {
      return res.status(400).json({ error: 'Заявка уже обработана' });
    }

    user.verificationStatus = status;
    user.verificationData.reviewedAt = new Date();
    user.verificationData.reviewedBy = req.user._id;

    if (status === 'rejected' && rejectionReason) {
      user.verificationData.rejectionReason = rejectionReason;
    }

    await user.save();

    res.json({
      message: `Заявка ${status === 'verified' ? 'одобрена' : 'отклонена'}`,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        verificationStatus: user.verificationStatus
      }
    });
  } catch (error) {
    console.error('Ошибка обработки заявки:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};