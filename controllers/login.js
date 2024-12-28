const bcrypt = require('bcryptjs');
require('dotenv').config();
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
      token: jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
        expiresIn: '24h',
      }),
    });
  } catch (error) {
    res.status(500).json({ status: 'Failed', message: error.message });
  }
};

module.exports = login;
