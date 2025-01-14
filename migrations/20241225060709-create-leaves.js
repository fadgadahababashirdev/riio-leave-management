'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('leaves', {
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
      userId: {
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
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      username:{
        type:Sequelize.STRING
      } ,
      status: {
        type: Sequelize.ENUM('pending','approved','rejected'),
        defaultValue: 'pending',
      },
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('leaves');
    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_leaves_status";'
    );
  },
};
