'use strict';

const keys = require('lodash.keys');
const urllib = require('url');
const assign = require('lodash.assign');
const clone = require('lodash.clone');
const Promise = require('es6-promise').Promise;
const utils = require('./utils');

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

  const xhr = new XMLHttpRequest();
  const receivedPartials = [];

  let receivedLength = 0;
  let readCount = 0;
  let waitingPromise;
  let done = false;
  let status = 0;
  let resolveDone = false;

  xhr.open(options.method, options.url);
  xhr.onreadystatechange = function () {
    if (xhr.readyState === 3) {
      const text = xhr.responseText;
      const partial = text.slice(receivedLength);

      if (!utils.isValid(partial)) {
        return;
      }

      receivedLength = text.length;

      const dataArray = utils.unpack(partial);

      if (dataArray.length > 0) {
        dataArray.forEach(item => receivedPartials.push(item));
        if (waitingPromise) {
          waitingPromise.resolve({ data: dataArray[0] });
          waitingPromise = null;
          readCount += 1;
        }
      }
    }

    if (xhr.readyState === 4) {
      done = true;

      status = xhr.status || 0;

      const text = xhr.responseText;
      const partial = text.slice(receivedLength);
      if (partial.length === 0) {
        if (waitingPromise && readCount === receivedPartials.length) {
          waitingPromise.resolve({ done, status });
          waitingPromise = null;
        }
      } else if (utils.isValid(partial)) {
        const dataArray = utils.unpack(partial);
        dataArray.forEach(item => receivedPartials.push(item));
        if (waitingPromise) {
          waitingPromise.resolve({ data: dataArray[0] });
          waitingPromise = null;
          readCount += 1;
        }
      } else {
        throw new Error('Tail format error');
      }
    }
  };
  xhr.send(data);

  const reader = {
    read() {
      return new Promise((resolve, reject) => {
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
      });
    },

    abort() {
      xhr.abort();
    },

    xhr
  };

  return reader;
}

function getRequest(method) {
  return function (url, _options) {
    const options = _options || {};
    if (options.data) {
      const parsedUrl = urllib.parse(url);

      if (options.method === 'get') {
        assign(parsedUrl.query, options.data);
      }
    }
    return request(assign({}, { url, method }, options));
  };
}

module.exports = module.exports.get = getRequest('get');
module.exports.request = request;

['post', 'patch', 'put'].forEach(method => {
  module.exports[method] = getRequest(method);
});

if (typeof window !== 'undefined') {
  window.pipelining = exports;
}
