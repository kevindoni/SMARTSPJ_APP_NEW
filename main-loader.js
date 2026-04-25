'use strict';

const { app } = require('electron');
const fs = require('fs');
const logFile = require('path').join(require('os').homedir(), 'smartspj-debug.log');
function log(msg) { fs.appendFileSync(logFile, new Date().toISOString() + ' ' + msg + '\n'); }

log('main-loader starting. isPackaged=' + app.isPackaged);
try {
  require('./main.js');
  log('main.js loaded OK');
} catch (e) {
  log('ERROR: ' + e.message + '\n' + e.stack);
}
