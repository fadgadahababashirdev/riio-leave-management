const { Sequelize } = require("sequelize");
const sequelize = require("../config/database");

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
  updatedAt: {
    allowNull: false,
    type: Sequelize.DATE,
  },
}); 
module.exports = Leaves