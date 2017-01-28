var rootURL = "http://localhost:8082";

$(function(){
  $form = $("#login-form");
  $form.on('submit',tryLogin);
});


function tryLogin(e) {
  e.preventDefault();
  var token = $("#token-input").val();
  var base = $.urlParam('base') || rootURL;
  var baseURL = decodeURIComponent(base);
  $.post( baseURL+"/admin", { token: token })
  .done(function( data ) {
    //Valid login
    Cookies.set('tronToken',token);
    window.location.href = "admin.html";
  }).catch(function(e){
    alert("Invalid Token");
  });
  return false;
}



//Pull a url param from the url
$.urlParam = function(name){
    var results = new RegExp('[\?&]' + name + '=([^&#]*)').exec(window.location.href);
    if (results==null){
       return null;
    }
    else{
       return results[1] || 0;
    }
}
