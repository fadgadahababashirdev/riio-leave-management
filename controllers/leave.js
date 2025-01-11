const Holidays = require('date-holidays');
const Leaves = require('../models/leaves');
const Account = require('../models/account');
const nodemailer = require("nodemailer");
const { text } = require('express');
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


const requestLeave = async (req, res) => {
  try {
    const { leavename, leavestart, leaveend, leavereason, leaveDocument } = req.body;
    const userId = req.user;

    if (!userId) {
      return res.status(400).json({ error: 'User not found' });
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
    const realDate = new Date(returnDate) 
    const formattedReturnDate = realDate.toISOString().split('T')[0];


    const newLeave = await Leaves.create({
      leavename,
      leavestart:start,
      leaveend:end,
      leavedays,
      leavereason,
      leaveDocument, 
      returningfromleave:returnDate,
      userId:req.user,
      status:'pending',
    });
   
   
    const admins = await Account.findAll({ where: {role:'admin'}});

    if (!admins.length) {
      return res.status(400).json({ status: 'failed', message: 'No admins found' });
    }

    const adminEmails = admins.map((admin) => admin.email);

    const sendingEmail = req.user;
    if (!sendingEmail) {
      return res.status(400).json({ status: 'failed', message: 'User not found' });
    }

    const account = await Account.findOne({ where: {id:sendingEmail } }); 
    // console.log("The account email is" , account)
    if (!account) {
      return res.status(400).json({error:'User account not found.'});
    } 

  
    const transport = nodemailer.createTransport({
      service:"gmail" ,
      auth:{
        user:process.env.APP_USER ,
        pass:process.env.APP_PASS
      }
    }) 
    const capitalisedName = account.username.split(" ") 
    const finalName = capitalisedName.map(name=>name.charAt(0).toUpperCase() + name.slice(1).toLowerCase())
    const name = finalName.join("")

    const mailOptions = {
      from:account.email,
      to:adminEmails ,
      subject:"Requesting a leave",
      text:`
      ${name} is requesting a leave of ${leavedays} days starting from ${leavestart} and it ends on ${leaveend}. 
      If the leave is approved ${name} will return to work on ${returnDate},
      Click this link to activate to check leave status for ${name}
      `
    } 
    await transport.sendMail(mailOptions)
    return  res.status(201).json({
      message: 'Leave request submitted successfully, and the admins will check it out.',
      leave: {
        ...newLeave.toJSON(),
        returnDate,
      },
    });
  } catch (error) {
    console.log("There was an error")
    console.error(error);
 return   res.status(500).json({error:'An error occurred while requesting leave.' });
  }
};


  const updateLeaveStatus = async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body; 
  
      if (!['approved', 'rejected'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status. Use "approved" or "rejected".' });
      }
  
      const leave = await Leaves.findByPk(id); 
       
      const userAccount = await Account.findOne({where:{id:leave.userId}}) 
     
  
      if (!leave) {
        return res.status(404).json({ error: 'Leave not found.' });
      }
  
      if (leave.status !== 'pending') {
        return res.status(400).json({ error: 'Leave already processed.' });
      }
      
   
      if (status === 'approved') {
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
        const transport = nodemailer.createTransport({
          service:"gmail" , 
          auth:{
            user:process.env.APP_USER,
            pass:process.env.APP_PASS
          }
        }) 

        const mailOptions= {
          from:process.env.APP_USER,
          to:userAccount.email,
          subject:"Leave Status",
          text:"Hey your leave has been approved"
        }  
        await transport.sendMail(mailOptions)
        return res.status(200).json({
          message: 'Leave approved successfully, and email sent to the recipient.',
          leave: {
            ...leave.toJSON(),
            returningfromleave: returnDate,
          },
        });
      } else if (status === 'rejected') { 
        const user = await Account.findByPk(leave.userId); 
        console.log('the user in approved is ' , user.username)
        leave.status = 'rejected';
        await leave.save();
        const transport = nodemailer.createTransport({
          service:"gmail" , 
          auth:{
            user:process.env.APP_USER,
            pass:process.env.APP_PASS
          }
        }) 

        const mailOptions= {
          from:process.env.APP_USER,
          to:userAccount.email,
          subject:"Leave Status",
          text:"Hey your leave has been rejected"
        }  
        await transport.sendMail(mailOptions)
        return res.status(200).json({
          message: 'Leave rejected successfully, and email sent to the recipient.',
          leave: leave.toJSON(),
        });
      }
    } catch (error) {
      console.log("there was an error")
      console.error(error);
      res.status(500).json({ error: 'An error occurred while processing the leave.' });
    }
  };
  


const getLeaves = async (req, res) => {
  try {
    const user = req.user
    // console.log("The user is" , user)
    const verifyUserExisist = await Account.findByPk(user); 
    console.log("The user found id is  " , verifyUserExisist.username)
    if (!verifyUserExisist) {
      return res
        .status(404)
        .json({ status: 'failed', message: 'user not found' });
    } 

    if (verifyUserExisist.role === 'admin') {
      const leaves = await Leaves.findAll({
        order: [['createdAt', 'DESC']],
      });
    return  res.status(200).json({ status: 'success', leaves });
    } else { 
      
      const leaves = await Leaves.findAll({
        where: { userId: user},
        order: [['createdAt', 'DESC']], 
    });; 
      return res.status(200).json({status:"success" , leaves})
    }
  } catch (error) {
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
