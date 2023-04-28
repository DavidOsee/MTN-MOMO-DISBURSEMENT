
//
const express = require('express')
const admin_router = express.Router()

const {Login} = require('../controllers/adminController.js')

//Middlewares
//onst admin_Protect = require('../middlewares/authMiddleware.js')


//
admin_router
.get('/login', Login)




//Export to server 
module.exports = admin_router