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

$("#gameBoard").html(buildHtmlFromState(10,[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]));


function updateBoardView(words) {
    $("#gameBoard").html("");
    var boardSize = parseInt(words[1]);
    var cellData = words[2].split(",");
    $("#gameBoard").html(buildHtmlFromState(boardSize,cellData));

}

function buildHtmlFromState(boardSize,cellData) {
  var out = "";
  out += "<table><tr>";
  for(var i=0; i < cellData.length; i++) {
    //Determine correct class
    var className = getClassFromCellData(cellData[i]);
    out += "<td class='" + className +"'></td>";
    if(i % boardSize === boardSize-1) {
      out += "</tr>";
      if(i < cellData.length - 1) {
        out += "<tr>";
      }
    }
  }
  out += "</table>";
  return out;
}

function getClassFromCellData(cellData) {
  var className = "";
  switch(cellData) {
    case "1":
      className = "player-1";
      break;

    case "-1":
      className = "wall-1";
      break;

    case "2":
      className = "player-2";
      break;

    case "-2":
      className = "wall-2";
      break;
    default:
      className = "cell-empty";
      break;
  }
  return className;
}

function updateBoardList(words) {
  console.log("Updating board list "+words);
  $("#gameList").html("");

  var count = parseInt(words[1]);
  var out = "";
  var gameNames;
  if(count == 0) {
    out += "<li><a href='#'> No Games</a></li>";
    $("#gameList").html(out);
    return;
  } else {
    gameNames = words[2].split(",");
  }
  for(var i=0; i<count; i+=2) {
    var friendlyName = gameNames[i+1].split("_").join(" ");
    out += "<li onclick='trackGame(\"" + gameNames[i] + "\")'><a href='#'>" + friendlyName + "</a></li>";
  }
  $("#gameList").html(out);

}
function trackGame(gameName) {
  console.log("Tracking " + gameName);
  if(webSocket) {
    webSocket.send("SUBSCRIBE " + gameName + ";");
  }
}
