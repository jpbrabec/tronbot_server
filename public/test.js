var webSocket = null;

$(function(){
  console.log('hey');
  var GAME_SERVER = "ws://localhost:8081";
  webSocket = new WebSocket(GAME_SERVER,"tron-protocol");

  webSocket.onopen = function() {
  			console.log("I'm Connected");
	};
  webSocket.onmessage = function(event) {
    console.log("GOT: "+JSON.stringify(event.data));
    var words = event.data.substring(0,event.data.length-1).split(" ");
    switch(words[0]) {
      case "GAME_LIST":
        updateBoardList(words);
        break;
      case "GAME_UPDATE":
        updateBoardView(words);
        break;
      default:
        console.log("Unknown command: " + words[0]);
        break;
    }
  };
});

function updateBoardView(words) {
    $("#gameBoard").html("");
    var boardSize = parseInt(words[1]);
    var cellData = words[2].split(",");
    var out = "";
    for(var i=0; i < cellData.length; i++) {
      out += cellData[i];
      if(i % boardSize === boardSize-1) {
        out += "</br>";
      }
    }
    $("#gameBoard").html(out);

}

function updateBoardList(words) {
  console.log("Updating board list");
  $("#gameList").html("");

  var count = parseInt(words[1]);
  var out = "";
  for(var i=0; i<count; i++) {
    out += "<li onclick='trackGame(\"" + words[i+2] + "\")'>" +words[i+2] + "</li>";
  }
  $("#gameList").html(out);

}
function trackGame(gameName) {
  console.log("Tracking " + gameName);
  if(webSocket) {
    webSocket.send("SUBSCRIBE " + gameName + ";");
  }
}
