'use strict';

const expect = require('chai').expect;

const utils = require('../lib/utils');

describe('utils', function () {
  describe('pack', function () {
    it('pack number correctly', function () {
      const a1 = utils.pack(1);
      expect(a1).to.equal('10:{"data":1}\r\n');
    });

    it('pack string correctly', function () {
      const a1 = utils.pack({ t: 1 });
      expect(a1).to.equal('16:{"data":{"t":1}}\r\n');
    });
  });

  describe('unpack', function () {
    it('unpack single correctly', function () {
      const a1 = utils.unpack('16:{"data":{"t":1}}\r\n');
      expect(a1).to.deep.equal([{ t: 1 }]);
    });

    it('unpack multi correctly', function () {
      const a1 = utils.unpack('16:{"data":{"t":1}}\r\n10:{"data":1}\r\n');
      expect(a1).to.deep.equal([{ t: 1 }, 1]);
    });
  });

  describe('isValid', function () {
    it('should return invalid when length not matched', function () {
      const a1 = utils.isValid('15:{"data":{"t":1}}\r\n');
      expect(a1).to.equal(false);
    });

    it('should return invalid when tail is wrong', function () {
      const a1 = utils.isValid('15:{"data":{"t":1}}\r');
      expect(a1).to.equal(false);
    });

    it('should return invalid when regexp not matched', function () {
      const a1 = utils.isValid('123123\r\n');
      expect(a1).to.equal(false);
    });

    it('should return invalid when empty', function () {
      const a1 = utils.isValid();
      expect(a1).to.equal(false);
    });

    it('should return valid', function () {
      const a1 = utils.isValid('16:{"data":{"t":1}}\r\n10:{"data":1}\r\n');
      expect(a1).to.equal(true);
    });
  });
});