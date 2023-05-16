//
const asyncHandler = require('express-async-handler')
const uuid = require('uuid')
const momo = require("mtn-momo")
const jwt = require('jsonwebtoken')
const { GoogleSpreadsheet } = require('google-spreadsheet')
const credentials = require('../G_credentials.json')

//Localstorage
const LocalStorage = require('node-localstorage').LocalStorage
const localStorage = new LocalStorage('./scratch')


//Bcrypt
const bcrypt = require('bcrypt')

//ENCRYPTED ERROR MSG 
const error  = async (msg)=>{ await bcrypt.hash(msg,2) }


//INITIALIZING MOMO LIBRARY
const { Disbursements } = momo.create({
  callbackHost: process.env.CALLBACK_HOST
})

//--SET GLOBAL VARIABLE AMOUNT 
localStorage.setItem('amount', 5000)
AMOUNT = (localStorage.getItem('amount')) ? localStorage.getItem('amount') : 5000


//Initialising disbursements
const disbursements = Disbursements({
  userSecret: process.env.USER_SECRET,
  userId: process.env.USER_ID,
  primaryKey: process.env.PRIMARY_KEY
})



//GETTING DATA FROM G-SHEET recording G-FORM data 
// Initialize the sheet - doc ID is the long id in the sheets URL
const doc = new GoogleSpreadsheet(process.env.SHEET_ID);


//MODELS
const Trans = require('../models/trans')
const Survey_data = require('../models/survey_data')
//const { use } = require('../routes/kapsRoutes')


//-- POST REQUESTS --

//  @ /save [POST]
const SaveSurveyData = asyncHandler( async (req, res) => {

  const { load } = req.body //load == true from ajax req

  //Populate database with G-Sheet data when clicking on Bonus Tab
  if(load)
  {

    try 
    {
      // Initialize Auth 
      await doc.useServiceAccountAuth(credentials);

      await doc.loadInfo() // loads document properties and worksheets
      //await doc.updateProperties({ title: 'renamed doc' })

      const sheet = doc.sheetsByIndex[0]; // or use doc.sheetsById[id] or doc.sheetsByTitle[title]
      
      //console.log(doc.sheetsByIndex[0].headerValues) //Fetching header values

      //Sheet data init 
      let sheet_data = []
      
      
      //Get collection count -- Survey data count 
      const surveyDataCount = await Survey_data.countDocuments({}).exec()

      //const db_numbers = await Survey_data.distinct('number').exec()
      //const records = await Survey_data.find({ 'number': { $in: sheet_numbers } })
      
      //First data population into DB 
      if(surveyDataCount <= 0){

        //GET ROWS
        const rows = await sheet.getRows()
        
        rows.forEach((row, id) => {

          //Allow name dupliates 
          sheet_data.push({
            name : rows[id]['What is your full name?'],
            number : rows[id]['Phone number'].toString()
          })
        })

        //Create first instances in DB 
        await Survey_data.create(sheet_data)
      }
      else{

        //Fetch only newly added sheet data 
        //GET ROWS
        const rows = await sheet.getRows({ offset : surveyDataCount})
        
        rows.forEach((row, id) => {

          //Allow name dupliates 
          sheet_data.push({
            name : rows[id]['What is your full name?'],
            number : rows[id]['Phone number'].toString()
          })
        })

        //Populate DB with new rows from the sheet 

        //Only if shee_data array has data 
        if(sheet_data.length != 0)
          await Survey_data.insertMany(sheet_data)
        
      }
        
      
    } catch (error) {
      //Return error to Front-End
      res.send(error.message)
    }

  }//End if
  
})//End SaveSurveyData


//--






//GETPAID  @ / [POST]
//@ Private access
const GetPaid = asyncHandler (async(req,res)=>
{


  //AJAX req value 
  const {user_number} = req.body

  //Check if User already filled the fornm
  const number_exists = await Survey_data.find({ number : user_number}) //[]
  
  if(number_exists.length == 0){
    res.send('unknown') //NOT FOUND >> User needs to complete G-Form submission FIRST
    return false
  }
  else{
    //USER ATTEMPTING TO REDEEM THE BONUS TWICE 
    //--Checking if number already exists and status == 'Successful'
    const check_number = await Trans.find({ 'user.number' : user_number, status : "SUCCESSFUL"}) //Return []

    //User found with a previous successful transaction 
    if(check_number.length != 0)
    {
      //Send a feedback to the FRONT-END 
      res.send('found')
    }
    else //USER FILLED THE FORM - CHECKED && USER NOT YET REDEEM - CHECKED 
    {
      console.log('User eligible for the bonus')
      
      //FETCH USER DETAILS FROM SURVVEY_DATA COLLECTION 
      const user_details = await Survey_data.find({ number : user_number }).select('name number -_id ')
  
      const user = user_details[0]
      
      //Disbursements
      disbursements
      .transfer({
        amount: parseInt(AMOUNT),
        currency: "EUR",
        externalId: "947354",  //Self Momo number 
        payee: {
          partyIdType: "MSISDN", //Mesage type notification/alert 
          partyId: user_number //Client phone number 
        },
        payerMessage: "testing message",
        payeeNote: "Thanks for using our services",
        callbackUrl: process.env.CALLBACK_URL
      })
      .then(transactionId => {
      
        //CREATE TRANSACTION DETAILS OBJ 
        const transaction_details = {
          user, user_number, AMOUNT, transactionId
        }
  
        //GENERATE JWT WITH TRANSACTION DETAILS IN PAYLOAD
        const trans_token = generateToken(transaction_details, '120s') //2min 
  
        //WRITE TOKEN IN SERVER LOCALSTORAGE 
        const token_id = uuid.v4().slice(0,8) //Sonme id to diff each trans_token 
  
        //--Store token_id into user's cookies 
        res.cookie("trans_token_id", token_id, {httpOnly: true, secure: true }) //After 4 min(240s * 1000s)
  
        //Write JWT in SERVER LOCALSTORAGE
        localStorage.setItem('trans_token_'+token_id.toString(), trans_token)
        
        //REDIRECT
        res.send('all good')
      })
      .catch(error => {
        //
        res.redirect(`/error/1`) // 0 - Transaction timed out | 1 - Internal serval error
        console.log(error)
      })
      
  
    }//END ELSE
  }
    

})//END GET PAID







//PROCESS  @ / [GET]
//@ Private access 

const Process = asyncHandler (async(req,res)=>
{
  //Grab trans id 
  const trans_id = req.transaction_details.transactionId
  let trans_code = '1' //Init with an internal error type 

  //TRANSACTOION STATUS 
  //Get transaction status and (account balance)
  disbursements.getTransaction(trans_id)
  .then(transaction =>{
   
    //Get transaction status
    const trans_status = transaction.status

    //Defining status code 
    trans_code = (trans_status == "Timeout") ? '0' : '1' 

    //Push trans_status into trans_details 
    req.transaction_details.trans_status = trans_status.toString()

    //Render to the template with the needed obj
    res.render('process', {trans_id, trans_status})
  })
  .catch(e =>{
    //
    res.redirect(`/error/${trans_code}`)
    console.log(e.message)
  })

  //
  //res.render('process')
})


//SUCCESS  @ / [GET]
//@ Private access 

const Success = asyncHandler (async(req,res)=>
{

  //GRAB TRANS DETAILS VALUES 
  const {user, user_number, AMOUNT, transactionId} = req.transaction_details
  let user_name = user.name
  let trans_code

  //MAKING SURE THE TRANSACTION ID IS UNIQUE 
  const t_id = await Trans.find({ trans_id : transactionId }) //[]

  //CONFIRM TRANSACTOION STATUS -- Preventing Users to reach out the route though an unccessful transaction 
  disbursements.getTransaction(transactionId)
  .then(transaction =>{
   
    //Get transaction status
    const trans_status = transaction.status

    //Defining status code 
    trans_code = (trans_status == "Timeout") ? '0' : '1' 

    //UNSUCCESSFUL TRANSACTION 
    if(trans_status != "SUCCESSFUL")
    {
      res.redirect(`/error/${trans_code}`)
      return false //PREVENT SERVER CRASHING BY HAVING TO SEND HEADERS BELOW IN ADDITION TO THIS ONE 
    }

    //STORE INTO DB 
    //store_in_trans = async(user, amount, transactionId, trans_status)
    if(t_id.length == 0){ //No entry found 

      //STORE TRANSACTION DETAILS IN DB 
      Trans.create({
        user : user,
        amount : AMOUNT,
        trans_id : transactionId,
        status : trans_status
      })
    }

    //DELETE TRANSACTION RELATED FILES 
    //--Get trans_token_id  cookie 
    if (req.cookies.trans_token_id){

      //Delete SERVER LOCAL STORAGE trans_token 
      localStorage.removeItem('trans_token_'+ req.cookies.trans_token_id)

      //Delete cookie
      res.clearCookie('trans_token_id')
    }

    //
    res.render('success', {user_name})
  })
  .catch(e =>{
    //
    res.redirect(`/error/${trans_code}`)
    console.log(e.message)
  })
    
})//End Success  



//ERROR  @ / [GET]
//@ Private access 

const Error = asyncHandler (async(req,res)=>
{

  //GRAB TRANS DETAILS VALUES 
  const {user, user_number, AMOUNT, transactionId} = req.transaction_details
  let trans_code

  //MAKING SURE THE TRANSACTION ID IS UNIQUE 
  const t_id = await Trans.find({ trans_id : transactionId }) //[]
  
  //Grab error code 
  let err_code = req.params.id

  //CONFIRM TRANSACTOION STATUS -- Preventing Users to reach out the route though an unccessful transaction 
  disbursements.getTransaction(transactionId)
  .then(transaction =>{
   
    //Get transaction status
    const trans_status = transaction.status

    //Defining status code 
    trans_code = (trans_status == "Timeout") ? '0' : '1' 

    //UNSUCCESSFUL TRANSACTION 
    if(trans_status == "SUCCESSFUL"){
      res.redirect(`/success`)
      return false //PREVENT SERVER CRASHING 
    }
      

    //STORE INTO DB 
    //store_in_trans = async(user, amount, transactionId, trans_status)
    if(t_id.length == 0){ //No entry found 

      //STORE TRANSACTION DETAILS IN DB 
      Trans.create({
        user : user,
        amount : AMOUNT,
        trans_id : transactionId,
        status : trans_status
      })
    }

    //DELETE TRANSACTION RELATED FILES 
    //--Get trans_token_id  cookie 
    if (req.cookies.trans_token_id){

      //Delete SERVER LOCAL STORAGE trans_token 
      localStorage.removeItem('trans_token_'+ req.cookies.trans_token_id)

      //Delete cookie
      res.clearCookie('trans_token_id')
    }

    //
    res.render('error', {err_code})
  })
  .catch(e =>{
    //
    res.redirect(`/error/${trans_code}`)
    console.log(e.message)
  })

}) //End error route 








//HOME  @ / [GET]
//@ Public access 

const Home = asyncHandler( async(req, res)=>
{
  
  //Get trans_token_id from the user browser 
  const trans_token_id = req.cookies.trans_token_id

  //Grab trans_token
  const trans_token = localStorage.getItem(`trans_token_${trans_token_id}`) 

  //USER CLICKED ON BACK BUTTON WHEN ON /PROCESS 
  //--Check trans_token and cookie existance 
  if(trans_token != null) //Token still exist >> Cancel the transaction
  {
    //Delete token
    localStorage.removeItem('trans_token_'+trans_token_id)  

    //Delete 
    res.clearCookie('trans_token_id')
  }

	//
  res.render('home')
  

}) //End Home controller 












//========================= UTIL FUNCTIONS 

//GENERATE JWT 
const generateToken = (transaction_details, expiring_time)=>{
  //Create token 
  return jwt.sign(transaction_details, process.env.SECRET_KEY, { expiresIn : expiring_time})
}

//VALIDATE JWT 
const validateToken = (token)=>{
  return jwt.verify(token, process.env.SECRET_KEY)
}



//============================











//Admin  @ / [GET]
//@ Public access 

const Admin = (req,res)=>{

  //
  res.render('admin/login')
}


//Export to kapsRoutes 
module.exports = {
	Home, Success, GetPaid, Error, Process, SaveSurveyData, Admin
}