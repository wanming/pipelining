'use strict';

const pipelining = require('../../');

function read(time) {
  let tmp = 0;
  const reader = pipelining('/', { timeout: 2000 });
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
  this.timeout(30000);

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
    read(7).then(console.log).catch(e => {
      console.log(e.stack);
      expect(e.message).to.eql('timeout');
      done();
    });
  });
});
