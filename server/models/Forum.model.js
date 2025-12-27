const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const User = require('./User.model');

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
    allowNull: false,
    references: {
      model: User,
      key: 'id'
    }
  },
  category: {
    type: DataTypes.ENUM(
      'legislation',
      'court',
      'media',
      'ethics',
      'consultation',
      'discussion',
      'news'
    ),
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

// Связи
ForumThread.belongsTo(User, { foreignKey: 'user_id', as: 'author' });
User.hasMany(ForumThread, { foreignKey: 'user_id', as: 'threads' });

module.exports = ForumThread;