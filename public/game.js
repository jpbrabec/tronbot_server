var webSocket = null;
var trackedGameName = null;


$(function(){
  console.log('Starting Up');
  var GAME_SERVER = "ws://localhost:8081";
  webSocket = new WebSocket(GAME_SERVER,"tron-protocol");

  webSocket.onopen = function() {
  			console.log("I'm Connected");
	};
  webSocket.onmessage = function(event) {
    // console.log("GOT: "+JSON.stringify(event.data));
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
  console.log("Updating board list: "+words);
  $("#gameList").html("");

  var count = parseInt(words[1]);
  console.log("COUNT IS " + count);
  var out = "";
  var gameNames;
  var oldGameExists = false;
  if(count === 0) {
    out += "<li><a href='#'> No Games</a></li>";
    $("#gameList").html(out);
    stopTracking();
    return;
  } else {
    gameNames = words[2].split(",");
  }
  for(var i=0; i<count*2; i+=2) {
    let friendlyName = gameNames[i+1].split("_").join(" ");
    out += "<li onclick='trackGame(\"" + gameNames[i] + "\",\"" + friendlyName +"\")'><a href='#'>" + friendlyName + "</a></li>";
    //Does the old game still exist?
    if(trackedGameName === gameNames[i]) {
      console.log("Match between " + trackedGameName + " and " + gameNames[i]);
      oldGameExists = true;
    }
  }
  $("#gameList").html(out);

  //Were you tracking but the game ended?
  if(trackedGameName && !oldGameExists) {
    console.log("Stopped Tracking!");
    stopTracking();
  }
  //Track first item automatically if nothing else is set
  if(!trackedGameName && count >= 1) {
    let friendlyName = gameNames[1].split("_").join(" ");
    trackGame(gameNames[0],friendlyName);
  } else {
  }

}

function stopTracking() {
  trackedGameName = null;
  $(".gameName").text("-No Active Game-");
}

function trackGame(gameName,displayName) {
  console.log("Tracking " + gameName);
  trackedGameName = gameName;
  if(displayName) {
    $(".gameName").text(displayName);
  }
  if(webSocket) {
    webSocket.send("SUBSCRIBE " + gameName + ";");
  }
}
