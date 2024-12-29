require("dotenv").config()

module.exports = {
  development: {
    username:process.env.DB_USERNAME ,
    password:process.env.DB_PASSWORD,
    database:process.env.DB_DATABASE,
    host:process.env.DB_HOST,
    dialect:'postgres',
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
