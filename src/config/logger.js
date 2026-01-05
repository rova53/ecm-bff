const { createLogger, format, transports } = require('winston');
const config = require('./index');

const logFormat = format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    format.errors({ stack: true }),
    format.splat(),
    format.json()
);

const logger = createLogger({
    level: config.logging.level,
    format: logFormat,
    defaultMeta: { service: 'ecom2micro-bff' },
    transports: [
        // Write all logs with importance level of `error` or less to `error.log`
        new transports.File({ filename: 'logs/error.log', level: 'error' }),
        // Write all logs with importance level of `info` or less to `combined.log`
        new transports.File({ filename: 'logs/combined.log' }),
    ],
});

// If we're not in production, log to the console with a simple format
if (config.nodeEnv !== 'production')
{
    logger.add(
        new transports.Console({
            format: format.combine(
                format.colorize(),
                format.simple(),
                format.printf(({ level, message, timestamp, ...meta }) =>
                {
                    return `${timestamp} [${level}]: ${message} ${Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ''
                        }`;
                })
            ),
        })
    );
}

module.exports = logger;
