$(document).ready(function() {

    //LOGIN 

    //--Email validation 
    const validateEmail = ($email)=> {
        var emailReg = /^([\w-\.]+@([\w-]+\.)+[\w-]{2,4})?$/;
        return emailReg.test( $email );
    }

    //Form validation  
    $('#loginForm').on('submit', (e)=>
    {
        e.preventDefault()

        //Convert input value toString()
        let email = $('[name=email]').val()
        let pwd = $('[name=password]').val()
        let remember = $('[name=remember]').val()

        //Get checkbox state 
        if ($('[name=remember]').is(":checked"))
            remember = true //Update remember value

        //$.toast().reset('all');
    
        //Empty FORM
        if(email == "" || pwd == "" || pwd.length > 15  || email.length > 30 ){
            $.toast({
                heading: 'Error',
                text: 'Please enter a valid Email or Password',
                position: 'top-right',
                icon: 'error',
                hideAfter: 4000,
                loader: true, 
                stack: false
            })
        }

        else
        {
            if(validateEmail(email) == false)
            {
                $.toast({
                    heading: 'Warning',
                    text: 'Please check your email',
                    position: 'top-right',
                    icon: 'warning',
                    hideAfter: 5000,
                    loader: true, 
                    stack: false
                })
                return false
            }

            //Send to the server for further troubleshooting 
            $.ajax({
                type: 'POST',
                url: 'admin/logmein',
                data: { 
                    form_email : email, pwd, remember
                },
                success: function(res)
                {
                    console.log(res)
                    //return false
                    if(res == 'notFound'){
                        $.toast({
                            heading: 'Access denied',
                            text: 'You are not allowed to be here',
                            position: 'top-right',
                            icon: 'warning',
                            hideAfter: 7000,
                            loader: true, 
                            stack: false
                        })
                    }
                    else if(res == 'wrong_pwd'){
                        $.toast({
                            heading: 'Error',
                            text: 'Incorrect email or password',
                            position: 'top-right',
                            icon: 'error',
                            hideAfter: 5000,
                            loader: true, 
                            stack: false
                        })
                    }
                    else
                    {
                        $.toast({
                            heading: 'Success',
                            text: 'Logging you in !',
                            position: 'top-right',
                            icon: 'success',
                            hideAfter: 2000,
                            loader: true, 
                            stack: false
                        })
                        //Allow form submission 
                        setTimeout(function(){
                            //
                            console.log(res)
                            window.location = 'admin/home'
                            
                       }, 1000);
                       
                    }
                        
                }, error: function(e){
                    console.log(e)
                }
            })//End Ajax
        }
        

    }) //End Login Form submission 







     //REGISTER  

    //Form validation  
    $('#registerForm').on('submit', (e)=>
    {
        e.preventDefault()

        //Convert input value toString()
        let lname = $('[name=lname]').val()
        let fname = $('[name=fname]').val()
        let email = $('[name=email]').val()
        let role = $('[name=role]').val()   
        let pwd = $('[name=password]').val()  
    
        //Empty FORM 
        if(fname == "" || lname == "" || email == "" || role == "" || role == null || pwd == "")
        {
            $.toast({
                heading: 'Error',
                text: 'Please fill all the inputs',
                position: 'top-right',
                icon: 'error',
                hideAfter: 4000,
                loader: true, 
                stack: false
            })
        }


        else
        {

            //Limit char number for Sec.
            if(fname.length > 15 || lname.length > 15 || role.length > 10 || pwd.length > 15  || email.length > 30 ){
                $.toast({
                    heading: 'Warning',
                    text: 'Information entered does not look legit',
                    position: 'top-right',
                    icon: 'warning',
                    hideAfter: 4000,
                    loader: true, 
                    stack: false
                })
            }

            else if(validateEmail(email) == false)
            {
                $.toast({
                    heading: 'Warning',
                    text: 'Email does not look legit',
                    position: 'top-right',
                    icon: 'warning',
                    hideAfter: 5000,
                    loader: true, 
                    stack: false
                })
                return false
            }

            else{

                //Send to the server for further troubleshooting 
                $.ajax({
                    type: 'POST',
                    url: '/admin/admin_register', 
                    data: { 
                        lname : lname, 
                        fname : fname, 
                        form_email : email, 
                        form_role : role, //To avoid conflict on the server side 
                        pwd : pwd 
                    },
                    success: function(res)
                    {
                        console.log(res)
                        if(res == 'found'){
                            $.toast({
                                heading: 'Warning',
                                text: 'Email already exists',
                                position: 'top-right',
                                icon: 'warning',
                                hideAfter: 5000,
                                loader: true, 
                                stack: false
                            })
                        }
                        else if(res == 'unauthorized'){
                            $.toast({
                                heading: 'Access denied',
                                text: 'You are not allowed to register a new User',
                                position: 'top-right',
                                icon: 'warning',
                                hideAfter: 5000,
                                loader: true, 
                                stack: false
                            })
                        }
                        else
                        {
                            $.toast({
                                heading: 'Success',
                                text: 'New Admin User created !',
                                position: 'top-right',
                                icon: 'success',
                                hideAfter: 7000,
                                loader: true, 
                                stack: false
                            })

                            //Reset form
                            //$('#registerForm').trigger('reset')
                        }
                            
                    }, error: function(e){
                        console.log(e)
                    }
                })//End Ajax
            }
            
        }//End ELSE information treatment 
        
    }) //End Login Form submission 




    //LOGOUT 
    $('#logout').on('click', (e)=>
    {
        //Send to the server for further troubleshooting 
        $.ajax({
            type: 'POST',
            url: '/admin/logout', 
            data: { 
                out : 1 //Useless
            },
            success: function(res)
            {
               if(res == 'loggedOut')
                window.location = "/admin"

            }, error: function(e){
                console.log(e)
            }
        })//End Ajax
    })
        


})//End Jquery 