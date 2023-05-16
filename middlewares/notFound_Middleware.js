

const notFound = (req, res)=>{

    //Catch 404 routes and render 404 hbs template 
    res.status(404).render('404')
}


//EXPORT TO SERVER 
module.exports = notFound 