const Account = require("./models/account");
const Holidays = require("date-holidays");

const hd = new Holidays("RW"); // Set Rwanda as the country

const calculateAllowedLeaveDays =(startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  let months = (end.getFullYear() - start.getFullYear()) * 12;
  months -= start.getMonth();
  months += end.getMonth();
  return months * 1.5;
};

const checkLeaveBalance = async (userId, requestedDays, startDate, endDate) => {
  const allowedDays = calculateAllowedLeaveDays(new Date(startDate), new Date(endDate));
  const usedDays = await Account.sum('annualleavedays', { where: { id: userId } }); // Use `id` instead of `userId`

  const availableDays = allowedDays - usedDays;
  return availableDays >= requestedDays;
};

const isWeekend = (date) => {
  const day = date.getDay();
  return day === 0 || day === 6;
};

const isPublicHoliday = (date) => {
  const holiday = hd.isHoliday(date);
  return holiday !== false;
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
