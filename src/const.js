module.exports = {

    //Client States
    STATE_NO_AUTH: "STATUS_NO_AUTH", //Client has not been authenticated
    STATE_PENDING: "STATUS_PENDING", //Client is authenticated but not in a game
    STATE_KILLED: "STATUS_KILLED", //Client has been kicked, no messages will be handled

    //Server Messages (to be sent to client)
    SCOMMAND_REQUEST_KEY: "REQUEST_KEY",  //Request a key from client, to be answered with AUTH [key]
    ERR_AUTH_INVALID: "ERR_AUTH_INVALID", //Notify client that auth was invalid before kicking
    ERR_AUTH_REUSED: "ERR_KEY_REUSED", //Notify client that key was reused before kicking
    AUTH_OKAY: "AUTH_VALID", //Notify client that auth was accepted
    ERR_RATELIMIT: "ERR_RATE_LIMIT", //Notify client that its sending too many requests
    ERR_LENGTHLIMIT: "ERR_LENGTH_LIMIT", //Notify client that its sending too long requests

    //Client commands (received from client)
    CCOMMAND_AUTH: "AUTH", //Client is attempting to authenticate, AUTH [key]

};
