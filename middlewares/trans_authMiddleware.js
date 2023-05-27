
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')

//Localstorage
const LocalStorage = require('node-localstorage').LocalStorage 
const localStorage = new LocalStorage('./scratch') 


//await bcrypt.compare(password, user.password)
const Trans_auth = (req, res, next)=>{

    //Get trans_token_id from a particular user  
    const trans_token_id = req.cookies.trans_token_id

    let trans_token

    if(localStorage.getItem(`trans_token_${trans_token_id}`) != null)
        trans_token = localStorage.getItem(`trans_token_${trans_token_id}`)
    
    //Token does not exist 
    if (!trans_token) 
    {
        res.status(401).redirect('/')

        //Unauthorized User to error 
        //if(req.originalUrl == '/error')
            //res.status(401).redirect('/')
    }

    //Verify JWT token and SERVER LOCAL STORAGE TOKEN 
    jwt.verify(trans_token, process.env.SECRET_KEY, function(err, decoded_token) 
    {
        //Token no longer valid 
        if(decoded_token == undefined)
        {
            //Redirect to error 
            if(req.originalUrl != '/error')
                res.status(401).redirect(`/error/1`) //Internal server error 
            
            //POINT TO HOME (takes care of cancilling transaction)
            res.status(401).redirect('/') 

        }else
        {
            if (!err) {
            
                //Set req property accessible on protected routes 
                req.transaction_details = decoded_token //Encapsulating transaction deatails
            }
            //Valid token returning some error
            else{
                err = {
                    name: 'Token expired',
                    message: 'JWT expired'
                }
            }

        }
        
    })//End JWT verification
    //
    //res.status(200)
    //
    next()
}


//EXPORT TO ROUTES 
module.exports = Trans_auth