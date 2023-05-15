//
const mongoose = require('mongoose')
const transaction = require('./trans')

//Create Survey schema 
const surveySchema =  mongoose.Schema({
    name : {
        type : String, 
        required : true
    }, 
    number : {
        type : String, 
        required : true
     }
},{
    timestamps : true
}) 

//EXPORT TO KAPSCONTROLLER 
module.exports = mongoose.model('Survey_data', surveySchema)