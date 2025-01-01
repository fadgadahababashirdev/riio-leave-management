const Account = require('../models/account');
const nodemailer = require('nodemailer');
const crypto = require("crypto")
require('dotenv').config();

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const findAccount = await Account.findOne({ where: { email: email } });
    if (!findAccount) {
      return res
        .status(500)
        .json({ status: 'failed', message: 'account not found' });
    }

    const resettoken = crypto.randomBytes(32).toString('hex');
    const resettokenexpires = Date.now() + 3600000;
    const transport = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        pass: process.env.APP_PASS,
        user: process.env.APP_USER,
      },
    });
    const mailOptions = {
      from: process.env.APP_EMAIL,
      to: email,
      subject: 'Reset your password',
      text: `Click this link to create new password ${process.env.FRONT_END_URL}/reset-password?token=${resettoken}`,
    };
    await Account.update(
      {resettoken: resettoken, resettokenexpires: resettokenexpires},
      { where: {email:email}}
    );
    transport.sendMail(mailOptions);
    res.status(200).json({ status: 'success', message: 'an email has been sent to reset your password' });
  } catch (error) {
    res.status(500).json({ status: 'failed', message: error.message });
  }
};

module.exports = forgotPassword;
