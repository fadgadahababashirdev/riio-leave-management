const Account = require('../models/account');

const nodemailer = require('nodemailer');
const crypto = require('crypto');
const { Leaves } = require('../models');
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
        .status(400)
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
      text: `please click this link below to set your password ${process.env.FRONT_END_URL}/create-password?token=${resettoken}`,
    };
    transport.sendMail(mailOptions);

    res.status(201).json({
      status: 'success',
      message:
        'account registered successfully , and an email has been sent to set password',
    });
  } catch (error) {
    console.log('the error is', error);
    res.status(500).json({ status: 'Failed', message:error});
  }
};

// get all users
const users = async (req, res) => {
  try {
    const user = req.user;
    const verifyUser = await Account.findOne({ where: { id: user } });
    if (!verifyUser) {
      return res.status(400).json({ status: 'user does not exist' });
    }

    if (verifyUser.role === 'admin') {
      const { page = 1 } = req.query;
      const limit = 50;
      const offset = (page - 1) * limit;

      const { rows: users, count: totalUsers } = await Account.findAndCountAll({
        order: [['createdAt', 'DESC']],

        limit,
        offset,
      });

      // Calculate total pages
      const totalPages = Math.ceil(totalUsers / limit);

      return res.status(200).json({
        status: 'success',
        users,
        pagination: {
          totalUsers,
          totalPages,
          currentPage: parseInt(page),
          pageSize: limit,
        },
      });
    } else {
      return res.status(200).json({ message: [] });
    }
  } catch (error) {
    res.status(500).json({ status: 'failed', message: error.message });
  }
};

// get single user
const user = async (req, res) => {
  try {
    const {id} = req.params 
    if(!id){
      return res.status(400).json({status:"failed", message:"id not found"})
    }
    if(req.user && req.user === id){
      const verifyId = await Account.findOne({where:{id:id}})  
      return res.status(200).json({status:"failed" , user:verifyId})
    }else{
      return res.status(400).json({status:"failed" , message:"user id not matching the id provided"})
    }

  } catch (error) {
    res.status(500).json({status:"failed" , message:error.message})
  }
}

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
