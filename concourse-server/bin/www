#!/usr/bin/env node

/**
 * Module dependencies.
 */

import app from '../app.js'
import debugLib from 'debug'
import fs from 'fs'
import http from 'http'
import https from 'https'

import config from '../config/config.js'

const debug = debugLib('concourse-server:server')

/**
 * Get port from environment and store in Express.
 */

var port = normalizePort(process.env.PORT || config.port);
app.set('port', port);

var server = null

if(process.env.SSL_DISABLED || config.ssl.disabled){
  server = http.createServer(app)
}else{
  /**
   * Create HTTPS server.
   */
  var cert = fs.readFileSync(process.env.SSL_CERT || config.ssl.cert)
  var pkey = fs.readFileSync(process.env.SSL_PKEY || config.ssl.pkey)
  server = https.createServer({cert: cert, key: pkey}, app);
}

/**
 * Listen on provided port, on all network interfaces.
 */

server.listen(port);
server.on('error', onError);
server.on('listening', onListening);

/**
 * Normalize a port into a number, string, or false.
 */

function normalizePort(val) {
  var port = parseInt(val, 10);

  if (isNaN(port)) {
    // named pipe
    return val;
  }

  if (port >= 0) {
    // port number
    return port;
  }

  return false;
}

/**
 * Event listener for HTTP server "error" event.
 */

function onError(error) {
  if (error.syscall !== 'listen') {
    throw error;
  }

  var bind = typeof port === 'string'
    ? 'Pipe ' + port
    : 'Port ' + port;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(bind + ' is already in use');
      process.exit(1);
      break;
    default:
      throw error;
  }
}

/**
 * Event listener for HTTP server "listening" event.
 */

function onListening() {
  var addr = server.address();
  var bind = typeof addr === 'string'
    ? 'pipe ' + addr
    : 'port ' + addr.port;
  debug('Concourse backend server listening on ' + bind);
  console.log('Concourse backend server listening on ' + bind);
}
