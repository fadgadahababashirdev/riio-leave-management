const Account = require("./models/account");

   const calculateAllowedLeaveDays = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    let months = (end.getFullYear() - start.getFullYear()) * 12;
    months -= start.getMonth();
    months += end.getMonth();
    return months * 1.5;
  }; 
  const checkLeaveBalance = async (userId, requestedDays, startDate, endDate) => {
    const allowedDays = calculateAllowedLeaveDays(new Date(startDate), new Date(endDate));
    const usedDays = await Account.sum('leavedays', { where: { id: userId } }); // Use `id` instead of `userId`
    console.log("The user id is ", userId);
    const availableDays = allowedDays - usedDays;
    return availableDays >= requestedDays;
  };
  const isWeekend = (date) => {
    const day = date.getDay();
    return day === 0 || day === 6;
  };
  
  const isPublicHoliday = (date) => {
    // Implement logic to check if the date is a public holiday in Rwanda
    // This could be a list of dates or an API call
    const publicHolidays = [
      '2025-01-01', // New Year's Day
      '2025-02-01', // Hero's Day
      // Add more public holidays
    ];
    return publicHolidays.includes(date.toISOString().split('T')[0]);
  };
  
   const calculateReturnDate = (startDate, leaveDays) => {
    let returnDate = new Date(startDate);
    let daysAdded = 0;
    while (daysAdded < leaveDays) {
      returnDate.setDate(returnDate.getDate() + 1);
      if (!isWeekend(returnDate) && !isPublicHoliday(returnDate)) {
        daysAdded++;
      }
    }
    return returnDate;
  }; 

  module.exports = {
    calculateAllowedLeaveDays,
    checkLeaveBalance,
    calculateReturnDate,
  };