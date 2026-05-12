'use strict';

const { app } = require('electron');

if (!app.isPackaged) {
  require('./main.js');
} else {
  require('bytenode');
  require('./main.jsc');
}