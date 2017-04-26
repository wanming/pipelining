# pipelining
Xhr chunked stream client for the browser and node.js

## Install

```shell
$ npm install pipelining
```

## Usage

Client (browser or node.js)

```javascript
const pipelining = require('pipelining');

const reader = pipelining('/test');

function handle(data) {
  console.log(data);
}

function read() {
  reader.read().then(partial => {
    if (partial.done) {
      return;
    }

    handle(partial.data).then(read);
  });
}

read()
```

Server

```javascript
const pipelining = require('pipelining');
// http handler
function (req, res) {
  res.write(pipelining.pack(1));
  // after several seconds..
  res.write(pipelining.pack({ tom: 'test' }));
  // after 1 min..
  res.end();
}
```
