//
const asyncHandler = require('express-async-handler')
const uuid = require('uuid')
const momo = require("mtn-momo")
const jwt = require('jsonwebtoken')

//Localstorage
const LocalStorage = require('node-localstorage').LocalStorage
const localStorage = new LocalStorage('./scratch')


//LOGIN  @ /admin [POST]

const Login = asyncHandler (async(req,res)=>{

    //
    
  })


//Home  @ /admin/home [GET]
//@ Private access 

const Home = asyncHandler (async(req,res)=>{

  //
  res.render('admin/home')
})




//PROFILE  @ /admin/profile [GET]
//@ Private access 

const Profile = asyncHandler (async(req,res)=>{

  //
  res.render('admin/profile')
})



//USERS  @ admin/users [GET]
//@ Private access 

const Users = asyncHandler (async(req,res)=>{

  //
  res.render('admin/users')
})


//REGISTER  @ /register [GET]
//@ Private access 

const Register = asyncHandler (async(req,res)=>{

  //
  res.render('admin/register')
})



//FORGOT PASSWORD  @ /forgot-password [GET]
//@ Private access 

const ForgotPwd = asyncHandler (async(req,res)=>{

  //
  res.render('admin/forgot-password')
})


//FORGOT PASSWORD OTP @ /otp-auth [GET]
//@ Private access 

const ForgotPwd_otp = asyncHandler (async(req,res)=>{

  //
  res.render('admin/otp-auth')
})


//PASSWORD RESET @ /password-reset [GET]
//@ Private access 

const Password_reset = asyncHandler (async(req,res)=>{

  //
  res.render('admin/password-reset')
})


//SUCCESS @ /admin/success [GET]
//@ Private access 

const Success = asyncHandler (async(req,res)=>{

  //
  res.render('admin/success')
})



//EXPORT TO ADMIN ROUTES 
module.exports = { Login, Home, Profile, Users, Register, ForgotPwd, ForgotPwd_otp, Password_reset, Success }