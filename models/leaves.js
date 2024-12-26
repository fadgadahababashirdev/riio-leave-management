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
    type: Sequelize.INTEGER,
  },
  leavereason: {
    type: Sequelize.STRING,
  },
  leaveDocument: {
    type: Sequelize.STRING,
  },
  createdAt: {
    allowNull: false,
    type: Sequelize.DATE,
  },
  status: {
    type: Sequelize.STRING,
    defaultValue: 'pending',
  },
  userId:{
    type:Sequelize.INTEGER ,
    references:{
      model:"accounts" ,
      key:"id"
    }
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
