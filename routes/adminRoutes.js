
//
const express = require('express')
const admin_router = express.Router()

const {Login, Home, Profile, Users, Register, ForgotPwd, ForgotPwd_otp, Password_reset, Success} = require('../controllers/adminController.js')

//Middlewares
//onst admin_Protect = require('../middlewares/authMiddleware.js')


//
admin_router
.get('/home', Home)
.get('/profile', Profile)
.get('/users', Users)
.get('/register', Register)
.get('/forgot-password', ForgotPwd)
.get('/otp-auth', ForgotPwd_otp)
.get('/password-reset', Password_reset)
.get('/success', Success)

//
admin_router
.post('/', Login)



//Export to server 
module.exports = admin_router