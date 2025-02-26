const express = require('express');
const Leaves = require("../models/leaves")
const { checkLeaveBalance, calculateReturnDate }=require('../leaveLogic');


const createLeave = async()=> {
  const { userId, leavename, leavestart, leaveend, leavedays, leavereason, image } = req.body;

  const hasEnoughDays = await checkLeaveBalance(userId, leavedays, leavestart, leaveend);
  if (!hasEnoughDays) {
    return res.status(400).json({ message: 'Not enough leave days' });
  }

  const returningfromleave = calculateReturnDate(leavestart, leavedays);

  const leave = await Leaves.create({
    userId,
    leavename,
    leavestart,
    leaveend,
    leavedays,
    returningfromleave,
    leavereason,
    image,
    status: 'pending',
  });

  res.status(201).json(leave);
};

module.exports ={createLeave};