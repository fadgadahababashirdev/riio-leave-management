const { Sequelize } = require('sequelize');
const sequelize = require('../config/database');

const Leaves = sequelize.define('leaves', {
  id: {
    allowNull: false,
    autoIncrement: true,
    primaryKey: true,
    type: Sequelize.INTEGER,
  },
  leavename: {
    type: Sequelize.STRING,
  },
  leavestart: {
    type: Sequelize.DATE,
  },
  leaveend: {
    type: Sequelize.DATE,
  },
  // userId: {
  //   type: Sequelize.INTEGER,
  // },
  leavedays: {
    type: Sequelize.INTEGER,
  },
  returningfromleave: {
    type: Sequelize.DATE,
  },
  leavereason: {
    type: Sequelize.STRING,
  },
  image: {
    type: Sequelize.STRING,
  },
  createdAt: {
    allowNull: false,
    type: Sequelize.DATE,
  },
  status: {
    type: Sequelize.ENUM('pending','approved','rejected'),
    defaultValue: 'pending',
  },
  userId:{
    type:Sequelize.INTEGER ,
    
  
  } ,
  username:{
    type:Sequelize.STRING
  } ,
  updatedAt: {
    allowNull: false,
    type: Sequelize.DATE,
  },
} , {tableName:"leaves"});

// Leaves.associate = (models) => {
//   Leaves.belongsTo(models.Account, {
//     foreignKey: 'userId',
//     as: 'user',
//   });
// };
module.exports = Leaves;
