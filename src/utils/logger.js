const fs = require('fs');
const path = require('path');

const logDir = path.join(__dirname, '../../logs');

if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const getLogFile = (type = 'app') => {
  return path.join(logDir, `${type}-${new Date().toISOString().split('T')[0]}.log`);
};

const log = (message, type = 'info', category = 'app') => {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${type.toUpperCase()}] ${message}\n`;
  const logFile = getLogFile(category);

  fs.appendFileSync(logFile, logMessage);

  if (type === 'error') {
    console.error(logMessage);
  } else if (type === 'warn') {
    console.warn(logMessage);
  } else {
    console.log(logMessage);
  }
};

const info = (message, category = 'app') => log(message, 'info', category);
const warn = (message, category = 'app') => log(message, 'warn', category);
const error = (message, category = 'app') => log(message, 'error', category);

module.exports = {
  log,
  info,
  warn,
  error,
};