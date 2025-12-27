const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

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

module.exports = User;