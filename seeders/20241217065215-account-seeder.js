'use strict';
const bcrypt = require("bcryptjs");

module.exports = {
  up: async (queryInterface, Sequelize) => {
   
    const adminPassword = "admin";
    const userPassword = "user";
    
    const hashAdminPassword = await bcrypt.hash(adminPassword, 10);
    const hashUserPassword = await bcrypt.hash(userPassword, 10);

    // Insert the data
    await queryInterface.bulkInsert('accounts', [
      {
        username: 'admin',
        email: 'admin@gmail.com',
        role: 'admin',
        password: hashAdminPassword,
        image: 'default.png',
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        username: 'user',
        email: 'user@gmail.com',
        role: 'user',
        password: hashUserPassword, 
        image: 'default.png',
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ], {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('accounts', null, {});
  },
};
