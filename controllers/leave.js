const { Op } = require('sequelize');
const Account = require("../models/account") 
const Leaves = require("../models/leaves") 
const nodemailer = require("nodemailer");
require("dotenv").config()
const requestLeave = async (req, res) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.APP_USER,
      pass: process.env.APP_PASS,
    },
  });
  
  const { userId, leavename, leavestart, leaveend, leavereason } = req.body;

  try {
    // Check if the user has a pending request
    const pendingRequest = await Leaves.findOne({
      where: { userId, status: 'pending' },
    });

    if (pendingRequest) {
      return res.status(400).json({ message: 'You already have a pending leave request.' });
    }

    // Get the user
    const user = await Account.findByPk(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Calculate the number of days between leavestart and leaveend
    const startDate = new Date(leavestart);
    const endDate = new Date(leaveend);
    
    // Ensure valid dates
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return res.status(400).json({ message: 'Invalid date format.' });
    }
    
    if (startDate > endDate) {
      return res.status(400).json({ message: 'Leave start date must be before end date.' });
    }

    // Calculate working days (excluding weekends)
    let leavedays = 0;
    let currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      // Skip weekends (0 = Sunday, 6 = Saturday)
      const dayOfWeek = currentDate.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        leavedays++;
      }
      
      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Calculate accrued leave allowance (1.5 days per month)
    const currentYear = new Date().getFullYear();
    const startOfYear = new Date(currentYear, 0, 1); // January 1st of current year
    
    // FIXED: Calculate months elapsed correctly
    // Current date in March 2025 (as mentioned in your date)
    const now = new Date();
    
    // Calculate full months elapsed (Jan, Feb, Mar = 3 months)
    // Note: getMonth() is 0-indexed, so March is 2
    const currentMonth = now.getMonth(); // 0-indexed (0 = Jan, 1 = Feb, 2 = Mar)
    const monthsElapsed = currentMonth + 1; // Add 1 to get number of months (Jan = 1, Feb = 2, Mar = 3)
    
    // Accrue 1.5 days per month
    const accruedLeaveDays = monthsElapsed * 1.5;

    // Get used leave days
    const usedLeaves = await Leaves.findAll({
      where: { 
        userId,
        status: 'approved',
        leavestart: {
          [Op.gte]: startOfYear
        }
      }
    });
    
    const usedLeaveDays = usedLeaves.reduce((total, leave) => total + leave.leavedays, 0);
    
    // Calculate remaining leave balance
    const remainingLeaveDays = accruedLeaveDays - usedLeaveDays;

    // Check if user has enough leave days
    if (leavedays > remainingLeaveDays) {
      return res.status(400).json({ 
        message: `Requested leave (${leavedays} days) exceeds your available balance (${remainingLeaveDays.toFixed(1)} days).`
      });
    }

    // Calculate return date (next working day after leave ends)
    let returningDate = new Date(endDate);
    returningDate.setDate(returningDate.getDate() + 1);
    
    // Ensure return date is not on a weekend
    while (returningDate.getDay() === 0 || returningDate.getDay() === 6) {
      returningDate.setDate(returningDate.getDate() + 1);
    }

    // Create the leave request
    const leaveRequest = await Leaves.create({
      userId,
      leavename,
      leavedays,
      leavestart,
      leaveend,
      returningfromleave: returningDate, // Set the returning date
      leavereason,
      status: 'pending',
      username: user.username,
    });

    // Send email to admin
    const admins = await Account.findAll({ where: { role: "admin" } });
    const adminEmails = admins.map(admin => admin.email);

    // Email content
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: adminEmails,
      subject: "Leave Request",
      text: `${user.username} (${user.email}) is requesting ${leavename} leave for ${leavedays} days from ${new Date(leavestart).toLocaleDateString()} to ${new Date(leaveend).toLocaleDateString()}.\n\nReturning on: ${returningDate.toLocaleDateString()}\n\nReason: ${leavereason}\n\nPlease review and approve.`,
    };

    // Send email
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("Error sending email:", error);
      } else {
        console.log("Email sent:", info.response);
      }
    });

    res.status(201).json({ 
      message: 'Leave request created successfully.', 
      leaveRequest,
      leaveBalance: {
        accrued: accruedLeaveDays,
        used: usedLeaveDays,
        remaining: remainingLeaveDays
      }
    });
  } catch (error) {
    console.error('Error creating leave request:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};
  
// Approve or reject leave request
const updateLeaveStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  
  // Validate status
  if (status !== 'approved' && status !== 'rejected') {
    return res.status(400).json({ message: 'Invalid status. Must be "approved" or "rejected".' });
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.APP_USER,
      pass: process.env.APP_PASS,
    },
  });

  try {
    // Find the leave request
    const leaveRequest = await Leaves.findByPk(id);
    
    if (!leaveRequest) {
      return res.status(404).json({ message: 'Leave request not found.' });
    }
    
    if (leaveRequest.status !== 'pending') {
      return res.status(400).json({ 
        message: `This leave request is already ${leaveRequest.status}.`
      });
    }
    
    // Get the user
    const user = await Account.findByPk(leaveRequest.userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }
    
    // Update leave request status
    leaveRequest.status = status;
    await leaveRequest.save();
    
    // If approved, update user's remaining leave days
    if (status === 'approved') {
      // Calculate new remaining leave days
      const newRemainingDays = user.remainingleavedays - leaveRequest.leavedays;
      const newConsumedDays = user.consumeddays + leaveRequest.leavedays;
      
      // Update user's leave balance
      user.remainingleavedays = newRemainingDays;
      user.consumeddays = newConsumedDays;
      await user.save();
    }
    
    // Send email notification to user
    const actionText = status === 'approved' ? 'approved' : 'rejected';
    const emailSubject = `Leave Request ${actionText.charAt(0).toUpperCase() + actionText.slice(1)}`;
    
    let emailText = `Your leave request from ${new Date(leaveRequest.leavestart).toLocaleDateString()} to ${new Date(leaveRequest.leaveend).toLocaleDateString()} has been ${actionText}.`;
    
    if (status === 'approved') {
      emailText += `\n\nYou are expected to return to work on ${new Date(leaveRequest.returningfromleave).toLocaleDateString()}.`;
      emailText += `\n\nYour remaining leave balance is ${user.remainingleavedays} days.`;
    }
    
   
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: emailSubject,
      text: emailText,
    };
    
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("Error sending email:", error);
      } else {
        console.log("Email sent:", info.response);
      }
    });
    
    res.status(200).json({ 
      message: `Leave request ${actionText} successfully.`,
      leaveRequest
    });
    
  } catch (error) {
    console.error('Error updating leave status:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// all leaves 
const allLeaves = async (req, res) => {
  try {
    const leaves = await Leaves.findAll({
      order: [["createdAt", "DESC"]], // Fixed order format
    });
    return res.status(200).json({ leaves });
  } catch (error) {
    return res.status(400).json({ status: "failed", message: error.message });
  }
};
// single leave
const getLeave = async (req, res) => {
  try {
    const { id } = req.params;
    const findId = await Leaves.findByPk(id);
    if (!findId) {
      return res
        .status(400)
        .json({ status: "Failed", message: "Leave not found" });
    }
    return res.status(200).json({ status: "success", leave: findId });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

//  delete leave
 const deleteLeave = async (req, res) => {
  try {
    const { id } = req.params;
    const leave = await Leaves.findByPk(id);
    if (!leave) {
      return res
        .status(404)
        .json({ status: "Failed", message: "Leave not found" });
    }

    await leave.destroy({where:{id:id}});
    return res.status(200).json({status:"success",message:"Leave deleted successfully"});
  } catch (error) {
    console.log(error)
    return res.status(500).json({ message: error.message });
  }
};
module.exports = {requestLeave,deleteLeave,allLeaves , getLeave , updateLeaveStatus}