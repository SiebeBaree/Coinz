const { Console } = require('console');
const { inspect, types } = require('util');
const chalk = require('chalk');
const moment = require('moment');
const inspectOptions = {
    showHidden: true,
    compact: false,
    depth: null,
    colors: true
};

class Logger extends Console {
    static parse(data) {
        return data && types.isNativeError(data)
            ? data.message || data.stack || String(data)
            : Array.isArray(data)
                ? data.map(Logger.parse).join(', ')
                : data !== null && typeof data === 'object'
                    ? '\n' + inspect(data, inspectOptions)
                    : String(data);
    }

    constructor(client) {
        super(process.stdout, process.stderr);

        this.client = client;
        this.template = 'DD-MM-YY HH:mm:ss';
    }

    get timestamp() {
        return moment().format(this.template);
    }

    writeLog(data, type = 'log', consoleType) {
        if (consoleType === undefined) consoleType = type;
        data = Logger.parse(data);
        super[consoleType](`[${this.timestamp}] (` + Logger.PAINTS[type](`${type.toUpperCase()}`) + chalk.reset(`) ${data}`));
    }

    log(...data) {
        for (let message of data) {
            this.writeLog(message, 'log');
        }
    }

    error(...data) {
        for (let message of data) {
            this.writeLog(message, 'error');
        }
    }

    warn(...data) {
        for (let message of data) {
            this.writeLog(message, 'warn');
        }
    }

    event(...data) {
        for (let message of data) {
            this.writeLog(message, 'event', 'log');
        }
    }

    ready(...data) {
        for (let message of data) {
            this.writeLog(message, 'ready', 'log');
        }
    }

    load(...data) {
        for (let message of data) {
            this.writeLog(message, 'load', 'log');
        }
    }
}

Logger.PAINTS = {
    log: chalk.blue,
    error: chalk.bgRed.bold,
    warn: chalk.yellow,
    event: chalk.cyan,
    ready: chalk.green,
    load: chalk.magenta
};

module.exports = Logger;