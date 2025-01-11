require('dotenv').config();
const bcrypt = require('bcryptjs');

const jwt = require('jsonwebtoken');
const Account = require('../models/account');

const login = async (req, res) => {
  console.log("hello this is before try")
  try {
    
    const { email, password } = req.body;
    console.log("hello this bellow  req")
    const user = await Account.findOne({ where: { email } });
    console.log("hello this is bellow user")

    if (!user) {
      return res
        .status(404)
        .json({ status: 'Failed', message: 'email not found' });
    }
    console.log("THis is when no user found bellow")
    const comparePassword = await bcrypt.compare(password, user.password);
    console.log("bellow compare")
    if (!comparePassword) {
      return res
        .status(404)
        .json({ status: 'Failed ', message: 'Wrong password ,try again !' });
    } 
    console.log("this is bellow the cdac")
    res.status(200).json({
      status: 'success',
      message: 'user loged in successfully',
      token: jwt.sign({ userId: user.id }, process.env.secret , {
        expiresIn: '24h',
      }), 
      userRole:user.role
    }); 

  } catch (error) {
    console.log("the error")
    console.log(error)
    res.status(500).json({ status: 'Failed', message: error.message }); 

  }
};

module.exports = login;
