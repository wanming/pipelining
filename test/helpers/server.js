'use strict';

const Promise = require('bluebird');
const path = require('path');
const http = require('http');
const fs = require('fs');
const pipelining = require('../../');

const port = 9999;

// Create an HTTP server
var srv = http.createServer((req, res) => {
  if (req.url === '/') {
    res.writeHead(200, {
      'Transfer-Encoding': 'chunked', 'Content-Type': 'text/html'
    });

    let n = 0;

    const write = () => {
      let delay = n % 2 === 0 ? 0 : parseInt(Math.random() * 1000, 10);
      n += 1;

      if (n === 10) {
        res.end('33333', 500);
        return Promise.resolve(true);
      }

      if (n === 6) {
        delay = 3200;
      }

      res.write(pipelining.pack(n));
      return Promise.delay(delay).then(write);
    };

    write();
    return;
  }

  if (req.url === '/test') {
    const indexHtml = fs.readFileSync(path.join(process.cwd(), 'test/browser/index.html')).toString();
    res.end(indexHtml);
    return;
  }

  const filePath = path.join(process.cwd(), req.url);

  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath).toString();
    res.end(content);
    return;
  }

  res.end('', 404);
});

console.log('server listening port', port);
srv.listen(port);
