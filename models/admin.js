//
const mongoose = require('mongoose')

//Create Survey schema 
const adminSchema =  mongoose.Schema({
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
        enum : ['Main', 'Viewer']
    }
},{
    timestamps : true
}) 

//EXPORT TO ADMINCONTROLLER 
module.exports = mongoose.model('Admin_user', adminSchema)