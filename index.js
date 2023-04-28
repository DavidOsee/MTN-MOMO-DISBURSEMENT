//
const express = require('express')
require('dotenv').config()
const port = process.env.PORT || 6500

const server = require('./server')


//Listen 
server.listen(port, ()=>{
	console.log(`Server started on port ${port}`)
})

