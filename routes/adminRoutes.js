
//
const express = require('express')
const admin_router = express.Router()

const {Login, Log_me_in, Logout, Home, TransFee, Profile, Users, Register, Admin_register, ForgotPwd, ForgotPwd_otp, Password_reset, Success} = require('../controllers/adminController.js')

//Middlewares
const Protect = require('../middlewares/admin_authMiddleware.js')


//
admin_router
.get('/', Login)
.get('/home', Protect, Home)
.get('/profile', Protect, Profile)
.get('/users', Protect, Users)
.get('/register', Protect, Register)

.get('/forgot-password', ForgotPwd)
.get('/otp-auth', ForgotPwd_otp)
.get('/password-reset', Password_reset)
.get('/success', Success)

//
admin_router
.post('/logmein', Log_me_in)
.post('/logout', Logout)
.post('/admin_register', Admin_register)
.post('/transFee', TransFee)



//Export to server 
module.exports = admin_router