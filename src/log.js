const log = require('simple-node-logger').createSimpleLogger('logs/debug.log');
require('dotenv').config();

console.log("Log level: " + process.env.LOGLEVEL);
switch(process.env.LOGLEVEL.toLowerCase()) {
    case "debug":
        log.setLevel('debug');
        break;

    case "info":
        log.setLevel('info');
        break;

    case "warn":
        log.setLevel('warn');
        break;

    case "error":
        log.setLevel('error');
        break;

    default:
        console.log("Unknown log level "+process.env.LOGLEVEL);
        log.setLevel('debug');
        break;
}

module.exports = log;
