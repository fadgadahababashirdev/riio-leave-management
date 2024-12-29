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
    username: process.env.PRODUCTION_USERNAME,
    password:process.env.PRODUCTION_PASSWORD,
    database: process.env.PRODUCTION_HOST,
    host:process.env.PRODUCTION_PORT,
    dialect: process.env.PRODUCTION_DIALECT,
  },
  production: {
    username: 'root',
    password: null,
    database: 'database_production',
    host: '127.0.0.1',
    dialect: 'postgres',
  },
};
