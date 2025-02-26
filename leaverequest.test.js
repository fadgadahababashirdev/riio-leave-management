const { calculateAllowedLeaveDays, checkLeaveBalance, calculateReturnDate } = require('./leaveLogic');
const Account = require('./models/account'); // Import the Account model

// Mock the Account model
jest.mock('./models/account', () => ({
  sum: jest.fn(), // Mock the sum method
}));

describe('Leave Logic Tests', () => {
  test('calculateAllowedLeaveDays should return correct days', () => {
    const startDate ='2025-01-01';
    const endDate = '2025-04-01';
    expect(calculateAllowedLeaveDays(startDate, endDate)).toBe(4.5);
  });



  test('checkLeaveBalance should return false if not enough days', async () => {
    const userId = 1; // This corresponds to the `id` column in the `accounts` table
    const requestedDays = 6;
    const startDate = '2025-01-01';
    const endDate = '2025-04-01';

    // Mock the Account.sum method to return 10 used days
    Account.sum.mockResolvedValue(10);

    const hasEnoughDays = await checkLeaveBalance(userId, requestedDays, startDate, endDate);
    expect(hasEnoughDays).toBe(false);
  });

  test('calculateReturnDate should exclude weekends and public holidays', () => {
    const startDate = '2025-04-01';
    const leaveDays = 6;
    const returnDate = calculateReturnDate(startDate, leaveDays);
    expect(returnDate.toISOString().split('T')[0]).toBe('2025-04-09'); 
  });
});