//
const asyncHandler = require('express-async-handler')
const uuid = require('uuid')
const momo = require("mtn-momo")
const jwt = require('jsonwebtoken')

//Localstorage
const LocalStorage = require('node-localstorage').LocalStorage
const localStorage = new LocalStorage('./scratch')


//LOGIN  @ /admin [GET]
//@ Public access 

const Login = asyncHandler (async(req,res)=>{

    //
    res.render('login')
  })



//EXPORT TO ADMIN ROUTES 
module.exports = { Login }