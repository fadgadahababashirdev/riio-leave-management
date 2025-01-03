const Holidays = require('date-holidays');
const Leaves = require('../models/leaves');
const Account = require('../models/account');
const hd = new Holidays('RW');

const calculateLeaveDays = (start, end) => {
  let leaveDays = 0;
  let currentDate = new Date(start);

  while (currentDate <= end) {
    const dayOfWeek = currentDate.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const isHoliday = hd.isHoliday(currentDate);

    if (!isWeekend && !isHoliday) {
      leaveDays++;
    }

    currentDate.setDate(currentDate.getDate() + 1);
  }

  return leaveDays;
};

// Find the next valid working day after the leave period
const findNextValidReturnDate = (endDate) => {
  let nextDate = new Date(endDate);
  nextDate.setDate(nextDate.getDate() + 1); // Start checking the day after the end date

  while (true) {
    const dayOfWeek = nextDate.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const isHoliday = hd.isHoliday(nextDate);

    if (!isWeekend && !isHoliday) {
      return nextDate;
    }

    nextDate.setDate(nextDate.getDate() + 1);
  }
};

const requestLeave = async (req, res) => {
  try {
    const { leavename, leavestart, leaveend, leavereason, leaveDocument } =
      req.body;
    const userId = req.user;

    console.log('The user id is ', userId);

    // Check for pending leave requests
    const existingLeave = await Leaves.findOne({
      where: { userId, status: 'pending' },
    });

    if (existingLeave) {
      return res
        .status(400)
        .json({ error: 'You already have a pending leave request.' });
    }

    const start = new Date(leavestart);
    const end = new Date(leaveend);
    const leavedays = calculateLeaveDays(start, end);

    if (leavedays <= 0) {
      return res
        .status(400)
        .json({ error: 'Invalid leave period. No working days found.' });
    }

    // Calculate the return date
    const returnDate = findNextValidReturnDate(end);

    const newLeave = await Leaves.create({
      leavename,
      leavestart: start,
      leaveend: end,
      leavedays,
      leavereason,
      leaveDocument,
      userId,
      status: 'pending',
    });

    res.status(201).json({
      message: 'Leave request submitted successfully.',
      leave: {
        ...newLeave.toJSON(),
        returnDate, // Include the calculated return date in the response
      },
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: 'An error occurred while requesting leave.' });
  }
};

// Controller for approving leave
const approveLeave = async (req, res) => {
  try {
    const { id } = req.params;

    const leave = await Leaves.findByPk(id);

    if (!leave) {
      return res.status(404).json({ error: 'Leave not found.' });
    }

    if (leave.status !== 'pending') {
      return res.status(400).json({ error: 'Leave already processed.' });
    }

    const user = await Account.findByPk(leave.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    if (leave.leavedays > user.remainingleavedays) {
      return res
        .status(400)
        .json({ error: 'User does not have enough leave days.' });
    }

    user.consumeddays += leave.leavedays;
    user.remainingleavedays -= leave.leavedays;
    await user.save();

    const returnDate = new Date(leave.leaveend);
    returnDate.setDate(returnDate.getDate() + 1);

    leave.returningfromleave = returnDate;
    leave.status = 'approved';
    await leave.save();

    res.status(200).json({
      message: 'Leave approved successfully.',
      leave: {
        ...leave.toJSON(),
        returningfromleave: returnDate,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while approving leave.' });
  }
};

const getLeaves = async (req, res) => {
  try {
    const user = req.user;
    const verifyUserExisist = await Account.findByPk(user);
    if (!verifyUserExisist) {
      return res
        .status(404)
        .json({ status: 'failed', message: 'user not found' });
    }
    if (user.role === 'admin') {
      const leaves = await Leaves.findAll({
        order: [['createAt', 'DESC']],
      });
    return  res.status(200).json({ status: 'success', leaves });
    } else { 
      
      const leaves = await Leaves.findAll({where:{id:user}} ,{
        order: [['createAt', 'DESC']],
      }); 
      return res.status(200).json({status:"success" , leaves})
    }
  } catch (error) {
    res.status(500).json({ status: 'failed', message: error.message });
  }
};
module.exports = { requestLeave, approveLeave, getLeaves };
