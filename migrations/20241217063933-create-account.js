'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('accounts', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
       employmentStartDate: {
            type: Sequelize.DATE,
            allowNull: true,
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
        defaultValue: 18,
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
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('accounts');
    // Drop ENUM type to clean up
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_accounts_role";');
  },
};
