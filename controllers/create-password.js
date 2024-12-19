const Account = require('../models/account');
const { Op } = require('sequelize');
const bcrypt = require('bcryptjs');
const createPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    const user = await Account.findOne({
      where: {
        resettoken: token,
        resettokenexpires: { [Op.gt]: Date.now() },
      },
    });
    if (!user) {
      return res.status(404).json({
        status:'failed',
        message:'invalid  token or  has expired',
      });
    }
    const hashPassword = await bcrypt.hash(password, 10);
    await Account.update(
      {
        resettokenexpires: null,
        resettoken: null,
        password: hashPassword,
      },
      { where: { resettoken: token } }
    );
    res
      .status(200)
      .json({ status: 'success', message: 'password set successfully' });
  } catch (error) {
    res.status(500).json({ status: 'Failed', message: error.message });
  }
};

module.exports = createPassword;
