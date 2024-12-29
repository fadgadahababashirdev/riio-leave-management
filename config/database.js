require("dotenv").config();
const { Sequelize } = require("sequelize");

// Get the environment (default to "development" if not set)
const env = process.env.NODE_ENV || "development";

// Load the configuration for the current environment
const config = require("./config")[env];

// Create a Sequelize instance with the appropriate configuration
const sequelize = new Sequelize(config.database, config.username, config.password, {
  host: config.host,
  dialect: config.dialect,
  port: config.port,
  dialectOptions: config.ssl
    ? {
        ssl: {
          require: true,
          rejectUnauthorized: false, // Allow self-signed certificates
        },
      }
    : undefined, // Disable SSL if not specified
});

module.exports = sequelize;
