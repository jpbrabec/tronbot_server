var rootURL = "http://localhost:8082";

$(function(){
  $form = $("#create-form");
  $form.on('submit',createTeam);

  checkAuth();
});

function checkAuth() {
  var token = Cookies.get('tronToken');
  if(!token) {
    //User needs to login
    requestLogin();
  } else {
    //Check the token against the server to see if it works
    $.post( rootURL+"/admin", { token: token})
    .done(function( data ) {
      //Auth is Valid
      fetchAccounts();
    }).catch(function(e){
      requestLogin();
    });
  }
}

function requestLogin() {
  window.location.href = "login.html?base="+encodeURIComponent(rootURL);
}

function fetchAccounts() {
  var token = Cookies.get('tronToken');
  //Query database
  $.get( rootURL+"/admin/users?token="+token, function(data) {
    renderTable(data);
  });
}

function renderTable(users) {
  var $table = $("#user-table");
  $table.html("");
  $table.append("<thead><tr><th>Team</th><th>Key</th></tr></thead>");
  $table.append("<tbody>");

  for(var i=0; i < users.length; i++) {
    $table.append("<tr><td>" + users[i].name + "</td><td><span class=\"private shaded\">" + users[i].key  +"</span></td></tr>");
  }
  $table.append("</tbody>");


  $(".private").mouseenter(function(){
    $(this).removeClass("shaded");
  })
  $(".private").mouseleave(function(){
    $(this).addClass("shaded");
  })
}



function createTeam(e) {
  e.preventDefault();
  var token = Cookies.get('tronToken');
  var $nameBox = $("#name-input");
  $.post( rootURL + "/admin/users", { token: token, name: $nameBox.val() })
  .done(function( data ) {
    $nameBox.val(""); //Clear team name
    fetchAccounts(); //Update list
  }).catch(function(e){
    alert("Invalid TeamName");
  })
  return false;
}
