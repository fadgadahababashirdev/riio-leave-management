const express = require('express');
const {
  register,
  updateUser,
  users,
  user,
  deleteUser,
} = require('../controllers/register');
const login = require('../controllers/login');
const {authorization ,authorizeAdmin} = require('../controllers/authorization');
const router = express.Router();
const upload = require('../helpers/multer');
const createPassword = require('../controllers/create-password');
const forgotPassword = require('../controllers/forgot-password');
const resetPassword = require('../controllers/reset-password');
const { requestLeave, deleteLeave, allLeaves, getLeave, updateLeaveStatus, updateEmployeeLeaveInfo, updateLeaveWithProof } = require('../controllers/leave');



router.post('/register', register);
// login
router.post('/login',login);
// all users
router.get('/users',authorization, authorizeAdmin ,users);
// update a user
router.put('/update/:id', authorization, upload.single('image'), updateUser);
// getting single user
router.get('/user/:id', authorization, user);
//
router.delete('/user/:id', authorization, authorizeAdmin ,deleteUser); 


//create password
router.post('/create-password',createPassword);
// forgot password
router.post('/forgot-password',forgotPassword);
router.post('/reset-Password',resetPassword);    
router.post('/create-leave',authorization,requestLeave); 
router.get('/leaves',authorization,allLeaves);   
router.delete('/deleteLeave/:id',authorization,authorizeAdmin ,deleteLeave);  
router.get('/leave/:id',authorization,getLeave);  
router.put("/updateLeave/:id",authorization , authorizeAdmin,updateLeaveStatus) 
router.put("/updateleavewithproof/:id" , authorization, upload.single("image") ,updateLeaveWithProof)
router.put("/update-employee-leave-info/:id" , authorization , authorizeAdmin , updateEmployeeLeaveInfo)

// create Leave 




module.exports = router;
