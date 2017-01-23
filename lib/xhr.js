'use strict';

const assign = require('lodash.assign');
const Promise = require('es6-promise').Promise;
const utils = require('./utils');

function request(options) {
  const xhr = new XMLHttpRequest();
  const receivedPartials = [];

  let receivedLength = 0;
  let readCount = 0;
  let waitingPromise;
  let done = false;

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
      const text = xhr.responseText;
      const partial = text.slice(receivedLength);
      if (partial.length === 0) {
        if (waitingPromise && readCount === receivedPartials.length) {
          waitingPromise.resolve({ done });
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
  xhr.send();

  const reader = {
    read() {
      return new Promise((resolve, reject) => {
        // waiting promises
        if (receivedPartials.length === readCount) {
          if (done) {
            resolve({ done });
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
    }
  };

  return reader;
}

function getRequest(method) {
  return function (url, options) {
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
