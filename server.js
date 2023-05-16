//
const express = require('express')
const cookieParser = require('cookie-parser')
require('dotenv').config()
const app = express()

//DB CONNECTION 
const db_connection = require('./config/db.js')
db_connection()

//Parsers 
app.use(express.json())
app.use(express.urlencoded({extended:false}))
app.use(cookieParser())


//Script and Css files for the static view 
app.use(express.static('public'))


//View engine 
const {engine} = require('express-handlebars')
app.engine('.hbs', engine({extname : '.hbs'}));
app.set('view engine', '.hbs');
app.set('views', './views');


//Disable browser caching 
app.use((req,res,next)=>{
    res.set('Cache-Control', 'no-store')
    next()
})


//Route IMPORTS 
const kapsRoutes = require('./routes/kapsRoutes')
const adminRoutes = require('./routes/adminRoutes')
const notFound = require('./middlewares/notFound_Middleware')

//Route inits
app.use('/', kapsRoutes)
app.use('/admin', adminRoutes)

//404
app.use(notFound)


//Middleware imports 
const errorHandler = require('./middlewares/errorHandler')


//Middleware init 
app.use(errorHandler)



//Export to index
module.exports = app; 