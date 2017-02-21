'use strict';

const keys = require('lodash.keys');
const urllib = require('url');
const assign = require('lodash.assign');
const clone = require('lodash.clone');
const Promise = require('bluebird');
const utils = require('./utils');
const _request = require('./adapters/http');
const debug = require('debug')('pipelining');

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
  let resolveDone = false;
  let error;
  let aborted = false;
  let doneResult;
  let startTime = Date.now();

  const onData = function (partial) {
    debug('get data:', partial);
    if (!utils.isValid(partial)) {
      debug('data format invalid');
      error = new Error('Format error');
      if (waitingPromise) {
        waitingPromise.reject(error);
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
    debug('request ended');
    done = true;
    doneResult = { done: true, status: (result || {}).status };

    if (waitingPromise && receivedPartials.length === readCount) {
      waitingPromise.resolve(doneResult);
    }
  };

  const requestResult = _request(assign({}, options, { onData, onEnd }));

  const reader = {
    abort() {
      debug('pipelining aborted');
      aborted = true;
      return requestResult.abort();
    },
    read() {
      const now = Date.now();
      return new Promise((resolve, reject) => {
        if (aborted) {
          reject(new Error('Aborted'));
          return;
        }

        if (error) {
          reject(error);
          return;
        }

        if (done) {
          if (resolveDone) {
            reject(new Error('Already resolved'));
            return;
          }

          if (receivedPartials.length === readCount) {
            resolve(doneResult);
            resolveDone = true;
            return;
          }
        }

        if (receivedPartials.length > readCount) {
          resolve({ data: receivedPartials[readCount] });
          readCount += 1;
          return;
        }

        waitingPromise = { resolve, reject };
      }).timeout(options.timeout - (now - startTime), new Error('Timeout'));
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
