import winston from 'winston'


const logLevel = process.env.NODE_ENV === 'test'
  ? 'error'
  : (process.env.LOG_LEVEL || 'info'
  )

const logger = winston.createLogger({
  level: logLevel,
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(
          (msg) => {
            if (msg.level.indexOf('info') >= 0) {
              // no log level label for info messages
              return `${msg.message}`
            }
            return `${msg.level}: ${msg.message}`
          },
        ),
      ),
      handleExceptions: true,
    }),
  ],
})

export function info(message) {
  logger.info(message)
}

export function debug(message) {
  logger.debug(message)
}

export function error(message, e = '') {
  logger.error(`${message}\n${e}`)
}

// call directly into the winston log method in case you need to do something complicated
export function log(...args) {
  logger.log(...args)
}
