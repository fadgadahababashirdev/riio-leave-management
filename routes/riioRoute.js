const express = require('express');
const {
  register,
  updateUser,
  users,
  user,
  deleteUser,
} = require('../controllers/register');
const login = require('../controllers/login');
const authorization = require('../controllers/authorization');
const router = express.Router();
const upload = require('../helpers/multer');
const createPassword = require('../controllers/create-password');
const forgotPassword = require('../controllers/forgot-password');
const resetPassword = require('../controllers/reset-password');
const askLeave = require('../controllers/leave');

router.post('/register', register);
// login
router.post('/login', login);
// all users
router.get('/users', authorization, users);
// update a user
router.put('/update/:id', authorization, upload.single('image'), updateUser);
// getting single user
router.get('/user/:id', authorization, user);
//
router.delete('/user/:id', authorization, deleteUser);

//create password
router.post('/create-password', createPassword);
// forgot password
router.post('/forgot-password', forgotPassword);
router.post('/reset-Password', resetPassword);
router.post('/leave', askLeave);
module.exports = router;
