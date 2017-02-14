'use strict';

const request = require('request');

function sendRequest(options) {
  return request[options.method.toLowerCase()](options.url)
    .on('response', response => {
      response.on('data', data => {
        options.onData(data.toString());
      });
      response.on('end', () => {
        process.nextTick(() => {
          options.onEnd({ status: response.statusCode });
        });
      });
    });
}

module.exports = sendRequest;
