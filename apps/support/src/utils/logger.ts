import process from 'node:process';
import winston from 'winston';

const { combine, timestamp, printf, colorize, align, errors, json } = winston.format;

const logger = winston.createLogger({
    level: process.env.LOG_LEVEL ?? 'info',
    defaultMeta: {
        service: 'support',
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
        new winston.transports.File({
            filename: './logs/logs.log',
            format: combine(timestamp(), json()),
        }),
    ],
    exitOnError: false,
});

export default logger;
