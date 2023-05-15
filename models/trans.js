//
const mongoose = require('mongoose')

//Create Survey schema 
const transSchema =  mongoose.Schema({
    user : {
        type : Object, 
        required : true
    },
    amount : {
        type : Number,
        required : true
    },
    trans_id : {
        type : String, 
        required : true,
        unique : true
    },
    status : {
        type : String, 
        enum : ['SUCCESSFUL', 'UNSUCCESSFUL', 'PENDING', 'FAILED', 'REJECTED', 'TIMEOUT', 'ONGOING']
    }
    
},{
    timestamps : true
}) 

//EXPORT TO KAPSCONTROLLER 
module.exports = mongoose.model('Trans', transSchema)