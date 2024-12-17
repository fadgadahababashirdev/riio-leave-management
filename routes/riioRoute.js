const express = require('express');
const { register, updateUser, users } = require('../controllers/register');
const login = require('../controllers/login');
const authorization = require('../controllers/authorization');
const router = express.Router();
const upload = require("../helpers/multer")

router.post('/register', register);
// login
router.post('/login', login);
// all users
router.get('/users', authorization, users);
// update a user
router.put('/update/:id', upload.single('image'), updateUser);
module.exports = router;
