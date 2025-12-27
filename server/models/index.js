const { DataTypes } = require('sequelize');
const sequelize = require('../config/database').sequelize;

const User = require('./User.model')(sequelize, DataTypes);
const Article = require('./Article.model')(sequelize, DataTypes);
const Rating = require('./Rating.model')(sequelize, DataTypes);
const ForumThread = require('./Forum.model')(sequelize, DataTypes);

// Определяем связи
User.hasMany(Article, { foreignKey: 'user_id', as: 'articles' });
Article.belongsTo(User, { foreignKey: 'user_id', as: 'author' });

User.hasMany(Rating, { foreignKey: 'user_id', as: 'ratings' });
Rating.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

User.hasMany(ForumThread, { foreignKey: 'user_id', as: 'forumThreads' });
ForumThread.belongsTo(User, { foreignKey: 'user_id', as: 'author' });

module.exports = {
  sequelize,
  User,
  Article,
  Rating,
  ForumThread
};