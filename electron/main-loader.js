'use strict';

require('bytenode');

const { app } = require('electron');

if (!app.isPackaged) {
  require('./main.js');
} else {
  require('./main.jsc');
}