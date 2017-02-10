'use strict';

const keys = require('lodash.keys');
const urllib = require('url');
const assign = require('lodash.assign');
const clone = require('lodash.clone');
const Promise = require('bluebird');
const utils = require('./utils');
const _request = require('./adapters/http');

function request(_options) {
  const options = clone(_options);
  options.method = options.method.toUpperCase();
  let data;

  if (options.data) {
    const parsedUrl = urllib.parse(options.url);
    if (options.method === 'GET') {
      parsedUrl.query = parsedUrl.query || {};
      assign(parsedUrl.query, options.data);
      options.url = urllib.format(parsedUrl);
    } else {
      data = new FormData();
      keys(options.data).forEach(key => {
        data.append(key, options.data[key]);
      });
    }
  }

  const receivedPartials = [];

  let readCount = 0;
  let waitingPromise;
  let done = false;
  let status = 0;
  let resolveDone = false;
  let error;

  const onData = function (partial) {
    if (!utils.isValid(partial)) {
      if (waitingPromise) {
        waitingPromise.reject(new Error('timeout'));
        waitingPromise = null;
      } else {
        error = new Error('timeout');
      }
      return;
    }

    const dataArray = utils.unpack(partial);

    if (dataArray.length > 0) {
      dataArray.forEach(item => receivedPartials.push(item));
      if (waitingPromise) {
        waitingPromise.resolve({ data: dataArray[0] });
        waitingPromise = null;
        readCount += 1;
      }
    }
  };

  const onEnd = function (result) {
    done = true;

    status = result.status || 0;

    if (waitingPromise && readCount === receivedPartials.length) {
      waitingPromise.resolve({ done, status });
      waitingPromise = null;
    }
  };

  _request(assign({}, options, { onData, onEnd }));

  const reader = {
    read() {
      return new Promise((resolve, reject) => {
        if (error) {
          reject(error);
          return;
        }

        // waiting promises
        if (receivedPartials.length === readCount) {
          if (done) {
            if (resolveDone) {
              reject(new Error('Already resolve done'));
            }
            resolveDone = true;
            resolve({ done, status });
            return;
          }

          if (waitingPromise) {
            reject(new Error('Duplicated waiting'));
            return;
          }

          waitingPromise = { resolve, reject };
          return;
        }

        if (receivedPartials.length > readCount) {
          waitingPromise = null;
          resolve({ data: receivedPartials[readCount] });
          readCount += 1;
          return;
        }

        reject(new Error('Unexpected error'));
      }).timeout(options.timeout, new Error('timeout'));
    }
  };

  return reader;
}

function getRequestFunction(method) {
  return function (url, _options) {
    const options = _options || {};
    return request(assign({}, { url, method, timeout: 60000 }, options));
  };
}

module.exports = module.exports.get = getRequestFunction('get');
module.exports.request = request;

['post', 'patch', 'put'].forEach(method => {
  module.exports[method] = getRequestFunction(method);
});

if (typeof window !== 'undefined') {
  window.pipelining = exports;
}
