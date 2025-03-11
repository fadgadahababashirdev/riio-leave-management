require("dotenv").config()
const jwt = require('jsonwebtoken');
const Account = require("../models/account");
const authorization = async (req, res, next) => {
  try {
    const token = req.headers['authorization'];
    if (!token) {
      return res
        .status(400)
        .json({ status: 'failed', message: 'Please login first' });
    } else {
      jwt.verify(token, process.env.secret , (err, decoded) => {
        if (err) {
          return res
            .status(400)
            .json({
              status: 'Failed',
              message: 'invalid token or has expired',
            });
        }
        req.user = decoded.userId;
        next();
      });
    }
  } catch (error) {
    res.status(500).json({ status: 'failed', message: error.message });
  }
};

const authorizeAdmin = async(req, res, next) => { 

 try {
  const userRole = await Account.findOne({where:{id:req.user}}) 

 } catch (error) {
  if (req.user.users.role !== "admin") {
    return res.status(403).json({ message: "Access denied."});
  }
 }

  next();
};
module.exports = {authorizeAdmin ,authorization};
