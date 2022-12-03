import { Console } from 'console';
import { inspect, types } from 'util';
import chalk from 'chalk';
import moment from 'moment';
const inspectOptions = {
    showHidden: true,
    compact: false,
    depth: null,
    colors: true
};

export default class Logger extends Console {
    PAINTS = {
        log: chalk.blue,
        error: chalk.bgRed.bold,
        warn: chalk.yellow,
        event: chalk.cyan,
        ready: chalk.green,
        load: chalk.magenta
    };

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
        super[consoleType](`[${this.timestamp}] (` + this.PAINTS[type](`${type.toUpperCase()}`) + chalk.reset(`) ${data}`));
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