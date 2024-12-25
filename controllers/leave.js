const Leaves = require('../models/leaves');
const moment = require('moment');
const Holidays = require('date-holidays');

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
    const { leavename, leavestart, leaveend } = req.body;

    const leaveDays = calculateLeaveDays(leavestart, leaveend);
    const returnDate = calculateReturnDate(leaveend);

    await Leaves.create({
      leavename: leavename,
      leavestart: leavestart,
      leaveend: leaveend, 
    });

    res.status(201).json({
      status: 'success',
      message: 'Leave request sent',
      data: {
        leaveDays,
        leavename,
        leavestart,
        leaveend,
        returnDate,
      },
    });
  } catch (error) {
    res.status(500).json({
      status: 'failed',
      message: 'Leave creation failed',
      error: error.message,
    });
  }
};

module.exports = askLeave;
