import winston from "winston";
import DailyRotateFile from "winston-daily-rotate-file";
import moment from "moment";

export default class Logger {
    private _logger: winston.Logger;

    constructor() {
        const transport: DailyRotateFile = new DailyRotateFile({
            filename: "coinz-%DATE%.log",
            datePattern: "YYYY-MM-DD",
            zippedArchive: true,
            maxSize: "20m",
            maxFiles: "30d",
            dirname: "./src/logs",
        });

        this._logger = winston.createLogger({
            level: "info",
            format: winston.format.json(),
            transports: [
                transport,
            ],
        });

        if (process.env.NODE_ENV !== "production") {
            this._logger.add(new winston.transports.Console({
                format: winston.format.combine(
                    winston.format.timestamp(),
                    this.formatConsole,
                ),
            }));
        }
    }

    private formatConsole = winston.format.printf(({ level, message, timestamp }) => {
        return `[${moment(timestamp).format("YYYY-MM-DD HH:mm:ss")}] (${level.toUpperCase()}): ${message}`;
    });

    public get logger(): winston.Logger {
        return this._logger;
    }
}