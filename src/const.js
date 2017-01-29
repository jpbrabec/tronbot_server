module.exports = {

    //Client States
    STATE_NO_AUTH: "STATUS_NO_AUTH", //Client has not been authenticated
    STATE_PENDING: "STATUS_PENDING", //Client is authenticated but not in a game
    STATE_KILLED: "STATUS_KILLED", //Client has been kicked, no messages will be handled
    STATE_REQMOVES: "STATUS_REQMOVES", //Client has been asked to submit moves, but has not answered
    STATE_SENTMOVES: "STATUS_SENTMOVES", //Client has sent moves to the server and is waiting

    //Server Messages (to be sent to client)
    SCOMMAND_REQUEST_KEY: "REQUEST_KEY",  //Request a key from client, to be answered with AUTH [key]
    SCOMMAND_REQUEST_MOVE: "REQUEST_MOVE", //Request a move from the client. Includes board state.
    ERR_AUTH_INVALID: "ERR_AUTH_INVALID", //Notify client that auth was invalid before kicking
    ERR_AUTH_REUSED: "ERR_KEY_REUSED", //Notify client that key was reused before kicking
    ERR_UNPROMPTED: "ERR_UNPROMPTED", //Notify client that they tried to make a move when they were not asked
    ERR_TIMEOUT: "ERR_TIMEOUT", //Notify client that they took too long to respond and were killed
    ERR_MOVE_INVALID: "ERR_MOVE_INVALID", //Notify client that they tried to make an invalid move
    AUTH_OKAY: "AUTH_VALID", //Notify client that auth was accepted
    GAME_START: "GAME_START", //Notify player that game has started
    ERR_RATELIMIT: "ERR_RATE_LIMIT", //Notify client that its sending too many requests
    ERR_LENGTHLIMIT: "ERR_LENGTH_LIMIT", //Notify client that its sending too long requests
    PLAYER_DIED: "PLAYER_DIED", //Notify client that their bike died
    PLAYER_WIN: "PLAYER_WIN", //Notify client that they won

    //Client commands (received from client)
    CCOMMAND_AUTH: "AUTH", //Client is attempting to authenticate, AUTH [key]
    CCOMMAND_MOVE: "MOVE", //Client is making a move, MOVE [0,1,2,3]
    MOVE_UP: "UP",
    MOVE_RIGHT: "RIGHT",
    MOVE_DOWN: "DOWN",
    MOVE_LEFT: "LEFT",

    //Viewer Commands
    SCOMMAND_GAMELIST: "GAME_LIST", //Notify client of the current active games
    VCOMMAND_SUBSCRIBE: "SUBSCRIBE", //Notify server that you want to receive updates about a game
    ERR_SUBSCRIBE_INVALID: "ERR_SUBSCRIBE_INVALID", //Notify client that they tried to subscribe an invalid game
    SCOMMAND_GAMEUPDATE: "GAME_UPDATE", //Notify client of the current gameboard state

};
