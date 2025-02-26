require("dotenv").config()

module.exports = {
  development: {
    username:"postgres",
    password:"r2a8s5cc5s8r2aanifa",
    database:"riiomanagement",
    host:"localhost",
    dialect:'postgres',
    port:5432
  },
  test: {
    username: process.env.USERNAME,
    password:process.env.PASSWORD,
    database: process.env.DATABASE,
    host:process.env.HOST,
    dialect:process.env.DIALECT,
    port:5432 ,
    
  },
  production: {
    username: 'root',
    password: null,
    database: 'database_production',
    host: '127.0.0.1',
    dialect: 'postgres',
  },
};
