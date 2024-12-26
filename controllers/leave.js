const Leaves = require('../models/leaves');
const moment = require('moment');
const Holidays = require('date-holidays');
const Account = require('../models/account');
const { where, Sequelize } = require('sequelize');

const hd = new Holidays('RW');
const isWeekendOrHoliday = (date) => {
  const dayOfWeek = moment(date).day();
  const holiday = hd.isHoliday(moment(date).toDate());
  return dayOfWeek === 0 || dayOfWeek === 6 || holiday;
};

const calculateLeaveDays = (start, end) => {
  let leaveDays = 0;
  let currentDate = moment(start);
  const endDate = moment(end);

  while (currentDate.isSameOrBefore(endDate)) {
    if (!isWeekendOrHoliday(currentDate)) {
      leaveDays++;
    }
    currentDate.add(1, 'day');
  }

  return leaveDays;
};

const calculateReturnDate = (end) => {
  let returnDate = moment(end).add(1, 'day');

  while (isWeekendOrHoliday(returnDate)) {
    returnDate.add(1, 'day');
  }

  return returnDate.format('YYYY-MM-DD');
};

const askLeave = async (req, res) => {
  try {
    const { leavename, leavestart, leaveend, userId } = req.body;

    if (
      !moment(leavestart, 'YYYY-MM-DD', true).isValid() ||
      !moment(leaveend, 'YYYY-MM-DD', true).isValid()
    ) {
      return res.status(400).json({
        status: 'failed',
        message: 'Invalid date format. Please use YYYY-MM-DD.',
      });
    }

    const leaveDays = calculateLeaveDays(leavestart, leaveend);
    if (isNaN(leaveDays) || leaveDays <= 0) {
      return res.status(400).json({
        status: 'failed',
        message: 'Invalid leave duration. Ensure the dates are correct.',
      });
    }

    const returnDate = calculateReturnDate(leaveend);
    const user = req.user;

    const findUser = await Account.findOne({ where: { id: user } });
    if (!findUser) {
      return res
        .status(404)
        .json({ status: 'failed', message: 'User not found' });
    }

    const annualLeave = findUser.annualleavedays || 18;

    if (leaveDays > annualLeave) {
      return res.status(400).json({
        status: 'failed',
        message: 'You are only allowed 18 leave days annually.',
      });
    }

    if (findUser.consumeddays + leaveDays > annualLeave) {
      return res.status(400).json({
        status: 'failed',
        message: `You are requesting a leave longer than the annual allowed leave`,
      });
    }

    const newRemainingLeave = annualLeave - leaveDays;

    // Check for overlapping leave dates for the same user
    const existingLeave = await Leaves.findOne({
      where: {
        id: req.user,
        [Sequelize.Op.or]: [
          {
            leavestart: {
              [Sequelize.Op.between]: [leavestart, leaveend],
            },
          },
          {
            leaveend: {
              [Sequelize.Op.between]: [leavestart, leaveend],
            },
          },
          {
            [Sequelize.Op.and]: [
              {
                leavestart: {
                  [Sequelize.Op.lte]: leavestart,
                },
              },
              {
                leaveend: {
                  [Sequelize.Op.gte]: leaveend,
                },
              },
            ],
          },
        ],
      },
    });

    if (existingLeave) {
      return res.status(400).json({
        status: 'failed',
        message:
          'You already applied for this leave or it overlaps with an existing leave.',
      });
    }

    await Leaves.create({
      leavename,
      leavestart,
      leaveend,
      userId: req.user,
    });

    res.status(201).json({
      status: 'success',
      message: 'Leave request sent',
      data: {
        leavedays: leaveDays,
        leavename,
        leavestart,
        leaveend: leaveend,
        returningfromleave: returnDate,
        userId: req.user,
      },
    });
    // if (findUser.status === 'allowed') {
    //   await Account.update(
    //     {
    //       remainingleavedays: newRemainingLeave,
    //       consumeddays: findUser.consumeddays + leaveDays,
    //     },
    //     { where: { id: user } }
    //   );
    // }
  } catch (error) {
    res.status(500).json({
      status: 'failed',
      message: 'Leave creation failed',
      error: error.message,
    });
  }
};

const getLeaves = async (req, res) => {
  try {
    const leaves = await Leaves.findAll();
    res
      .status(200)
      .json({ status: 'success', message: 'Leaves found', leaves });
  } catch (error) {
    return res.status(500).json({ status: 'Failed', message: error.message });
  }
};

const deleteLeave = async (req, res) => {
  try {
    const { id } = req.params;
    const removeLeave = await Leaves.findByPk(id);
    if (!removeLeave) {
      return res
        .status(500)
        .json({ status: 'failed', message: 'Leave id not found' });
    }
    await Leaves.destroy({ where: { id: id } });
    return res
      .status(200)
      .json({ status: 'success', message: 'Leave deleted successfully' });
  } catch (error) {}
};
const updateLeave = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    const verifyId = await Leaves.findOne({ where: { id: id } });
    const updateUserId = verifyId.userId;
    const updateTheUser = await Account.findOne({
      where: { id: updateUserId },
    });
    const { leavename, leavestart, leaveend, status } = req.body;
    if (user.role === 'admin') {
      await Leaves.update(
        {
          status: status,
        },
        { where: { id: id } }
      ); 
     await Account.update({
      consumeddays:updateTheUser.consumeddays + leaveDays ,
      remainingleavedays:updateTheUser.annualleavedays - consumeddays
     } , {where:{id:updateTheUser}})
    }  
    if(status){
      return res.status(401).json({status:"failed", message:"you can't make the update of your status"})
    } 
    await Leaves.update({})
  } catch (error) {
    res.status(500).json({ status: 'failed', message: error.message });
  }
};

module.exports = { askLeave, getLeaves, deleteLeave, updateLeave };
