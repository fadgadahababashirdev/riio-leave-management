'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('accounts', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      username: {
        type: Sequelize.STRING ,
        allowNull:false
      },
      email: {
        type: Sequelize.STRING ,
        allowNull:false
      },
      role: {
        type: Sequelize.ENUM("admin","resident","staff"), 
        
      },
      password: {
        type: Sequelize.STRING ,
        allowNull:false
      },
      image: {
        type: Sequelize.STRING ,
        allowNull:true
      },
      status: {
        type: Sequelize.STRING ,
        allowNull:false ,
        defaultValue:"pending"
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      } ,
      resettoken:{
        type:Sequelize.STRING , 
        allowNull:true
      } ,
      resettokenexpires:{
        type:Sequelize.STRING ,
        allowNull:true
      }
      
    }
  );
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('accounts');
  }
};