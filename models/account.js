const { Sequelize } = require('sequelize');
const sequelize = require('../config/database');

const Account = sequelize.define('accounts', {
  id: {
    allowNull: false,
    autoIncrement: true,
    primaryKey: true,
    type: Sequelize.INTEGER,
  },
  username: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  email: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  role: {
    type: Sequelize.ENUM('admin', 'resident', 'staff'),
    allowNull: false, 
  },
  password: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  image: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  status: {
    type: Sequelize.STRING,
    allowNull: false,
    defaultValue: 'pending',
  },
  createdAt: {
    allowNull: false,
    type: Sequelize.DATE,
  },
  updatedAt: {
    allowNull: false,
    type: Sequelize.DATE,
  },
  resettoken: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  annualleavedays: {
    type: Sequelize.INTEGER,
    defaultValue: 18,
  },
  remainingleavedays: {
    type: Sequelize.INTEGER,
    allowNull: true,
    defaultValue: 0,
  },
  consumeddays: {
    type: Sequelize.INTEGER,
    allowNull: true,
    defaultValue: 0,
  },
  resettokenexpires: {
    type: Sequelize.BIGINT,
    allowNull: true,
  },
} ,{tableName:"accounts"});
// Account.associate = (models)=>{
//   Account.hasMany(models.Leaves ,{
//     foreignKey:"userId" , 
//     as:"leaves"
//   })
// }

module.exports = Account;
