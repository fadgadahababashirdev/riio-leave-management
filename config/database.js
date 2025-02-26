require("dotenv").config()
const {Sequelize} = require("sequelize") 
const env = process.env.NODE_ENV
const config = require("./config")["development"]
const sequelize = new Sequelize(config)
module.exports = sequelize