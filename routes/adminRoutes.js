
//
const express = require('express')
const admin_router = express.Router()

const {Login, Log_me_in, Logout, Home, TransFee, Profile, Users, Register, Admin_register, Delete_user,  ForgotPwd, ForgotPwd_otp, Password_reset} = require('../controllers/adminController.js')

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

//
admin_router
.post('/logmein', Log_me_in)
.post('/logout', Logout)
.post('/admin_register', Protect, Admin_register) //Protected to have access to the payload
.post('/transFee', TransFee)
.post('/delete', Protect, Delete_user)



//Export to server 
module.exports = admin_router