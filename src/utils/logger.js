//logger.js

const timestamp = () => new Date().toDateString();

//function to log info messages
export function logInfo(...args) {
  console.log(`${timestamp()} [INFO]`, ...args);
}

//function to log error messages
export function logError(...args) {
  console.log(`${timestamp()} [ERROR]`, ...args);
}

export function logDebug(...args) {
  console.log(`${timestamp()} [DEBUG]`, ...args);
}
