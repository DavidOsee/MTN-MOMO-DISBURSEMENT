//
const express = require('express')
const router = express.Router()

const {Home, Success, GetPaid, Error, Process, NotFound} = require('../controllers/kapsController.js')

//Middlewares
const Protect = require('../middlewares/authMiddleware.js')


//
router
.get('/', Home)
.get('/process', Process)
.get('/success', Success)
.get('/error', Error)
.get('*', NotFound)

//POST REQ
router
.post('/getpaid', GetPaid)



//Export to server 
module.exports = router; 