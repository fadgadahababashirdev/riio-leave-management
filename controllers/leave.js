const Holidays = require('date-holidays');
const Leaves = require('../models/leaves');
const Account = require('../models/account');
const nodemailer = require("nodemailer");
const { text } = require('express'); 
const {Op} = require("sequelize")
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
const username = "fadga"
const capitalisedName = username.split(" ") 
const finalName = capitalisedName.map(name=>name.charAt(0).toUpperCase() +  name.slice(1).toLowerCase())
console.log("the name is" , finalName.join(""))


//   try {
//     const { leavename, leavestart, leaveend, leavereason, image } = req.body;
//     const userId = req.user;

//     if (!userId) {
//       return res.status(400).json({ error: 'User not found' });
//     }
//     const existingLeave = await Leaves.findOne({
//       where: { userId, status: 'pending' },
//     });
//     if (existingLeave) {
//       return res.status(400).json({ error: 'You already have a pending leave request.' });
//     }
//     const start = new Date(leavestart);
//     const end = new Date(leaveend);
//     const leavedays = calculateLeaveDays(start, end);
//     if (leavedays <= 0) {
//       return res.status(400).json({ error: 'Invalid leave period. No working days found.' });
//     }

//     const returnDate = findNextValidReturnDate(end);
//     const realDate = new Date(returnDate) 
//     const formattedReturnDate = realDate.toISOString().split('T')[0];


//     const newLeave = await Leaves.create({
//       leavename,
//       leavestart:start,
//       leaveend:end,
//       leavedays,
//       leavereason,
//       image, 
//       returningfromleave:returnDate,
//       userId:req.user,
//       status:'pending',
//     });
   
   
//     const admins = await Account.findAll({ where: {role:'admin'}});

//     if (!admins.length) {
//       return res.status(400).json({ status: 'failed', message: 'No admins found' });
//     }

//     const adminEmails = admins.map((admin) => admin.email);

//     const sendingEmail = req.user;
//     if (!sendingEmail) {
//       return res.status(400).json({ status: 'failed', message: 'User not found' });
//     }

//     const account = await Account.findOne({ where: {id:sendingEmail } }); 
//     // console.log("The account email is" , account)
//     if (!account) {
//       return res.status(400).json({error:'User account not found.'});
//     } 

  
//     const transport = nodemailer.createTransport({
//       service:"gmail" ,
//       auth:{
//         user:process.env.APP_USER ,
//         pass:process.env.APP_PASS
//       }
//     }) 
//     const capitalisedName = account.username.split(" ") 
//     const finalName = capitalisedName.map(name=>name.charAt(0).toUpperCase() + name.slice(1).toLowerCase())
//     const name = finalName.join(" ")

//     const mailOptions = {
//       from:account.email,
//       to:adminEmails ,
//       subject:"Requesting a leave",
//       text:`
//       ${name} is requesting a leave of ${leavedays} days starting from ${leavestart} and it ends on ${leaveend}. 
//       If the leave is approved ${name} will return to work on ${returnDate},
//       Click this link to activate to check leave status for ${name}
//       `
//     } 
//     await transport.sendMail(mailOptions)
//     return  res.status(201).json({
//       message: 'Leave request submitted successfully, and the admins will check it out.',
//       leave: {
//         ...newLeave.toJSON(),
//         returnDate,
//       },
//     });
//   } catch (error) {
//     console.log("There was an error")
//     console.error(error);
//  return   res.status(500).json({error:'An error occurred while requesting leave.' });
//   }
// };
// new leave request 

const requestLeave = async (req, res) => {
  try {
    const { leavename, leavestart, leaveend, leavereason} = req.body;
    const userId = req.user;
    const image=req.file
    if (!userId) {
      return res.status(400).json({ error: 'User not found' });
    }

    const userAccount = await Account.findByPk(userId);
    const username = userAccount.username
    if (!userAccount) {
      return res.status(404).json({ error: 'User account not found.'});
    }

    const start = new Date(leavestart);
    const end = new Date(leaveend);
    const leaveDays = calculateLeaveDays(start, end);

    if (leaveDays <= 0) {
      return res.status(400).json({ error: 'Invalid leave period. No working days found.' });
    }

    // Check if the leave type affects annual leave
    if (leavename === 'annual') {
      const currentYear = start.getFullYear();
      const currentMonth = start.getMonth();
      const userLeaveHistory = await Leaves.findAll({
        where: {
          userId,
          leavename: 'annual',
          status: 'approved',
          leavestart: { [Op.gte]: new Date(currentYear, 0, 1)}, // From start of the year
        },
      });

      // Calculate used leave days for the current month and year
      const monthlyUsedDays = userLeaveHistory
        .filter((leave) => new Date(leave.leavestart).getMonth() === currentMonth)
        .reduce((total, leave) => total + leave.leavedays, 0);

      const yearlyUsedDays = userLeaveHistory.reduce((total, leave) => total + leave.leavedays, 0);

      const maxYearlyDays = 12 * 1.5;
      const maxMonthlyDays = 1.5;

      if (monthlyUsedDays + leaveDays > maxMonthlyDays) {
        return res.status(400).json({
          error: `You can only take up to ${maxMonthlyDays} days of leave in a month.`,
        });
      }

      if (yearlyUsedDays + leaveDays > maxYearlyDays) {
        return res.status(400).json({
          error: `You have exceeded your annual leave limit of ${maxYearlyDays} days.`,
        });
      }
    }

    const returnDate = findNextValidReturnDate(end);

    const newLeave = await Leaves.create({
      leavename,
      leavestart: start,
      leaveend: end,
      leavedays: leaveDays,
      leavereason,
      image:image,
      returningfromleave: returnDate,
      userId,
      status: 'pending', 
      username:username
    });

    // Notify admins
    const admins = await Account.findAll({where:{role:'admin'}});
    if (!admins.length) {
      return res.status(400).json({status:'failed', message: 'No admins found' });
    }

    const adminEmails = admins.map((admin) => admin.email);
    const transport = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.APP_USER,
        pass: process.env.APP_PASS,
      },
    });

    const capitalisedName = userAccount.username
      .split(' ')
      .map((name) => name.charAt(0).toUpperCase() + name.slice(1).toLowerCase())
      .join(' ');

    const mailOptions = {
      from: userAccount.email,
      to: adminEmails,
      subject: 'Requesting a Leave',
      text: `${capitalisedName} is requesting a leave of ${leaveDays} days starting from ${leavestart} and ending on ${leaveend}.`,
    };

    await transport.sendMail(mailOptions);

    return res.status(201).json({
      message: 'Leave request submitted successfully.',
      leave: {
        ...newLeave.toJSON(),
        returnDate,
      },
    });
  } catch (error) {
    console.error('Error requesting leave:', error);
    return res.status(500).json({ error: 'An error occurred while requesting leave.' });
  }
};



const updateLeaveStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, leavename, leavestart, leaveend, leavereason} = req.body;
    const user = req.user;
    const image = req.file ? req.file.path : null;
    // Verify the logged-in user
    const verifyUser = await Account.findOne({ where: { id: user } });
    if (!verifyUser) {
      return res.status(404).json({ error: 'User not found.' });
    }

    console.log("The verified user is:", verifyUser.role);

    // Fetch the leave record
    const leave = await Leaves.findByPk(id);
    if (!leave) {
      return res.status(404).json({ error: 'Leave not found.' });
    }

    console.log("Leave userId:", leave.userId, "VerifyUser ID:", verifyUser.id);

    // Admin logic
    if (verifyUser.role === 'admin') {
      if (!['approved', 'rejected'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status. Use "approved" or "rejected".' });
      }

      if (leave.status !== 'pending') {
        return res.status(400).json({ error: 'Leave already processed.' });
      }

      if (status === 'approved') {
        const leaveUser = await Account.findByPk(leave.userId);
        if (!leaveUser) {
          return res.status(404).json({ error: 'Leave user not found.' });
        }

        if (leave.leavedays > leaveUser.remainingleavedays) {
          return res.status(400).json({ error: 'User does not have enough leave days.' });
        }

        // Update user's leave days
        leaveUser.consumeddays += leave.leavedays;
        leaveUser.remainingleavedays -= leave.leavedays;
        await leaveUser.save();

        // Set return date and update leave
        const returnDate = new Date(leave.leaveend);
        returnDate.setDate(returnDate.getDate() + 1);

        leave.returningfromleave = returnDate;
        leave.status = 'approved';
        await leave.save();

        // Send approval email
        const transport = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: process.env.APP_USER,
            pass: process.env.APP_PASS,
          },
        });

        const mailOptions = {
          from: process.env.APP_USER,
          to: leaveUser.email,
          subject: 'Leave Status',
          text: 'Hey, your leave has been approved.',
        };

        await transport.sendMail(mailOptions);

        return res.status(200).json({
          message: 'Leave approved successfully, and email sent to the recipient.',
          leave: {
            ...leave.toJSON(),
            returningfromleave: returnDate,
          },
        });
      } else if (status === 'rejected') {
        leave.status = 'rejected';
        await leave.save();

        // Send rejection email
        const transport = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: process.env.APP_USER,
            pass: process.env.APP_PASS,
          },
        });

        const mailOptions = {
          from: process.env.APP_USER,
          to: verifyUser.email,
          subject: 'Leave Status',
          text: 'Hey, your leave has been rejected.',
        };

        await transport.sendMail(mailOptions);

        return res.status(200).json({
          message: 'Leave rejected successfully, and email sent to the recipient.',
          leave: leave.toJSON(),
        });
      }
    }

    // Resident or staff logic
    if (verifyUser.role === 'resident' || verifyUser.role === 'staff') {
      if (parseInt(leave.userId, 10) !== parseInt(verifyUser.id, 10)) {
        return res.status(403).json({ error: 'You are not authorized to update this leave.' });
      }

      if (status) {
        return res.status(400).json({ error: 'Users cannot update the leave status.' });
      }

      // Update allowed fields
      leave.leavename = leavename || leave.leavename;
      leave.leavestart = leavestart || leave.leavestart;
      leave.leaveend = leaveend || leave.leaveend;
      leave.leavereason = leavereason || leave.leavereason;
      leave.image = image || leave.image;

      await leave.save();

      return res.status(200).json({
        message: 'Leave details updated successfully.',
        leave: leave.toJSON(),
      });
    }

    // Unauthorized role
    return res.status(403).json({ error: 'You are not authorized to perform this action.' });
  } catch (error) {
    console.error('Error updating leave:', error);
    res.status(500).json({ error: 'An error occurred while updating the leave.' });
  }
};

const getLeaves = async (req, res) => {
  console.log("hello world")
  try {
    const user = req.user
    console.log("The user is" , user)
    const verifyUserExisist = await Account.findByPk(user); 
    console.log("The user found is  " , verifyUserExisist)
    if (!verifyUserExisist) {
      return res
        .status(404)
        .json({ status: 'failed', message: 'user not found' });
    } 

    if (verifyUserExisist.role === 'admin') {
      const leaves = await Leaves.findAll({
        order: [['createdAt', 'DESC']],
      });
    return  res.status(200).json({ status:'success',leaves ,username:verifyUserExisist.username});
    } else { 
      
      const leaves = await Leaves.findAll({
        where: { userId: user},
        order: [['createdAt', 'DESC']], 
    });; 
      return res.status(200).json({status:"success" , leaves})
    }
  } catch (error) {
    console.log(error)
    res.status(500).json({ status: 'failed', message: error.message });
  }
}; 


const deleteYourLeave = async (req, res) => {
  try {
    const userId = req.user;
    const findUser = await Account.findByPk(userId);
    if (!findUser) {
      return res.status(400).json({ status: "Failed", message: "User not found" });
    }

    const { id } = req.params;
    const verifyLeave = await Leaves.findByPk(id);
    if (!verifyLeave) {
      return res.status(400).json({ status: "Failed", message: "Leave not found" });
    }

    if (verifyLeave.userId !== userId) {
      return res.status(400).json({ status: "Failed", message: "Bad request" });
    }

    // Update the user's leave balance before deleting the leave
    if (verifyLeave.status === 'approved') {
      findUser.consumeddays -= verifyLeave.leavedays;
      findUser.remainingleavedays += verifyLeave.leavedays;
      await findUser.save();
    }

    // Delete the leave
    await Leaves.destroy({ where: { id } });

    return res.status(200).json({ status: "Success", message: "Leave deleted successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: "Failed", message: error.message });
  }
};

module.exports = { requestLeave, updateLeaveStatus, getLeaves , deleteYourLeave};
