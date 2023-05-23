//
const asyncHandler = require('express-async-handler')
const momo = require("mtn-momo")
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')

//Localstorage
const LocalStorage = require('node-localstorage').LocalStorage
const ls = new LocalStorage('./admin_storage')

//ADMIN_USER MODEL
const Admin_user = require('../models/admin')
const Trans = require('../models/trans')


// = = = Email Config = = = //
const nodemailer = require('nodemailer')

//Nodemailer SETUP 
//--Create reusable transporter object using the default SMTP transport
let transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: 587,
  auth: {
      user: process.env.EMAIL_USER, // Email provider 
      pass: process.env.EMAIL_PWD  // Email provider pwd 
  }
})


// == END EMAIL CONFIG == //





//= = = POST ROUTES = = =

//--  @ /logmein [POST]

const Log_me_in = asyncHandler (async(req,res)=>{

  //Grab ajax req 
  const {form_email, pwd, remember} = req.body

  //Check credentials
  const admin = await Admin_user.find({ email : form_email}).select('_id firstname lastname email password role')

  //Current Admin _id 
  let admin_id = admin[0]._id.valueOf()

  //No Admin found
  if(admin.length == 0)  
    res.send('notFound')


  else
  {

    //CHECK PASSWORD 
    const check_pwd = await bcrypt.compare(pwd, admin[0].password)

    if(check_pwd == false)
      res.send('wrong_pwd')

      //Payload Obj
      const admin_details = {
        id : admin_id, 
        fname : admin[0].firstname,
        lname : admin[0].lastname,
        email : admin[0].email, 
        role : admin[0].role
      }

    //GENERATE JWT WITH TRANSACTION DETAILS IN PAYLOAD
    const token = generateToken(admin_details, '31d') //1 Month

    //Store token value in localStorage
    ls.setItem('token_'+admin_id, token)
    
    //Create admin cookie 
    res.cookie("admin_id", admin_id, {maxAge: 1000 * 60 * 44640, httpOnly: true, secure: true }) //1 Month in milliseconds
    

    //REMEMBER ME SYSTEM 
    if(remember == 'true') //Remember is being sent as a String from the Front-End
      if(!req.cookies.remember)
        res.cookie("remember", admin_id, {maxAge: 1000 * 60 * 525600,httpOnly: true, secure: true }) //1 year

    if(remember == 'false') //Delete cookie when admin does want to be remembered
      if(req.cookies.remember) //Return undefined if not found
        res.clearCookie("remember")


    //Send email
    //-- Setup email data with unicode symbols
    let info = transporter.sendMail({
      from: '"Admin Area "<admin@area.com>', 
      to: `${form_email}`,
      subject: "Admin Area - Successful Log in",  
      text: "You are successfuly logged in. \n Kindly log in to report to our email address if it is not you."
    }) 

    //RETURN TO VIEW 
    res.send('all good')


  }//END ELSE
    
})//End login system




//--Logout @/logout [POST]
const Logout = asyncHandler (async(req,res)=>{

  //Grab admin ID
  const id = req.cookies.admin_id //The cookie will obviously exist 

  //Delete token file 
  if(ls.getItem('token_'+id))
    ls.removeItem('token_'+id)

  //Clear cookie 
  if(req.cookies.admin_id) //Return undefined if not found
    res.clearCookie("admin_id")

  //Redirect to Admin 
  res.send('loggedOut')

})


//-- @/register [POST]
const Admin_register = asyncHandler (async(req,res)=>
{

  //Grab Ajax req variables 
  const { lname, fname, form_email, form_role, pwd } = req.body

  //Make sure role is either of "Main" or "Viewer"
  const final_role = (form_role != "Main" && form_role != "Viewer" )? "Viewer":  form_role

  //Harsh pwd 
  const harshed_pwd = await bcrypt.hash(pwd, 10)

  //console.log(req.body)
  //Check Current admin role 
  //const {role} = req.admin_details

  //if(role != "Main")
    //res.send('unauthorized') //Admin not authorized to register a new USER 

  //Make sure email is unique 
  const admin_exist = await Admin_user.find({ email: form_email})

  if(admin_exist.length != 0) //Email already exists in the DB 
    res.send('found') 

  else{
    
    try {
      //Create new db instance 
      await Admin_user.create({
        firstname : fname, 
        lastname : lname,
        email : form_email,
        password : harshed_pwd, 
        role : final_role
      })
      
    } catch (error) {
        res.send(error)
    }
    //
    res.send('All good')
    
  }
  
  //Email credentials to the concerned person 


}) //End Admin registration system 




//TransFee  @ /admin/transFee [POST]
//@ Private access 

const TransFee = asyncHandler (async(req,res)=>{

  const { fee } = req.body

  try {
    //Update amount file
    ls.setItem('amount', fee)
    
  } catch (error) {
      res.send('error')
  }
  //
  res.send(fee)
})




//========================= FUNCTIONS 

//GENERATE JWT 
const generateToken = (transaction_details, expiring_time)=>{
  //Create token 
  return jwt.sign(transaction_details, process.env.SECRET_KEY, { expiresIn : expiring_time})
}

//============================




//= = = 

//LOGIN  @ /admin [GET]

const Login = asyncHandler (async(req,res)=>
{

  //Admin forbidden to see this route when logged in 
  if(req.cookies.admin_id)
    if(ls.getItem('token_'+req.cookies.admin_id))
      res.redirect('/admin/home')
  

  //Init remembered credentials
  let admin_email 

  //Check whether remember cookie exist 
  if(req.cookies.remember)
  {
    //Fetch credentials where id stored in cookie
    const credentials = await Admin_user.findById(req.cookies.remember).select('email -_id')
    
    //Grab Email
    admin_email = credentials.email 
  }
    
  //
  res.render('admin/login', {admin_email})
    
})


//Home  @ /admin/home [GET]
//@ Private access 

const Home = asyncHandler (async(req,res)=>{

  const { fname, lname, role} = req.admin_details

  //Fetch transaction data
  const trans_data = await Trans.find().select('-_id user amount trans_id status createdAt')

  //
  let trans_obj = []

  trans_data.forEach((data, index)=>{

    trans_obj.push({
      id : index+1, //Starting from 0
      name : data.user.name,
      number : data.user.number,
      amount : data.amount,
      trans_id : data.trans_id,
      status : data.status,
      createdAt : data.createdAt,

    })
  })


  //Render Transaction fee from amount in localStorage 
  let ls_amount = " ? "
  
  if(ls.getItem('amount'))
    ls_amount = ls.getItem('amount') 

  //Names in uppercase 
  fn = fname.toUpperCase()
  ln = lname.charAt(0).toUpperCase() + ". "

  //render variables for the view 
  res.render('admin/home', {fn, ln, role, ls_amount, trans_obj})
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
module.exports = { Login, Log_me_in, Logout, Home, TransFee, Profile, Users, Register, Admin_register, ForgotPwd, ForgotPwd_otp, Password_reset, Success }