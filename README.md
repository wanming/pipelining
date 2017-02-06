# pipelining
Xhr chunked stream client for the browser and NodeJS

### HOW TO USE

#### front-end
```javascript
const pipelining = require('pipelining');

const reader = pipelining('/test');

function read() {
  reader.read().then(partial => {
    if (partial.done) {
      return;
    }

    handle(partial.data).then(read);
  });
}

read();
```

#### back-end
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

### TODO:
1. node.js version
1. headers support
