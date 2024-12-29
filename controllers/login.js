require('dotenv').config();
const bcrypt = require('bcryptjs');

const jwt = require('jsonwebtoken');
const Account = require('../models/account');

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await Account.findOne({ where: { email } });

    if (!user) {
      return res
        .status(404)
        .json({ status: 'Failed', message: 'email not found' });
    }
    const comparePassword = await bcrypt.compare(password, user.password);
    if (!comparePassword) {
      return res
        .status(404)
        .json({ status: 'Failed ', message: 'Wrong password ,try again !' });
    }
    res.status(200).json({
      status: 'success',
      message: 'user loged in successfully',
      token: jwt.sign({ userId: user.id }, process.env.secret , {
        expiresIn: '24h',
      }),
    });
  } catch (error) {
    console.log("the error" ,error)
    res.status(500).json({ status: 'Failed', message: error.message });
  }
};

module.exports = login;
