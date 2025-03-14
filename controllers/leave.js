const { Op } = require('sequelize');
const Account = require("../models/account") 
const Leaves = require("../models/leaves") 
const nodemailer = require("nodemailer");
require("dotenv").config()
const requestLeavee = async (req, res) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.APP_USER,
      pass: process.env.APP_PASS,
    },
  });

  const { userId, leavename, leavestart, leaveend, leavereason } = req.body;

  try {
    const pendingRequest = await Leaves.findOne({
      where: { userId, status: "pending" },
    });

    if (pendingRequest) {
      return res
        .status(400)
        .json({ message: "You already have a pending leave request." });
    }

    const user = await Account.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    let leavedays = 0;
    let startDate, endDate, returningDate;

    if (leavename === "annual") {
      startDate = new Date(leavestart);
      endDate = new Date(leaveend);

      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return res.status(400).json({ message: "Invalid date format." });
      }

      if (startDate > endDate) {
        return res
          .status(400)
          .json({ message: "Leave start date must be before end date." });
      }

      let currentDate = new Date(startDate);
      while (currentDate <= endDate) {
        const dayOfWeek = currentDate.getDay();
        if (dayOfWeek !== 0 && dayOfWeek !== 6) {
          leavedays++;
        }
        currentDate.setDate(currentDate.getDate() + 1);
      }

      const currentYear = new Date().getFullYear();
      const startOfYear = new Date(currentYear, 0, 1);
      const now = new Date();
      const monthsElapsed = now.getMonth() + 1;
      const accruedLeaveDays = monthsElapsed * 1.5;

      const usedLeaves = await Leaves.findAll({
        where: {
          userId,
          status: "approved",
          leavestart: {
            [Op.gte]: startOfYear,
          },
        },
      });

      const usedLeaveDays = usedLeaves.reduce(
        (total, leave) => total + leave.leavedays,
        0
      );

      const remainingLeaveDays = accruedLeaveDays - usedLeaveDays;

      if (leavedays > remainingLeaveDays) {
        return res.status(400).json({
          message: `Requested leave (${leavedays} days) exceeds your available balance (${remainingLeaveDays.toFixed(
            1
          )} days).`,
        });
      }

      returningDate = new Date(endDate);
      returningDate.setDate(returningDate.getDate() + 1);

      while (returningDate.getDay() === 0 || returningDate.getDay() === 6) {
        returningDate.setDate(returningDate.getDate() + 1);
      }
    }

    const leaveRequest = await Leaves.create({
      userId,
      leavename,
      leavedays,
      leavestart: leavename ==="annual" ? leavestart : null,
      leaveend: leavename ==="annual" ? leaveend : null,
      returningfromleave: leavename ==="annual" ? returningDate : null,
      leavereason,
      status: "pending",
      username: user.username,
    });

    const admins = await Account.findAll({ where: { role: "admin" } });
    const adminEmails = admins.map((admin) => admin.email);

    let emailText = `${user.username} (${user.email}) is requesting ${leavename} leave.\n\nReason: ${leavereason}`;

    if (leavename === "annual") {
      emailText += ` for ${leavedays} days from ${new Date(
        leavestart
      ).toLocaleDateString()} to ${new Date(leaveend).toLocaleDateString()}.\n\nReturning on: ${returningDate.toLocaleDateString()}`;
    }

    emailText += "\n\nPlease review and approve.";

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: adminEmails,
      subject: "Leave Request",
      text: emailText,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("Error sending email:", error);
      } else {
        console.log("Email sent:", info.response);
      }
    });

    res.status(201).json({
      message: "Leave request created successfully.",
      leaveRequest,
    });
  } catch (error) {
    console.error("Error creating leave request:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

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
    const pendingRequest = await Leaves.findOne({
      where: { userId, status: "pending" },
    });

    if (pendingRequest) {
      return res
        .status(400)
        .json({ message: "You already have a pending leave request." });
    }

    const user = await Account.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    let leavedays = 0;
    let startDate, endDate, returningDate;

    if (leavename === "annual") {
      startDate = new Date(leavestart);
      endDate = new Date(leaveend);

      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return res.status(400).json({ message: "Invalid date format." });
      }

      if (startDate > endDate) {
        return res
          .status(400)
          .json({ message: "Leave start date must be before end date." });
      }

      let currentDate = new Date(startDate);
      while (currentDate <= endDate) {
        const dayOfWeek = currentDate.getDay();
        if (dayOfWeek !== 0 && dayOfWeek !== 6) {
          leavedays++;
        }
        currentDate.setDate(currentDate.getDate() + 1);
      }

      const currentYear = new Date().getFullYear();
      const startOfYear = new Date(currentYear, 0, 1);
      const now = new Date();
      
      // Use employmentStartDate if available, otherwise fall back to createdAt
      const employmentStartDate = user.employmentStartDate || new Date(user.createdAt);
      const employmentStartYear = employmentStartDate.getFullYear();
      
      // Determine the start date for leave accrual calculation
      let accrualStartDate;
      if (employmentStartYear < currentYear) {
        // Employee started before this year, use start of year
        accrualStartDate = startOfYear;
      } else {
        // Employee started this year, use their actual employment start date
        accrualStartDate = employmentStartDate;
      }
      
      // Calculate months employed in the current year
      const monthsDiff = (now.getFullYear() - accrualStartDate.getFullYear()) * 12 + 
                         (now.getMonth() - accrualStartDate.getMonth());
      
      // Round up to include current month
      const monthsEmployed = Math.max(0, monthsDiff + 1);
      
      // Calculate accrued leave at 1.5 days per month
      const accruedLeaveDays = monthsEmployed * 1.5;

      const usedLeaves = await Leaves.findAll({
        where: {
          userId,
          status: "approved",
          leavestart: {
            [Op.gte]: startOfYear,
          },
        },
      });

      // Calculate leaves used this year from approved leave requests
      const usedLeaveDays = usedLeaves.reduce(
        (total, leave) => total + leave.leavedays,
        0
      );
      
      // Add any pre-recorded consumed days from before system implementation
      const manuallyRecordedDays = user.consumeddays || 0;
      const totalConsumedDays = usedLeaveDays + manuallyRecordedDays;

      // Calculate remaining leave days
      const remainingLeaveDays = accruedLeaveDays - totalConsumedDays;

      if (leavedays > remainingLeaveDays) {
        return res.status(400).json({
          message: `Requested leave (${leavedays} days) exceeds your available balance (${remainingLeaveDays.toFixed(
            1
          )} days). Based on your employment date of ${employmentStartDate.toLocaleDateString()}, you've accrued ${accruedLeaveDays.toFixed(1)} days and used ${totalConsumedDays} days this year.`,
        });
      }

      returningDate = new Date(endDate);
      returningDate.setDate(returningDate.getDate() + 1);

      while (returningDate.getDay() === 0 || returningDate.getDay() === 6) {
        returningDate.setDate(returningDate.getDate() + 1);
      }
    }

    const leaveRequest = await Leaves.create({
      userId,
      leavename,
      leavedays,
      leavestart: leavename === "annual" ? leavestart : null,
      leaveend: leavename === "annual" ? leaveend : null,
      returningfromleave: leavename === "annual" ? returningDate : null,
      leavereason,
      status: "pending",
      username: user.username,
    });

    const admins = await Account.findAll({ where: { role: "admin" } });
    const adminEmails = admins.map((admin) => admin.email);

    let emailText = `${user.username} (${user.email}) is requesting ${leavename} leave.\n\nReason: ${leavereason}`;

    if (leavename === "annual") {
      emailText += ` for ${leavedays} days from ${new Date(
        leavestart
      ).toLocaleDateString()} to ${new Date(leaveend).toLocaleDateString()}.\n\nReturning on: ${returningDate.toLocaleDateString()}`;
    }

    emailText += "\n\nPlease review and approve.";

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: adminEmails,
      subject: "Leave Request",
      text: emailText,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("Error sending email:", error);
      } else {
        console.log("Email sent:", info.response);
      }
    });

    res.status(201).json({
      message: "Leave request created successfully.",
      leaveRequest,
    });
  } catch (error) {
    console.error("Error creating leave request:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};
// update employee leave info 
const updateEmployeeLeaveInfo = async (req, res) => {
  const { userId, employmentStartDate: newEmploymentStartDate, consumeddays } = req.body;
  
  try {
    const user = await Account.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }
    
    // Update the user with employment start date and consumed days
    const updates = {};
    
    if (newEmploymentStartDate) {
      const parsedDate = new Date(newEmploymentStartDate);
      if (isNaN(parsedDate.getTime())) {
        return res.status(400).json({ message: "Invalid employment start date format." });
      }
      updates.employmentStartDate = parsedDate;
    }
    
    if (consumeddays !== undefined) {
      if (isNaN(consumeddays) || consumeddays < 0) {
        return res.status(400).json({ message: "Consumed days must be a non-negative number." });
      }
      updates.consumeddays = consumeddays;
    }
    
    await user.update(updates);
    
    // Recalculate remaining leave days
    const currentYear = new Date().getFullYear();
    const startOfYear = new Date(currentYear, 0, 1);
    const now = new Date();
    
    const userEmploymentStartDate = user.employmentStartDate || new Date(user.createdAt);
    const employmentStartYear = userEmploymentStartDate.getFullYear();
    
    let accrualStartDate;
    if (employmentStartYear < currentYear) {
      accrualStartDate = startOfYear;
    } else {
      accrualStartDate = userEmploymentStartDate;
    }
    
    const monthsDiff = (now.getFullYear() - accrualStartDate.getFullYear()) * 12 +
                       (now.getMonth() - accrualStartDate.getMonth());
    const monthsEmployed = Math.max(0, monthsDiff + 1);
    const accruedLeaveDays = monthsEmployed * 1.5;
    
    const usedLeaves = await Leaves.findAll({
      where: {
        userId: user.id,
        status: "approved",
        leavestart: {
          [Op.gte]: startOfYear,
        },
      },
    });
    
    const usedLeaveDays = usedLeaves.reduce(
      (total, leave) => total + leave.leavedays,
      0
    );
    
    const manuallyRecordedDays = user.consumeddays || 0;
    const totalConsumedDays = usedLeaveDays + manuallyRecordedDays;
    const remainingLeaveDays = accruedLeaveDays - totalConsumedDays;
    
    // Update the user's remaining leave days - Convert to integer as the database expects
    await user.update({
      remainingleavedays: Math.floor(Math.max(0, remainingLeaveDays))
    });
    
    res.status(200).json({
      message: "Employee leave information updated successfully.",
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        employmentStartDate: user.employmentStartDate,
        consumeddays: user.consumeddays,
        accruedLeaveDays: accruedLeaveDays.toFixed(1),
        usedLeaveDays: totalConsumedDays,
        remainingLeaveDays: remainingLeaveDays.toFixed(1)
      }
    });
  } catch (error) {
    console.error("Error updating employee leave info:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

module.exports = { requestLeave };
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

// leave proof 
const updateLeaveWithProof = async (req, res) => {
  const { id } = req.params;
  const { image } = req.file.path;
  try {
    const leaveRequest = await Leaves.findByPk(id);
    if (!leaveRequest) {
      return res.status(404).json({ message: "Leave request not found." });
    }

    if (leaveRequest.status !== "approved") {
      return res
        .status(400)
        .json({ message: "Only approved leaves can be updated with proof." });
    }

    leaveRequest.image = image;
    await leaveRequest.save();

    const admins = await Account.findAll({ where: { role: "admin" } });
    const adminEmails = admins.map((admin) => admin.email);

    const mailOptions = {
      from:process.env.EMAIL_USER,
      to:adminEmails,
      subject:"Leave Proof Submission",
      text:`${leaveRequest.username} has submitted proof for their ${leaveRequest.leavename} leave.\n\nCheck the system for details.`,
    };

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.APP_USER,
        pass: process.env.APP_PASS,
      },
    });

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("Error sending email:", error);
      } else {
        console.log("Email sent:", info.response);
      }
    });

    res.status(200).json({
      message: "Leave proof updated successfully.",
      leaveRequest,
    });
  } catch (error) {
    console.error("Error updating leave proof:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};
module.exports = {requestLeave,deleteLeave,allLeaves , getLeave , updateLeaveStatus , updateLeaveWithProof , updateEmployeeLeaveInfo}