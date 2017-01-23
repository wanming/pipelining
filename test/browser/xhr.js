'use strict';

const pipelining = require('../../');
const reader = pipelining('/');
const Promise = require('bluebird');

function read() {
  reader.read().then(partial => {
    if (partial.done) {
      console.log('done!');
      return;
    }

    console.log(partial.data);
    Promise.delay(500).then(() => read());
  }).catch(console.log);
}
read();

// const pipelining = window.pipelining;

// describe("XHR Tests", function () {
//   this.timeout(11000);
//   it('Get partial correctly', function (done) {
//     let i = 0;
//     pipelining.get('/', function (partial) {
//       expect(Number(partial)).to.equal(i++);
//       if (i > 19) {
//         done();
//       }
//     });
//   });
// });

// // console.log('aaa');
// // document.addEventListener('DOMContentLoaded', function (e) {
// //     var url = '/';

// //     var progress = 0;
// //     var contentLength = 0;

// //     fetch(url).then(function(response) {
// //         // get the size of the request via the headers of the response
// //         // contentLength = response.headers.get('Content-Length');

// //         var pump = function(reader) {
// //             return reader.read().then(function(result) {
// //                 // if we're done reading the stream, return
// //                 if (result.done) {
// //                     return;
// //                 }

// //                 // retrieve the multi-byte chunk of data
// //                 var chunk = result.value;
// //                 var text = '';
// //                 // since the chunk can be multiple bytes, iterate through
// //                 // each byte while skipping the byte order mark
// //                 // (assuming UTF-8 with single-byte chars)
// //                 for (var i = 0; i < chunk.length; i++) {
// //                     text += String.fromCharCode(chunk[i]);
// //                 }

// //                 console.log(text);
// //                 // append the contents to the page
// //                 // document.getElementById('content').innerHTML += text;

// //                 // report our current progress
// //                 // progress += chunk.byteLength;
// //                 // console.log(((progress / contentLength) * 100) + '%');

// //                 // go to next chunk via recursion
// //                 return pump(reader);
// //             });
// //         }

// //         // start reading the response stream
// //         return pump(response.body.getReader());
// //     })
// //     .catch(function(error) {
// //         console.log(error);
// //     });
// // });