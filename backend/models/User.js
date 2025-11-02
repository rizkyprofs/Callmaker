// models/User.js - UPDATED VERSION
import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';
import Signal from './Signal.js';

const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  role: {
    type: DataTypes.ENUM('user', 'admin'),
    defaultValue: 'user',
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  updatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'users',
  timestamps: true,
});

// Associations
User.associate = (models) => {
  User.hasMany(models.Signal, {
    foreignKey: 'userId',
    as: 'signals'
  });
};

Signal.associate = (models) => {
  Signal.belongsTo(models.User, {
    foreignKey: 'userId',
    as: 'user'
  });
};

export default User;