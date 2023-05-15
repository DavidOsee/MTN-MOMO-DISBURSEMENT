//
const mongoose = require('mongoose')

//Create Survey schema 
const admin_userSchema =  mongoose.Schema({
    firstname : {
        type : String,
        required : true
    },
    lastname : {
        type : String,
        required : true 
    },
    email : {
        type : String,
        required : true, 
        unique : true
    }, 
    password : { 
        type : String,
        required : true 
    },
    role : { 
        type : String,
        required : true, 
        default : 'Admin'
    }
},{
    timestamps : true
}) 

//EXPORT TO ADMINCONTROLLER 
module.exports = mongoose.model('Admin_user', admin_userSchema)