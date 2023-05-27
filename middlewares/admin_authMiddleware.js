
const jwt = require('jsonwebtoken')

//Localstorage
const LocalStorage = require('node-localstorage').LocalStorage 
const ls = new LocalStorage('./admin_storage') 

//NOTES FOR THE FUTURE 
//--Dear self, I am using a JWT system just to carry a payload of the admin data through out the app
//--Using a cookie storing the admin ID then fetching data from the DB, could have been enough in this case 



//
const Protect = (req, res, next)=>{

    //Grab token_id from a particular admin user
    const admin_id = req.cookies.admin_id

    let token

    if(ls.getItem(`token_${admin_id}`) != null)
        token = ls.getItem(`token_${admin_id}`) 
    
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
            if(req.originalUrl != '/admin') //Toavoid unnecessary error on admin
                res.status(401).redirect(`/admin`) //Login route

        }else
        {
            if (!err) {
            
                //Set req property accessible on protected routes 
                req.admin_details = decoded_token //Encapsulating transaction deatails
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
module.exports = Protect