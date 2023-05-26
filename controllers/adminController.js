//
const asyncHandler = require('express-async-handler')
const momo = require("mtn-momo")
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
const uuid = require('uuid')

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


  //No Admin found
  if(admin.length == 0)  
    res.send('notFound')

  else
  {

    //Current Admin _id 
    let admin_id = admin[0]._id.valueOf()

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
    //--Set a uniq UUID value representing the User's DEVICE LOGIN SESSION 
    const token_uid = uuid.v4().slice(0,8)
    ls.setItem('token_'+token_uid, token)
    
    //Create admin cookie 
    res.cookie("admin_id", token_uid, {maxAge: 1000 * 60 * 44640, httpOnly: true, secure: true }) //1 Month in milliseconds
    

    //REMEMBER ME SYSTEM 
    if(remember == 'true') //Remember is being sent as a String from the Front-End
      if(!req.cookies.remember)
        res.cookie("remember", admin_id, {maxAge: 1000 * 60 * 525600,httpOnly: true, secure: true }) //1 year

    if(remember == 'false') //Delete cookie when admin does want to be remembered
      if(req.cookies.remember) //Return undefined if not found
        res.clearCookie("remember")


    //Send email
    //-- Setup email data with unicode symbols
    // let info = transporter.sendMail({
    //   from: '"Admin Area "<admin@area.com>', 
    //   to: `${form_email}`,
    //   subject: "Admin Area - Successful Log in",  
    //   text: "You are successfuly logged in. \n Kindly log in to report to our email address if it is not you."
    // }) 

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

  
  //Check Current admin role 
  const {role} = req.admin_details


  if(role != "Main")
    res.send('unauthorized') //Admin not authorized to register a new USER 

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

    //Email User thier credenials 
    //Send email
    //-- Setup email data with unicode symbols
    transporter.sendMail({
      from: '"Admin Area "<admin@area.com>', 
      to: `${form_email}`,
      subject: "Admin Area - Admin user account",  
      // text: 'Greeting !'+fname,
      html: `<h4>An <b>Admin Area</b> account has been opened on your behalf, Kindly use the following credentials to be able to login.</h4> <br /> <h2>Email - ${form_email} <h2> <h2>Password - ${pwd} <h2>`
    }) 


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




//Delete Admin User 

//Delete_user  @ /admin/delete [POST]
//@ Private access 

const Delete_user = asyncHandler (async(req,res)=>{

  const { user_id } = req.body

  //Check Current admin role 
  const {role} = req.admin_details

  if(role != "Main")
    res.send('unauthorized') //Admin not authorized to delete USER 
  
  else
  {
    //Check validity of user_id 
    if((typeof user_id) != 'string') 
      res.send('Error')
    
    else{
      //Delete User from DB 
      try {
        //
        await Admin_user.findByIdAndDelete(user_id) 
        res.status(200).send('all good')

      } catch (error) {
        res.send('Error')
      }
    }
  }//End Authorized User 


})








const SendOTP = asyncHandler (async(req,res)=>
{

  //Grab ajax req 
  const { form_email } = req.body

  //Check credentials
  const admin = await Admin_user.find({ email : form_email}).select('_id email')

  //No Admin found
  if(admin.length == 0)  
    res.send('notFound')

  else
  {
    //Current Admin _id 
    let admin_id = admin[0]._id.valueOf()

    //Gen OTP
    let otp = uuid.v4().slice(0,6) //Math.floor((Math.random() * 100) + 926530);

    //Payload Obj
    const payload = { email : admin[0].email, otp }

    //GENERATE JWT WITH TRANSACTION DETAILS IN PAYLOAD
    const reset_token = generateToken(payload, '600000ms') //10min

    //Store token value in localStorage
    //--Set a uniq UUID value representing the User's DEVICE LOGIN SESSION 
    const _uid = uuid.v4().slice(0,8)
    ls.setItem('resetToken_'+_uid, reset_token)
    
    //Create admin cookie 
    res.cookie("reset_id", _uid, {maxAge: 600000, httpOnly: true, secure: true }) //10min in milliseconds


    //Mailling User the OTP 
    //-- Setup email data with unicode symbols
    transporter.sendMail({
      from: '"Admin Area "<admin@area.com>', 
      to: `${form_email}`,
      subject: "Admin Area - Password reset",  
      html: `<h3>${otp.toUpperCase()}</h3><h4> is the OTP (one time password) for your password reset request.<h4>In case you have not initiated this request, please report it at the earliest</h4>`
    }) 

    //RETURN TO VIEW 
    res.send('all good')


  }//END SendOTP
    
})//End 





const ValidateOTP = asyncHandler (async(req,res)=>
{

  //Grab ajax req 
  const { form_otp } = req.body

  //Grab payload 
  const { otp } = req.reset_token

  //Compare OTP VALUES 
  if(form_otp != otp.toUpperCase())
    res.send('wrong')
  
  else 
    res.send('all good')

    
})//End ValidateOTP




const ResetPwd = asyncHandler (async(req,res)=>
{

  //Grab ajax req 
  const { new_pwd } = req.body

  //Grab payload 
  const { email } = req.reset_token

  //Update DB Pwd where email 
  try {
    //Bcrypot pwd 
    let pwd = await bcrypt.hash(new_pwd, 10)  

    //Create new db instance 
    await Admin_user.findOneAndUpdate({ password : pwd})
    
  } catch (error) {
      res.send('error')
  }

  //Inform User 
  //Send email
  //-- Setup email data with unicode symbols
  // transporter.sendMail({
  //   from: '"Admin Area "<admin@area.com>', 
  //   to: `${form_email}`,
  //   subject: "Admin Area - Admin user account",  
  //   // text: 'Greeting !'+fname,
  //   html: `<h4>An <b>Admin Area</b> account has been opened on your behalf, Kindly use the following credentials to be able to login.</h4> <br /> <h2>Email - ${form_email} <h2> <h2>Password - ${pwd} <h2>`
  // }) 


  //Grab admin ID
  const id = req.cookies.reset_id //The cookie will obviously exist 

  //Delete token file 
  if(ls.getItem('resetToken_'+id))
    ls.removeItem('resetToken_'+id)

  //Clear cookie 
  if(req.cookies.reset_id) //Return undefined if not found
    res.clearCookie("reset_id")


  //
  res.send('All good')
  

})//End ResetPwd


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
      createdAt : data.createdAt

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

  //Grabing payload for the view <header>
  const { fname, lname, role} = req.admin_details

  //Names in uppercase 
  fn = fname.toUpperCase()
  ln = lname.charAt(0).toUpperCase() + ". "

  //
  res.render('admin/profile', {fn, ln, role})
})



//USERS  @ admin/users [GET]
//@ Private access 

const Users = asyncHandler (async(req,res)=>{

  //Grabing payload for the view <header>
  const { fname, lname, role} = req.admin_details

  //Fetching admin users 
  const admin_users = await Admin_user.find().select('_id firstname lastname role createdAt').sort({createdAt : -1}).exec()

  //Arrange Obj data for the view
  let users = []
  admin_users.forEach((user,index)=>{

    users.push({
      id : user._id.valueOf(),
      firstname : user.firstname,
      lastname : user.lastname,
      role : user.role,
      createdAt : user.createdAt
    })
  })


  //Names in uppercase 
  fn = fname.toUpperCase()
  ln = lname.charAt(0).toUpperCase() + ". "

  //
  res.render('admin/users', {fn, ln, role, users})
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



//EXPORT TO ADMIN ROUTES 
module.exports = { Login, Log_me_in, Logout, Home, TransFee, Profile, Users, Register, Admin_register, Delete_user, ForgotPwd, ForgotPwd_otp, Password_reset, SendOTP, ValidateOTP, ResetPwd }