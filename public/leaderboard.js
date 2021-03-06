var rootURL = "http://tron.purduehackers.com";


$(function(){
  fetchData();
  setInterval(fetchData,2000);
});

function fetchData() {
  //Query database
  $.get( rootURL+"/admin/leaderboard", function(data) {
    renderTable(data);
  });
}

function renderTable(users) {
  var $table = $("#user-table");
  $table.html("");
  $table.append("<thead><tr><th>Team</th><th>Wins</th><th>Losses</th><th>Win Rate</th></tr></thead>");
  $table.append("<tbody>");

  for(var i=0; i < users.length; i++) {
    $table.append("<tr><td>" + users[i].name + "</td><td>" + users[i].wins + "</td><td>" + users[i].losses + "</td><td>" + users[i].rate.toFixed(2) + "</td></tr>");
  }
  $table.append("</tbody>");
}
