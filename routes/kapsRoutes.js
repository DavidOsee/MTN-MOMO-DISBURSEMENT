//
const express = require('express')
const router = express.Router()

const {Home, Success, GetPaid, Error, Process, SaveSurveyData} = require('../controllers/kapsController.js')

//Middlewares
const Trans_auth = require('../middlewares/trans_authMiddleware.js')


//GET ROUTES
router
.get('/', Home)
.get('/process', Trans_auth, Process)
.get('/success',Trans_auth, Success)
.get('/error/:id', Trans_auth, Error)

//POST ROUTES 
router
.post('/save', SaveSurveyData)
.post('/getpaid', GetPaid)



//Export to server 
module.exports = router; 