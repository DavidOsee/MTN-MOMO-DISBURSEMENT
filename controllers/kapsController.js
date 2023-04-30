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


//INITIALIZING MOMO LIBRARY
const { Disbursements } = momo.create({
  callbackHost: process.env.CALLBACK_HOST
})

//Initialising disbursements
const disbursements = Disbursements({
  userSecret: process.env.USER_SECRET,
  userId: process.env.USER_ID,
  primaryKey: process.env.PRIMARY_KEY
})


//GETTING DATA FROM G-SHEET recording G-FORM data 
// Initialize the sheet - doc ID is the long id in the sheets URL
const doc = new GoogleSpreadsheet(process.env.SHEET_ID);

(async function() {
  
  // Initialize Auth 
  await doc.useServiceAccountAuth(credentials);

  await doc.loadInfo() // loads document properties and worksheets
  //await doc.updateProperties({ title: 'renamed doc' })

  const sheet = doc.sheetsByIndex[0]; // or use doc.sheetsById[id] or doc.sheetsByTitle[title]
  
  //GET ROWS
  const rows = await sheet.getRows(); // can pass in { limit, offset }
  //console.log(rows[0].Timestamp)
  console.log(doc.sheetsByIndex[0].headerValues)
  
}())








//HOME  @ / [GET]
//@ Public access 

const Home = asyncHandler( async(req, res)=>
{
	//
  res.render('home')
  

}) //End Home controller 



//GETPAID  @ / [POST]
//@ Private access
const GetPaid = asyncHandler (async(req,res)=>{

  //Destructure Form values
  const { fname, lname, number, amount} = req.body;

  //Disbursements
  disbursements
  .transfer({
    amount: parseInt(amount),
    currency: "EUR",
    externalId: "947354",  //Self Momo number 
    payee: {
      partyIdType: "MSISDN", //Mesage type notification/alert 
      partyId: number //Client phone number 
    },
    payerMessage: "testing message",
    payeeNote: "Thanks for using our services",
    callbackUrl: process.env.CALLBACK_URL
  })
  .then(transactionId => {
   
    //CREATE TRANSACTION DETAILS OBJ 
    const transaction_details = {
      fname, lname, number, amount, transactionId
    }

    //GENERATE JWT WITH TRANSACTION DETAILS IN PAYLOAD
    const token = generateToken(transaction_details)

    //WRITE TOKEN IN LOCALSTORAGE 
    localStorage.setItem("token", token)
    

    //REDIRECT
    res.redirect(`/success`)
  })
  .catch(error => {
    //
    res.render('error', {error}) //RENDER A TEMPLATE THAT NICELY DISPLAYS ERROR  
    console.log(error)
  });
})



//PROCESS  @ / [GET]
//@ Private access 

const Process = asyncHandler (async(req,res)=>{

  //
  res.render('process')
})




//SUCCESS  @ / [GET]
//@ Private access 

const Success = asyncHandler (async(req,res)=>{

  //
  res.render('success')
})



//ERROR  @ / [GET]
//@ Private access 

const Error = asyncHandler (async(req,res)=>{

  //
  res.render('error')
})





//NOTFOUND  @ / [GET]
//@ Private access 

const NotFound = (req,res)=>{

  //
  res.render('404')
}


//GENERATE JWT 
const generateToken = (transaction_details)=>{
  //Create token 
  return jwt.sign(transaction_details, process.env.SECRET_KEY, { expiresIn : "1s"})
}


//Export to kapsRoutes 
module.exports = {
	Home, Success, GetPaid, Error, Process, NotFound
}