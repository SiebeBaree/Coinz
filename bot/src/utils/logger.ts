import winston from 'winston';
import 'winston-daily-rotate-file';

const { combine, timestamp, printf, colorize, align, errors } = winston.format;

const fileRotateTransport = new winston.transports.DailyRotateFile({
    filename: 'coinz-%DATE%.log',
    datePattern: 'YYYY-MM-DD',
    maxFiles: '30d',
    maxSize: '20m',
    dirname: './logs',
});

const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: combine(
        colorize({ all: true }),
        timestamp({
            format: 'YYYY-MM-DD hh:mm:ss.SSS A',
        }),
        align(),
        printf((info) => `[${info.timestamp}] ${info.level}: ${info.message}`),
        errors({ stack: true }),
    ),
    defaultMeta: {
        service: 'bot',
    },
    transports: [new winston.transports.Console(), fileRotateTransport],
    exceptionHandlers: [new winston.transports.File({ filename: './logs/exception.log' })],
    rejectionHandlers: [new winston.transports.File({ filename: './logs/rejections.log' })],
});

export default logger;
