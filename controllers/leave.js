const Holidays = require('date-holidays');
const Leaves = require('../models/leaves');
const Account = require('../models/account');
const  {createTransport } = require('nodemailer');
const { text } = require('express');
const nodemailer = require("nodemailer")
const hd = new Holidays('RW');
require("dotenv").config()
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


const findNextValidReturnDate = (endDate) => {
  let nextDate = new Date(endDate);
  nextDate.setDate(nextDate.getDate() + 1); 

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
    const { leavename, leavestart, leaveend, leavereason, leaveDocument } = req.body;
    const userId = req.user;

    if (!userId) {
      return res.status(400).json({ error: 'User not authenticated.' });
    }
    const existingLeave = await Leaves.findOne({
      where: { userId, status: 'pending' },
    });
    if (existingLeave) {
      return res.status(400).json({ error: 'You already have a pending leave request.' });
    }
    const start = new Date(leavestart);
    const end = new Date(leaveend);
    const leavedays = calculateLeaveDays(start, end);
    if (leavedays <= 0) {
      return res.status(400).json({ error: 'Invalid leave period. No working days found.' });
    }

    const returnDate = findNextValidReturnDate(end);

    const newLeave = await Leaves.create({
      leavename,
      leavestart:start,
      leaveend:end,
      leavedays,
      leavereason,
      leaveDocument,
      userId:req.user,
      status:'pending',
    });

    const admins = await Account.findAll({ where: { role: 'admin' } });

    if (!admins.length) {
      return res.status(400).json({ status: 'failed', message: 'No admins found' });
    }

    const adminEmails = admins.map((admin) => admin.email);

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.App_USER,
        pass: process.env.APP_PASS,
      },
    });

    const sendingEmail = req.user;
    if (!sendingEmail) {
      return res.status(400).json({ status: 'failed', message: 'User not found' });
    }

    const account = await Account.findOne({ where: {id:sendingEmail } }); 
    console.log("The email is",account.accounts.username)
    // console.log("The account email is" , account)
    if (!account) {
      return res.status(400).json({error:'User account not found.'});
    }

    const mailOptions = {
      from: account.accounts.email,
      to: adminEmails,
      subject: `${account.accounts.firstName} ${account.accounts.lastName} requesting a leave`,
      text: `
        ${account.accounts.firstName} ${account.accounts.lastName} is requesting a leave.\n
        Leave Name: ${leavename}\n
        Reason: ${leavereason}\n
        Duration: ${leavedays} days\n
        From: ${leavestart}\n
        To: ${leaveend} \n 
        Returning on: ${returnDate}

      `,
    };

    await transporter.sendMail(mailOptions);

    res.status(201).json({
      message: 'Leave request submitted successfully, and the admins will check it out.',
      leave: {
        ...newLeave.toJSON(),
        returnDate,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while requesting leave.' });
  }
};

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
module.exports = { requestLeave, approveLeave, getLeaves};
