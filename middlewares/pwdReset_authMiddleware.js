
const jwt = require('jsonwebtoken')

//Localstorage
const LocalStorage = require('node-localstorage').LocalStorage 
const ls = new LocalStorage('./admin_storage') 

//NOTES FOR THE FUTURE 
//--Dear self, I am using a JWT system to carry a payload of the admin data through out the system and for security as well 
//--Using a cookie to store a random uuid value that will help the server IDENTIFY EACH USER 



//
const PwdResetProtect = (req, res, next)=>{

    //Grab token_id from a particular admin user
    const reset_id = req.cookies.reset_id

    let token

    if(ls.getItem(`resetToken_${reset_id}`) != null)
        token = ls.getItem(`resetToken_${reset_id}`) 
    
    //Token does not exist >> Admin currently logged out 
    if (!token) 
        res.status(401).redirect('/admin') //Login route 
    

    //Verify JWT token and SERVER LOCAL STORAGE TOKEN 
    jwt.verify(token, process.env.SECRET_KEY, function(err, decoded_token) 
    {
        //Token no longer valid 
        if(decoded_token == undefined)
        {
            //Redirect to error 
            if(req.originalUrl != '/admin') //To avoid unnecessary error on admin
                res.status(401).redirect(`/admin`) //Login route

        }else
        {
            if (!err) {
            
                //Set req property accessible on protected routes 
                req.reset_token = decoded_token //Encapsulating transaction deatails
            }
            //Valid token returning some error for some reason 
            else{
                err = {
                    name: 'Token expired',
                    message: 'JWT expired'
                }
            }

        }
        
    })//End JWT verification
    //
    next()
}


//EXPORT TO ROUTES 
module.exports = PwdResetProtect