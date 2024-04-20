import process from 'node:process';
import winston from 'winston';
import 'winston-daily-rotate-file';

const { combine, timestamp, printf, colorize, align, errors, json } = winston.format;

const fileFormat = combine(timestamp(), json());

const logger = winston.createLogger({
    level: process.env.LOG_LEVEL ?? 'info',
    defaultMeta: {
        service: 'bot',
    },
    transports: [
        new winston.transports.Console({
            format: combine(
                colorize(),
                timestamp(),
                align(),
                errors({ stack: true }),
                printf(({ level, message, timestamp, stack }) => {
                    return `${timestamp} ${level}: ${stack || message}`;
                }),
            ),
        }),
        new winston.transports.DailyRotateFile({
            filename: 'coinz-%DATE%.log',
            datePattern: 'YYYY-MM-DD',
            maxFiles: '30d',
            maxSize: '20m',
            dirname: './logs',
            format: fileFormat,
        }),
        new winston.transports.File({
            filename: './logs/exceptions.log',
            format: fileFormat,
            level: 'error',
        }),
    ],
    exitOnError: false,
});

export default logger;
