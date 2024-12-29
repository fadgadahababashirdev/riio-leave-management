require("dotenv").config()
const {Sequelize} = require("sequelize") 
const env = process.env.NODE_DEVELOPMENT || "development" 
const config = require("./config")[env]
const sequelize = new Sequelize(config)
module.exports = sequelize