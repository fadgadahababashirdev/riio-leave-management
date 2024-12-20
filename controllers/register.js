const Account = require('../models/account');

const nodemailer = require('nodemailer');
const crypto = require('crypto');
require('dotenv').config();
// register a new user

const register = async (req, res) => {
  try {
    const { email, username, role, status } = req.body;
    console.log('The body is ', req.body);
    const resettoken = crypto.randomBytes(32).toString('hex');
    const resettokenexpires = Date.now() + 3600000;

    const user = await Account.findOne({
      where: { email: email },
    });

    if (user) {
      return res
        .status(404)
        .json({ status: 'Failed ', message: 'user arleady exisists' });
    }
    await Account.create({
      email,
      username,
      role,
      status,
      resettoken,
      resettokenexpires,
    });

    const transport = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        pass: process.env.APP_PASS,
        user: process.env.APP_USER,
      },
    });
    const mailOptions = {
      from: process.env.APP_USER,
      to: email,
      subject: 'Activating account',
      text: `please click this link below to set your password for your accout to be activated http://localhost:2001/activate-account?token=${resettoken}`,
    };
    transport.sendMail(mailOptions);

    res.status(201).json({
      status: 'success',
      message:
        'account registered successfully , and an email has been sent to set password',
    });
  } catch (error) {
    res.status(500).json({ status: 'Failed', message: error.message });
  }
};

// get all users
const users = async (req, res) => {
  try {
    const user = req.user;
    const verifyUser = await Account.findOne({ where: { id: user } });
    if (!verifyUser) {
      return res.status(400).json({ status: 'user does not exisist' });
    }
    if (verifyUser.role === 'admin') {
      const users = await Account.findAll({
        order: [['createdAt', 'DESC']],
      });
      return res.status(200).json({ status: 'success', users: users });
    }
  } catch (error) {
    res.status(500).json({ status: 'failed', message: error.message });
  }
};

// get single user
const user = async (req, res) => {
  try {
    const user = req.user;
    const verifyUser = await Account.findOne({ where: { id: user } });
    if (!verifyUser) {
      return res.status(400).json({ status: 'user does not exisist' });
    }
    return res.status(200).json({ status: 'success', user: user });
  } catch (error) {
    res.status(500).json({ status: 'failed', message: error.message });
  }
};

// get single user

// update the user
const updateUser = async (req, res) => {
  try {
    const { username, status, role } = req.body;
    const image = req.file ? req.file.path : null;
    const { id } = req.params;
    if (!id) {
      return res
        .status(404)
        .json({ status: 'failed', message: 'id not found' });
    }

    const user = await Account.findByPk(id);
    if (!user) {
      return res
        .status(404)
        .json({ status: 'failed', message: 'user does not exisist' });
    }

    const updatingData = {
      username: username || user.username,
      role: role || user.role,
      image: image || user.image,
      status: status || user.status,
    };

    await Account.update(updatingData, { where: { id: id } });
    return res
      .status(200)
      .json({ status: 'success', message: 'user data updated successfully' });
  } catch (error) {
    res.status(500).json({ status: 'Failed', message: error.message });
  }
};

const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const findUSer = await Account.findByPk(id);
    if (!findUSer) {
      return res
        .status(400)
        .json({ status: 'failed', message: 'id not found' });
    }

    if (!id) {
      return res
        .status(404)
        .json({ status: 'failed', message: 'id not found' });
    }
    if (!findUSer) {
      return res
        .status(400)
        .json({ status: 'failed', message: 'user does not exisist' });
    }

    await Account.destroy({ where: { id: id } });
    res
      .status(200)
      .json({ status: 'Failed', message: 'user deleted successfully' });
  } catch (error) {
    console.log('The error is ', error);
    res.status(500).json({ status: 'failed', message: error.message });
  }
};

module.exports = { register, updateUser, users, user, deleteUser };
