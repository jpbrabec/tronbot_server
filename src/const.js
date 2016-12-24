module.exports = {

    //Client States
    STATE_NO_AUTH: "STATUS_NO_AUTH", //Client has not been authenticated
    STATE_PENDING: "STATUS_PENDING", //Client is authenticated but not in a game

    //Server Messages (to be sent to client)
    SCOMMAND_REQUEST_KEY: "REQUEST_KEY",  //Request a key from client, to be answered with AUTH [key]
    ERR_AUTH_INVALID: "ERROR AUTH_INVALID", //Notify client that auth was invalid before kicking
    ERR_AUTH_REUSED: "ERROR KEY_REUSED", //Notify client that key was reused before kicking
    AUTH_OKAY: "AUTH_VALID", //Notify client that auth was accepted

    //Client commands (received from client)
    CCOMMAND_AUTH: "AUTH", //Client is attempting to authenticate, AUTH [key]

};
