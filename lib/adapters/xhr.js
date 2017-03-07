'use strict';

function request(options) {
  const xhr = new XMLHttpRequest();

  let status;
  let receivedLength = 0;

  xhr.withCredentials = options.withCredentials;
  xhr.open(options.method, options.url);
  xhr.onreadystatechange = function () {
    if (xhr.readyState === 3) {
      const text = xhr.responseText;
      const partial = text.slice(receivedLength);
      receivedLength = text.length;
      options.onData(partial);
    }

    if (xhr.readyState === 4) {
      status = xhr.status || 0;

      const text = xhr.responseText;
      const partial = text.slice(receivedLength);
      if (partial.length > 0) {
        options.onData(partial);
      }

      options.onEnd({ status });
    }
  };

  xhr.send(options.data);
  return xhr;
}

module.exports = request;
