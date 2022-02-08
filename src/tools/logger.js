const moment = require("moment");

exports.log = (content, type = "log") => {
    // colors form: https://stackoverflow.com/a/40560590/13712977
    const colors = {
        reset: "\x1b[0m",
        bright: "\x1b[1m",
        dim: "\x1b[2m",
        underscore: "\x1b[4m",
        blink: "\x1b[5m",
        reverse: "\x1b[7m",
        hidden: "\x1b[8m",

        fg: {
            black: "\x1b[30m",
            red: "\x1b[31m",
            green: "\x1b[32m",
            yellow: "\x1b[33m",
            blue: "\x1b[34m",
            magenta: "\x1b[35m",
            cyan: "\x1b[36m",
            white: "\x1b[37m",
            crimson: "\x1b[38m" // Scarlet
        },
        bg: {
            black: "\x1b[40m",
            red: "\x1b[41m",
            green: "\x1b[42m",
            yellow: "\x1b[43m",
            blue: "\x1b[44m",
            magenta: "\x1b[45m",
            cyan: "\x1b[46m",
            white: "\x1b[47m",
            crimson: "\x1b[48m"
        }
    };

    const timestamp = `[${moment().format("DD-MM-YY H:m:s")}]`;

    switch (type) {
        case "log": {
            return console.log(`${timestamp} (${colors.fg.blue}${type.toUpperCase()}${colors.reset}) ${content}`);
        }
        case 'warn': {
            return console.log(`${timestamp} (${colors.fg.black}${colors.bg.yellow}${type.toUpperCase()}${colors.reset}) ${content}`);
        }
        case 'error': {
            return console.log(`${timestamp} (${colors.fg.white}${colors.bg.red}${type.toUpperCase()}${colors.reset}) ${content}`);
        }
        case 'cmd': {
            return console.log(`${timestamp} (${colors.fg.gray}${type.toUpperCase()}${colors.reset}) ${content}`);
        }
        case 'ready': {
            return console.log(`${timestamp} (${colors.fg.green}${type.toUpperCase()}${colors.reset}) ${content}`);
        }
        case 'load': {
            return console.log(`${timestamp} (${colors.fg.magenta}${type.toUpperCase()}${colors.reset}) ${content}`);
        }
        case 'event': {
            return console.log(`${timestamp} (${colors.fg.cyan}${type.toUpperCase()}${colors.reset}) ${content}`);
        }
        default: throw new TypeError('Wrong type of logger.');
    }
};

exports.error = (...args) => this.log(...args, 'error');

exports.warn = (...args) => this.log(...args, 'warn');

exports.cmd = (...args) => this.log(...args, 'cmd');

exports.ready = (...args) => this.log(...args, 'ready');

exports.load = (...args) => this.log(...args, 'load');

exports.event = (...args) => this.log(...args, 'event');