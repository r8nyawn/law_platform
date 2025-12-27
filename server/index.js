
// server/server.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const bcrypt = require('bcryptjs');
const { DataTypes } = require('sequelize');
require('dotenv').config();

const { sequelize, testConnection } = require('./src/config/database');

const app = express();

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true
}));
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ============================================
// МОДЕЛИ
// ============================================

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  email: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false,
    validate: {
      isEmail: true
    }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  first_name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  last_name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  user_type: {
    type: DataTypes.ENUM('public', 'lawyer', 'journalist', 'activist', 'admin'),
    defaultValue: 'public'
  },
  verification_status: {
    type: DataTypes.ENUM('unverified', 'pending', 'verified', 'rejected'),
    defaultValue: 'unverified'
  },
  verification_data: {
    type: DataTypes.TEXT,
    defaultValue: null
  },
  avatar: {
    type: DataTypes.STRING,
    defaultValue: null
  },
  profile_data: {
    type: DataTypes.TEXT,
    defaultValue: null
  },
  rating_average: {
    type: DataTypes.FLOAT,
    defaultValue: 0
  },
  rating_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  last_login: {
    type: DataTypes.DATE,
    defaultValue: null
  }
}, {
  tableName: 'users',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

// Простая модель форума (можно расширить позже)
const ForumThread = sequelize.define('ForumThread', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  category: {
    type: DataTypes.STRING,
    defaultValue: 'discussion'
  },
  tags: {
    type: DataTypes.TEXT,
    defaultValue: '[]'
  },
  posts: {
    type: DataTypes.TEXT,
    defaultValue: '[]'
  },
  views: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  is_pinned: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  is_closed: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  last_activity: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'forum_threads',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

// Определяем связи
User.hasMany(ForumThread, { foreignKey: 'user_id', as: 'forumThreads' });
ForumThread.belongsTo(User, { foreignKey: 'user_id', as: 'author' });

// ============================================
// API МАРШРУТЫ
// ============================================

// Тестовый маршрут
app.get('/api/health', async (req, res) => {
  try {
    const dbStatus = await testConnection();
    res.json({
      status: 'OK',
      message: 'Сервер Право ТВ работает',
      database: dbStatus ? '✅ Подключена' : '❌ Ошибка',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Ошибка health check:', error);
    res.status(500).json({ 
      error: 'Ошибка сервера',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Регистрация
app.post('/api/auth/register', async (req, res) => {
  try {
    console.log('📨 Запрос на регистрацию:', req.body);
    
    const { email, password, firstName, lastName, userType = 'public' } = req.body;

    // Валидация
    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({ 
        error: 'Все поля обязательны для заполнения',
        required: ['email', 'password', 'firstName', 'lastName']
      });
    }

    if (password.length < 6) {
      return res.status(400).json({ 
        error: 'Пароль должен содержать минимум 6 символов' 
      });
    }

    // Проверяем существование пользователя
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'Пользователь с таким email уже существует' });
    }

    // Хэшируем пароль
    const hashedPassword = await bcrypt.hash(password, 10);

    // Создаем пользователя
    const user = await User.create({
      email: email.trim(),
      password: hashedPassword,
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      user_type: userType,
      verification_status: userType === 'public' ? 'unverified' : 'pending',
      is_active: true,
      rating_average: 0,
      rating_count: 0
    });

    console.log('✅ Пользователь создан:', user.id);

    // Генерируем токен
    const token = `jwt-${Date.now()}-${user.id}`;

    // Парсим профиль
    let profileData = {};
    try {
      profileData = user.profile_data ? JSON.parse(user.profile_data) : {};
    } catch (e) {
      profileData = {};
    }

    res.status(201).json({
      message: 'Пользователь успешно зарегистрирован',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        userType: user.user_type,
        verificationStatus: user.verification_status,
        avatar: user.avatar || null,
        rating: {
          average: user.rating_average || 0,
          count: user.rating_count || 0
        },
        phone: profileData.phone || null,
        website: profileData.website || null,
        location: profileData.location || null,
        bio: profileData.bio || null,
        specialization: profileData.specialization || null
      },
      token
    });

  } catch (error) {
    console.error('❌ Ошибка регистрации:', error);
    
    const errorResponse = {
      error: 'Ошибка сервера при регистрации',
      timestamp: new Date().toISOString()
    };

    if (process.env.NODE_ENV === 'development') {
      errorResponse.details = error.message;
      errorResponse.stack = error.stack;
    }

    res.status(500).json(errorResponse);
  }
});

// Вход
app.post('/api/auth/login', async (req, res) => {
  try {
    console.log('📨 Запрос на вход:', req.body.email);
    
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email и пароль обязательны' });
    }

    const user = await User.findOne({ where: { email } });

    if (!user) {
      console.log('❌ Пользователь не найден:', email);
      return res.status(401).json({ error: 'Неверный email или пароль' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      console.log('❌ Неверный пароль для пользователя:', email);
      return res.status(401).json({ error: 'Неверный email или пароль' });
    }

    if (!user.is_active) {
      return res.status(403).json({ error: 'Аккаунт деактивирован' });
    }

    // Обновляем время последнего входа
    await user.update({ last_login: new Date() });

    // Генерируем токен
    const token = `jwt-${Date.now()}-${user.id}`;

    // Парсим профиль
    let profileData = {};
    try {
      profileData = user.profile_data ? JSON.parse(user.profile_data) : {};
    } catch (e) {
      profileData = {};
    }

    res.json({
      message: 'Вход выполнен успешно',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        userType: user.user_type,
        verificationStatus: user.verification_status,
        avatar: user.avatar || null,
        rating: {
          average: user.rating_average || 0,
          count: user.rating_count || 0
        },
        phone: profileData.phone || null,
        website: profileData.website || null,
        location: profileData.location || null,
        bio: profileData.bio || null,
        specialization: profileData.specialization || null
      },
      token
    });

  } catch (error) {
    console.error('❌ Ошибка входа:', error);
    
    res.status(500).json({ 
      error: 'Ошибка сервера при входе',
      timestamp: new Date().toISOString(),
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Получение текущего пользователя
app.get('/api/auth/me', async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Токен не предоставлен' });
    }

    // Упрощенная проверка токена
    if (token.startsWith('jwt-')) {
      const parts = token.split('-');
      if (parts.length >= 3) {
        const userId = parts[2];
        const user = await User.findByPk(userId);
        
        if (user) {
          // Парсим профиль
          let profileData = {};
          try {
            profileData = user.profile_data ? JSON.parse(user.profile_data) : {};
          } catch (e) {
            profileData = {};
          }

          return res.json({
            user: {
              id: user.id,
              email: user.email,
              firstName: user.first_name,
              lastName: user.last_name,
              userType: user.user_type,
              verificationStatus: user.verification_status,
              avatar: user.avatar || null,
              rating: {
                average: user.rating_average || 0,
                count: user.rating_count || 0
              },
              phone: profileData.phone || null,
              website: profileData.website || null,
              location: profileData.location || null,
              bio: profileData.bio || null,
              specialization: profileData.specialization || null
            }
          });
        }
      }
    }

    return res.status(401).json({ error: 'Неверный токен' });

  } catch (error) {
    console.error('Ошибка получения пользователя:', error);
    res.status(500).json({ 
      error: 'Ошибка сервера',
      timestamp: new Date().toISOString()
    });
  }
});
// Получение профиля текущего пользователя
app.get('/api/users/profile', async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Токен не предоставлен' });
    }

    // Упрощенная проверка токена
    if (token.startsWith('jwt-')) {
      const parts = token.split('-');
      if (parts.length >= 3) {
        const userId = parts[2];
        const user = await User.findByPk(userId);
        
        if (user) {
          // Парсим профиль
          let profileData = {};
          try {
            profileData = user.profile_data ? JSON.parse(user.profile_data) : {};
          } catch (e) {
            profileData = {};
          }

          return res.json({
            user: {
              id: user.id,
              email: user.email,
              username: user.username,
              firstName: user.first_name,
              lastName: user.last_name,
              userType: user.user_type,
              verificationStatus: user.verification_status,
              avatar: user.avatar || null,
              rating: {
                average: user.rating_average || 0,
                count: user.rating_count || 0
              },
              phone: profileData.phone || null,
              website: profileData.website || null,
              location: profileData.location || null,
              bio: profileData.bio || null,
              specialization: profileData.specialization || null
            }
          });
        }
      }
    }

    return res.status(401).json({ error: 'Неверный токен' });

  } catch (error) {
    console.error('Ошибка получения профиля:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});
// Получение пользователя по ID
app.get('/api/users/:id', async (req, res) => {
  if (req.params.id === 'profile') return next();
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: { exclude: ['password', 'verification_data'] }
    });

    if (!user) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    // Парсим профиль
    let profileData = {};
    try {
      profileData = user.profile_data ? JSON.parse(user.profile_data) : {};
    } catch (e) {
      profileData = {};
    }

    res.json({
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        user_type: user.user_type,
        verification_status: user.verification_status,
        avatar: user.avatar,
        rating_average: user.rating_average,
        rating_count: user.rating_count,
        profile_data: profileData
      }
    });
  } catch (error) {
    console.error('Ошибка получения пользователя:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});



// Обновление профиля
// Обновление профиля текущего пользователя
app.put('/api/users/profile', async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'Не авторизован' });

    // Извлекаем ID из твоего кастомного токена "jwt-timestamp-id"
    const userId = token.split('-')[2];
    if (!userId) return res.status(401).json({ error: 'Неверный токен' });

    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ error: 'Пользователь не найден' });

    const { firstName, lastName, phone, location, bio, specialization } = req.body;

    // 1. Обновляем основные поля
    if (firstName) user.first_name = firstName;
    if (lastName) user.last_name = lastName;

    // 2. Упаковываем дополнительные поля в profile_data
    const currentProfileData = user.profile_data ? JSON.parse(user.profile_data) : {};
    
    const updatedProfileData = {
      ...currentProfileData,
      phone: phone !== undefined ? phone : currentProfileData.phone,
      location: location !== undefined ? location : currentProfileData.location,
      bio: bio !== undefined ? bio : currentProfileData.bio,
      specialization: specialization !== undefined ? specialization : currentProfileData.specialization
    };

    user.profile_data = JSON.stringify(updatedProfileData);

    await user.save();

    res.json({ 
      message: 'Профиль обновлен', 
      user: {
        ...user.toJSON(),
        // Сразу парсим обратно для фронтенда, чтобы он мог обновить стейт
        firstName: user.first_name,
        lastName: user.last_name,
        ...updatedProfileData
      }
    });
  } catch (error) {
    console.error('Ошибка при обновлении профиля:', error);
    res.status(400).json({ error: 'Ошибка при сохранении данных', details: error.message });
  }
});

// Запрос на верификацию
app.post('/api/users/request-verification', async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Токен не предоставлен' });
    }

    // Упрощенная проверка токена
    if (token.startsWith('jwt-')) {
      const parts = token.split('-');
      if (parts.length >= 3) {
        const userId = parts[2];
        const user = await User.findByPk(userId);
        
        if (!user) {
          return res.status(404).json({ error: 'Пользователь не найден' });
        }

        if (user.user_type === 'public') {
          return res.status(400).json({ error: 'Верификация недоступна для пользовательского типа "public"' });
        }

        if (user.verification_status === 'verified') {
          return res.status(400).json({ error: 'Аккаунт уже верифицирован' });
        }

        if (user.verification_status === 'pending') {
          return res.status(400).json({ error: 'Заявка уже находится на рассмотрении' });
        }

        user.verification_status = 'pending';
        await user.save();

        res.json({
          message: 'Заявка на верификацию отправлена',
          verificationStatus: user.verification_status
        });
      }
    }

    return res.status(401).json({ error: 'Неверный токен' });

  } catch (error) {
    console.error('Ошибка запроса верификации:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Получение всех пользователей
app.get('/api/users', async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ['password', 'verification_data'] },
      where: { is_active: true },
      order: [['rating_average', 'DESC']],
      limit: 50
    });

    // Форматируем ответ
    const formattedUsers = users.map(user => {
      let profileData = {};
      try {
        profileData = user.profile_data ? JSON.parse(user.profile_data) : {};
      } catch (e) {
        profileData = {};
      }

      return {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        userType: user.user_type,
        verificationStatus: user.verification_status,
        avatar: user.avatar,
        rating: {
          average: user.rating_average,
          count: user.rating_count
        },
        phone: profileData.phone || null,
        website: profileData.website || null,
        location: profileData.location || null,
        bio: profileData.bio || null,
        specialization: profileData.specialization || null,
        createdAt: user.created_at,
        lastLogin: user.last_login
      };
    });

    res.json({ users: formattedUsers });
  } catch (error) {
    console.error('Ошибка получения пользователей:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// ============================================
// ФОРУМ
// ============================================

// Получение всех тем
app.get('/api/forum/threads', async (req, res) => {
  try {
    const { category, search, page = 1, limit = 20 } = req.query;

    let where = {};
    
    // Фильтр по категории
    if (category && category !== 'all') {
      where.category = category;
    }
    
    // Фильтр по поиску
    if (search) {
      where[sequelize.Op.or] = [
        { title: { [sequelize.Op.like]: `%${search}%` } },
        { content: { [sequelize.Op.like]: `%${search}%` } }
      ];
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const threads = await ForumThread.findAll({
      where,
      include: [{
        model: User,
        as: 'author',
        attributes: ['id', 'first_name', 'last_name', 'avatar', 'user_type', 'verification_status']
      }],
      order: [
        ['is_pinned', 'DESC'],
        ['last_activity', 'DESC']
      ],
      limit: parseInt(limit),
      offset: offset
    });

    // Форматируем ответ
    const formattedThreads = threads.map(thread => {
      let tags = [];
      let posts = [];
      
      try {
        tags = thread.tags ? JSON.parse(thread.tags) : [];
      } catch (e) {
        tags = [];
      }
      
      try {
        posts = thread.posts ? JSON.parse(thread.posts) : [];
      } catch (e) {
        posts = [];
      }

      return {
        id: thread.id,
        title: thread.title,
        content: thread.content,
        excerpt: thread.content.substring(0, 200) + (thread.content.length > 200 ? '...' : ''),
        author: thread.author,
        category: thread.category,
        tags: tags,
        views: thread.views,
        postsCount: posts.length,
        isPinned: thread.is_pinned,
        isClosed: thread.is_closed,
        lastActivity: thread.last_activity,
        createdAt: thread.created_at
      };
    });

    res.json({
      threads: formattedThreads
    });
  } catch (error) {
    console.error('Ошибка получения тем:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Получение одной темы
app.get('/api/forum/threads/:id', async (req, res) => {
  try {
    const thread = await ForumThread.findByPk(req.params.id, {
      include: [{
        model: User,
        as: 'author',
        attributes: ['id', 'first_name', 'last_name', 'avatar', 'user_type', 'verification_status']
      }]
    });

    if (!thread) {
      return res.status(404).json({ error: 'Тема не найдена' });
    }

    // Увеличиваем счетчик просмотров
    thread.views += 1;
    await thread.save();

    // Парсим данные
    let tags = [];
    let posts = [];
    
    try {
      tags = thread.tags ? JSON.parse(thread.tags) : [];
    } catch (e) {
      tags = [];
    }
    
    try {
      posts = thread.posts ? JSON.parse(thread.posts) : [];
    } catch (e) {
      posts = [];
    }

    // Получаем авторов постов
    const postsWithAuthors = await Promise.all(
      posts.map(async (post) => {
        const author = await User.findByPk(post.author, {
          attributes: ['id', 'first_name', 'last_name', 'avatar', 'user_type', 'verification_status']
        });
        return {
          ...post,
          author: author || null
        };
      })
    );

    res.json({
      thread: {
        id: thread.id,
        title: thread.title,
        content: thread.content,
        author: thread.author,
        category: thread.category,
        tags: tags,
        views: thread.views,
        posts: postsWithAuthors,
        isPinned: thread.is_pinned,
        isClosed: thread.is_closed,
        lastActivity: thread.last_activity,
        createdAt: thread.created_at
      }
    });
  } catch (error) {
    console.error('Ошибка получения темы:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// --- 1. Middleware (должен быть в самом верху) ---
const authenticateToken = (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token || !token.startsWith('jwt-')) return res.status(401).json({ error: 'Требуется авторизация' });
    try {
        const userId = parseInt(token.split('-')[2]);
        req.user = { id: userId };
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Неверный токен' });
    }
};

// --- 2. РОУТЫ ДЛЯ ТЕМ (THREADS) ---

// Создание темы
app.post('/api/forum/threads', authenticateToken, async (req, res) => {
    try {
        const { title, content, category, tags } = req.body;
        const thread = await ForumThread.create({
            title, content, category,
            user_id: req.user.id,
            tags: JSON.stringify(tags || []),
            posts: JSON.stringify([]),
            last_activity: new Date()
        });
        return res.status(201).json({ message: 'Тема создана', thread });
    } catch (error) {
        return res.status(500).json({ error: 'Ошибка сервера при создании темы' });
    }
});

// Удаление темы
app.delete('/api/forum/threads/:id', authenticateToken, async (req, res) => {
    try {
        const thread = await ForumThread.findByPk(req.params.id);
        if (!thread) return res.status(404).json({ error: 'Тема не найдена' });
        
        const user = await User.findByPk(req.user.id);
        if (String(thread.user_id) !== String(req.user.id) && user.user_type !== 'admin') {
            return res.status(403).json({ error: 'Нет прав' });
        }
        await thread.destroy();
        return res.json({ message: 'Тема удалена' });
    } catch (error) {
        return res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// --- 3. РОУТЫ ДЛЯ КОММЕНТАРИЕВ (POSTS ВНУТРИ THREADS) ---

// Добавление комментария
app.post('/api/forum/threads/:id/posts', authenticateToken, async (req, res) => {
    try {
        const thread = await ForumThread.findByPk(req.params.id);
        if (!thread) return res.status(404).json({ error: 'Тема не найдена' });

        const { content } = req.body;
        let posts = JSON.parse(thread.posts || '[]');
        
        const newPost = {
            id: Date.now().toString(),
            author: req.user.id,
            content: content.trim(),
            createdAt: new Date().toISOString()
        };

        posts.push(newPost);
        thread.posts = JSON.stringify(posts);
        thread.last_activity = new Date();
        await thread.save();

        // Важно подтянуть данные автора для фронтенда
        const user = await User.findByPk(req.user.id);
        return res.status(201).json({ 
            message: 'Комментарий добавлен', 
            post: { ...newPost, author: user } 
        });
    } catch (error) {
        return res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// Удаление комментария
app.delete('/api/forum/threads/:id/posts/:postId', authenticateToken, async (req, res) => {
    try {
        const thread = await ForumThread.findByPk(req.params.id);
        if (!thread) return res.status(404).json({ error: 'Тема не найдена' });

        let posts = JSON.parse(thread.posts || '[]');
        const postIndex = posts.findIndex(p => String(p.id) === String(req.params.postId));
        
        if (postIndex === -1) return res.status(404).json({ error: 'Комментарий не найден' });

        const user = await User.findByPk(req.user.id);
        if (String(posts[postIndex].author) !== String(req.user.id) && user.user_type !== 'admin') {
            return res.status(403).json({ error: 'Нет прав' });
        }

        posts.splice(postIndex, 1);
        thread.posts = JSON.stringify(posts);
        await thread.save();
        return res.json({ message: 'Комментарий удален' });
    } catch (error) {
        return res.status(500).json({ error: 'Ошибка сервера' });
    }
});
// Получение тем конкретного пользователя для профиля
app.get('/api/forum/user-topics', async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'Нет токена' });

    // Извлекаем ID из твоего кастомного JWT-формата
    const parts = token.split('-');
    const userId = parts[2]; 

    // Находим все темы, где user_id совпадает с ID авторизованного пользователя
    const threads = await ForumThread.findAll({
      where: { user_id: userId }, // Проверь, что в БД колонка называется user_id
      order: [['created_at', 'DESC']]
    });

    // Считаем общую статитстику для вкладок
    let totalComments = 0;
    threads.forEach(t => {
      try {
        const posts = JSON.parse(t.posts || '[]');
        totalComments += posts.length;
      } catch (e) { console.error(e); }
    });

    // Возвращаем объект, который ожидает твой фронтенд
    res.json({
      topics: threads,
      total: threads.length,
      totalComments: totalComments,
      totalLikes: 0
    });
  } catch (error) {
    console.error('Ошибка загрузки тем пользователя:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});
app.delete('/api/forum/topics/:id', async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'Нет токена' });

    // Парсим ID пользователя из токена
    const parts = token.split('-');
    const userId = parts[2];
    const topicId = req.params.id;

    // Ищем тему
    const topic = await ForumThread.findByPk(topicId);

    if (!topic) {
      return res.status(404).json({ error: 'Тема не найдена' });
    }

    // Проверка прав: совпадает ли ID создателя с ID из токена
    if (topic.user_id.toString() !== userId.toString()) {
      return res.status(403).json({ error: 'У вас нет прав на удаление этой темы' });
    }

    await topic.destroy();
    res.json({ message: 'Тема успешно удалена' });
  } catch (error) {
    console.error('Ошибка при удалении темы:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});
// ============================================
// АДМИНИСТРАТИВНЫЕ МАРШРУТЫ
// ============================================

// Получение всех пользователей (админ)
app.get('/api/admin/users', async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Требуется авторизация' });
    }

    // Упрощенная проверка токена
    if (token.startsWith('jwt-')) {
      const parts = token.split('-');
      if (parts.length >= 3) {
        const userId = parts[2];
        const user = await User.findByPk(userId);
        
        if (!user) {
          return res.status(401).json({ error: 'Пользователь не найден' });
        }

        // Проверяем права администратора
        if (user.user_type !== 'admin') {
          return res.status(403).json({ error: 'Требуются права администратора' });
        }

        const users = await User.findAll({
          attributes: { exclude: ['password', 'verification_data'] },
          order: [['created_at', 'DESC']]
        });
        
        res.json({ users });
      }
    }

    return res.status(401).json({ error: 'Неверный формат токена' });
    
  } catch (error) {
    console.error('Ошибка получения пользователей:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Управление верификацией (админ)
app.put('/api/admin/users/:id/verification', async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Требуется авторизация' });
    }

    // Упрощенная проверка токена
    if (token.startsWith('jwt-')) {
      const parts = token.split('-');
      if (parts.length >= 3) {
        const userId = parts[2];
        const adminUser = await User.findByPk(userId);
        
        if (!adminUser) {
          return res.status(401).json({ error: 'Пользователь не найден' });
        }

        // Проверяем права администратора
        if (adminUser.user_type !== 'admin') {
          return res.status(403).json({ error: 'Требуются права администратора' });
        }

        const { status } = req.body;
        
        if (!['verified', 'pending', 'rejected', 'unverified'].includes(status)) {
          return res.status(400).json({ error: 'Недопустимый статус верификации' });
        }

        const user = await User.findByPk(req.params.id);
        if (!user) {
          return res.status(404).json({ error: 'Пользователь не найден' });
        }

        user.verification_status = status;
        await user.save();

        res.json({
          message: `Статус верификации обновлен на "${status}"`,
          user: {
            id: user.id,
            email: user.email,
            first_name: user.first_name,
            last_name: user.last_name,
            user_type: user.user_type,
            verification_status: user.verification_status
          }
        });
      }
    }

    return res.status(401).json({ error: 'Неверный формат токена' });
    
  } catch (error) {
    console.error('Ошибка обновления верификации:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// ============================================
// СТАТЬИ
// ============================================

app.get('/api/articles', (req, res) => {
  res.json({
    articles: [
      {
        id: 1,
        title: 'Обзор изменений в законодательстве 2024',
        excerpt: 'Подробный анализ основных изменений...',
        author: {
          id: 2,
          first_name: 'Александр',
          last_name: 'Иванов'
        },
        views: 1200,
        likes: 45
      }
    ]
  });
});
// Удаление всей темы целиком
app.delete('/api/forum/threads/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id; // Из authenticateToken

    // Находим тему
    const thread = await ForumThread.findByPk(id);
    
    if (!thread) {
      return res.status(404).json({ error: 'Тема не найдена' });
    }

    // Проверяем права: только автор темы или админ
    // В логах видно, что поле называется user_id
    const isAuthor = String(thread.user_id) === String(userId);
    
    // Получаем юзера, чтобы проверить роль админа
    const user = await User.findByPk(userId);
    const isAdmin = user && (user.user_type === 'admin' || user.userType === 'admin');

    if (!isAuthor && !isAdmin) {
      return res.status(403).json({ error: 'У вас нет прав на удаление этой темы' });
    }

    // Удаляем тему из БД
    await thread.destroy();

    return res.json({ message: 'Тема успешно удалена' });
  } catch (error) {
    console.error('Ошибка при удалении темы:', error);
    return res.status(500).json({ error: 'Ошибка сервера при удалении темы' });
  }
});
// ============================================
// ОБРАБОТКА ОШИБОК
// ============================================

// Тестовый маршрут
app.get('/api/test', (req, res) => {
  res.json({
    message: 'Сервер работает!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0'
  });
});

// Обработка 404
app.use('/api/*', (req, res) => {
  res.status(404).json({ 
    error: 'API маршрут не найден',
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

// Глобальная обработка ошибок
app.use((err, req, res, next) => {
  console.error('❌ Глобальная ошибка сервера:', err);
  
  const errorResponse = {
    error: 'Внутренняя ошибка сервера',
    timestamp: new Date().toISOString()
  };

  if (process.env.NODE_ENV === 'development') {
    errorResponse.message = err.message;
    errorResponse.stack = err.stack;
  }

  res.status(err.status || 500).json(errorResponse);
});

// ============================================
// ЗАПУСК СЕРВЕРА
// ============================================

const PORT = process.env.PORT || 5000;

// Функция инициализации базы данных
const initializeDatabase = async () => {
  try {
    // Синхронизируем базу данных
    await sequelize.sync({ force: false });
    console.log('✅ База данных синхронизирована');
    
    // Проверяем есть ли пользователи
    const userCount = await User.count();
    
    if (userCount === 0) {
      console.log('🔄 Создаю тестовых пользователей...');
      
      const users = [
        {
          email: 'sokoloovaa.anastasia@gmail.com',
          password: await bcrypt.hash('frowergdjdurv1468*!', 10),
          first_name: 'Администратор',
          last_name: 'Системы',
          user_type: 'admin',
          verification_status: 'verified',
          is_active: true,
          rating_average: 5.0,
          rating_count: 10
        },
      ];

      for (const userData of users) {
        await User.create(userData);
      }
      
      console.log('✅ Тестовые пользователи созданы');
    }
    
    console.log('✅ База данных готова');
  } catch (error) {
    console.error('❌ Ошибка инициализации БД:', error);
    throw error;
  }
};

// Запуск сервера
const startServer = async () => {
  try {
    console.log('🚀 Запуск сервера...');
    
    // Проверяем подключение к БД
    console.log('🔗 Проверка подключения к базе данных...');
    const dbConnected = await testConnection();
    if (!dbConnected) {
      throw new Error('Не удалось подключиться к базе данных');
    }
    console.log('✅ Подключение к БД установлено');
    
    // Инициализируем базу данных
    await initializeDatabase();
    
    // Запускаем сервер
    app.listen(PORT, () => {
      console.log(`\n Сервер запущен на порту ${PORT}`);
      console.log(` Режим: ${process.env.NODE_ENV || 'development'}`);
      console.log(` Основной URL: http://localhost:${PORT}`);
      console.log(` Проверка сервера: http://localhost:${PORT}/api/health`);
      console.log(` Тестовый маршрут: http://localhost:${PORT}/api/test`);
      console.log(`\n Тестовые пользователи`);
    });
    
  } catch (error) {
    console.error('❌ Ошибка запуска сервера:', error);
    process.exit(1);
  }
};

// Запускаем сервер
startServer();