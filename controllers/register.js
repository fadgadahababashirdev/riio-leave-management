const Account = require('../models/account');
const bcrypt = require('bcryptjs');
// register a new user

const register = async (req, res) => {
  try {
    const { email, username, password, role } = req.body;
    const hashPassword = await bcrypt.hash(password, 10);
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
      password: hashPassword,
      role,
    });

    res
      .status(201)
      .json({ status: 'success', message: 'account registered successfully' });
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



// update the user
const updateUser = async (req, res) => {
  try {
    const { username, password, status, role } = req.body;
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
      password: password || user.password,
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

module.exports = { register, updateUser, users };
