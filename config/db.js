//
const mongoose = require('mongoose')


//
const connection = async()=>{
    try {

        const con = await mongoose.connect(process.env.MONGO_URI)
        console.log(con.connection.host)

    }catch (error) {
        console.log(error.message)
    }
}

//EXPORT TO SERVER
module.exports = connection