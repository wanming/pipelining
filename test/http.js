'use strict';

const expect = require('chai').expect;
const pipelining = require('../');

function read(time, options) {
  let tmp = 0;
  const reader = pipelining('http://localhost:9999/', options);
  let promise = reader.read();

  while (tmp < time) {
    tmp += 1;
    if (tmp === time) {
      return promise;
    }

    promise = promise.then(() => {
      return reader.read();
    });
  }
}

describe('pipelining', function () {
  this.timeout(20000);

  it('Get 1st partial correctly', function (done) {
    read(1).then(result => {
      expect(result).to.eql({ data: 1 });
      done();
    });
  });

  it('Get 2nd partial correctly', function (done) {
    read(2).then(result => {
      expect(result).to.eql({ data: 2 });
      done();
    });
  });

  it('Get 5th partial correctly', function (done) {
    read(5).then(result => {
      expect(result).to.eql({ data: 5 });
      done();
    });
  });

  it('Get error when format error', function (done) {
    read(7).catch(e => {
      expect(e.message).to.eql('Format error');
      done();
    });
  });

  it('Done successfully', function (done) {
    const reader = pipelining('http://localhost:9999/test2');
    reader.read().then(() => {
      return reader.read();
    }).then(() => {
      return reader.read();
    }).then((doneResult) => {
      expect(doneResult.done).to.eql(true);
      done();
    });
  });

  it('Abort successfully', function (done) {
    const reader = pipelining('http://localhost:9999/test2');
    reader.abort();
    reader.read().catch(e => {
      expect(e.message).to.eql('Aborted');
      done();
    });
  });

  it('Throw timeout after 0.5s', function (done) {
    read(7, { timeout: 500 }).catch(e => {
      expect(e.message).to.eql('Timeout');
      done();
    });
  });
});
