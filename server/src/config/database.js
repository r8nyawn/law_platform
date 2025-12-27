// server/config/database.js
const { Sequelize } = require('sequelize');
const path = require('path');

// Правильный путь к базе данных
const dbPath = path.join(__dirname, '..', 'database.sqlite');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: dbPath,
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  define: {
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
});

// Тестирование подключения
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ SQLite подключена успешно');
    return true;
  } catch (error) {
    console.error('❌ Ошибка подключения к SQLite:', error.message);
    return false;
  }
};

module.exports = { sequelize, testConnection };