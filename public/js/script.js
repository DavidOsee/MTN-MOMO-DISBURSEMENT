//Init JQUERY
$(document).ready(function() {

    //Data table 
    $('#transaction_table').DataTable();

    // Fetch all the forms we want to apply custom Bootstrap validation styles to
    const forms = document.querySelectorAll('.needs-validation');

    // Loop over them and prevent submission
    Array.prototype.slice.call(forms).forEach((form) => {
        form.addEventListener('submit', (event) => {
        if (!form.checkValidity()) {
            event.preventDefault();
            event.stopPropagation();
        }
        form.classList.add('was-validated');
        }, false);
    });
    

    //AJAX FUNCTION TO REUSE
    const Ajax = (url, data_obj)=>{
        $.ajax({
            type: 'POST',
            url: url,
            data: data_obj,
            success: function(res){
              console.log(res)
            }, error: function(e){
              console.log(e)
            }
        })
    }

    //Trigger that fetches and updates the DB with G-SHEET responses data
    const load = true

    //--On page Loading (For debugging)
    // window.onload = function() {
    //     Ajax('/save', {load : true})
    // }

    //--Clicking on Bonus Tab
    $('a#bonus_tab').on('click', ()=>{
        //Ajax
        Ajax('/save', {load : true})
    })


    //REDEEM POST REQUEST 
    $('#redeemForm').on('submit', (e)=>{
        e.preventDefault()

        //Get the form value 
        const $this = $(this)

        //Convert input value toString()
        let val = $('#redeemForm input').val()

        //Empty form
        if(val == "" || val.length > 100 || val.length < 3 || parseInt(val)!=val ) //9 digit max
            $('#redeem_alert').removeClass('d-none').text('Please enter a valid number') 

        else{

            //Send to the server for further troubleshooting 
            $.ajax({
                type: 'POST',
                url: '/getpaid',
                data: { user_number : val},
                success: function(res)
                {
                    if(res == 'found')
                        $('#redeem_alert').removeClass('d-none').text('You can not redeem a bonus twice.')
                    
                    else if(res == 'unknown')
                        $('#redeem_alert').removeClass('d-none').text('Please complete your Form submission first !') //You need to first fill the Form

                    else{
                        //Btn swap 
                        $('#submitBtn').addClass('d-none')
                        $('button#submitLoading').removeClass('d-none')
                        //Allow form submission 
                        window.location = '/process'
                    }
                        
                }, error: function(e){
                    console.log(e)
                }
            })
        }
        

    }) //End Redeem Form submission 



    //PROCESS 
    if(window.location.pathname == '/process')
    {
        if (window.history && window.history.pushState) {

            $(window).on('popstate', function() {
              var hashLocation = location.hash;
              var hashSplit = hashLocation.split("#!/");
              var hashName = hashSplit[1];
    
              if (hashName !== '') {
                var hash = window.location.hash;
                if (hash === '') {
                  alert('Back button was pressed.');
                    window.location='www.example.com';
                    return false;
                }
              }
            });
    
            window.history.pushState('forward', null, './#forward');
          }

        //Count down timer
        $('#timer').text(02 + ":" + 00)

        const startTimer = ()=> 
        {
            var presentTime = $('#timer').text()
            var timeArray = presentTime.split(/[:]+/);
            var m = timeArray[0];
            var s = checkSecond((timeArray[1] - 1));
            if(s==59){m=m-1}
            if(m<0){
                return
            }
            
            $('#timer').text(  m + ":" + s)  
              
            ////Redirect to error when timer is over 
            if($('#timer').text() == '0:00')
                window.location = '/error/1'

            setTimeout(startTimer, 1000)
        }

        const checkSecond = (sec)=> {
            if (sec < 10 && sec >= 0) {sec = "0" + sec}; // add zero in front of numbers < 10
            if (sec < 0) {sec = "59"};
            return sec;
        }
        startTimer()
    }//End Process


    //HOME 
    if(window.location.pathname == '/')
    {
        //Refresh when back from the /process to help the Home controller script
        window.addEventListener( "pageshow", function ( event ) {
            var historyTraversal = event.persisted || ( typeof window.performance != "undefined" && window.performance.navigation.type === 2 );
            if ( historyTraversal ) {
              // Handle page restore.
              //alert('refresh');
              window.location.reload(true);
            }
        });
    }
})


