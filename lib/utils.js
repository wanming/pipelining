'use strict';

const regexp = /^(\d+):(.*)$/;

function pack(target) {
  let str = JSON.stringify({ data: target });
  str = str.replace(/\r/g, '\\r').replace(/\n/g, '\\n');
  return str.length + ':' + str + '\r\n';
}

// Return list
function unpack(str) {
  const str2 = str.slice(0, -2);
  const splitted = str2.split('\r\n');

  return splitted.map(item => {
    const matches = item.match(regexp);
    if (!matches) {
      throw new Error('pipelining format error:' + item);
    }
    const s = matches[2].replace(/\\r/g, '\r').replace(/\\n/g, '\n');
    return JSON.parse(s).data;
  });
}

function isValid(str) {
  if (!str) {
    return false;
  }

  if (str.slice(-2) !== '\r\n') {
    return false;
  }

  const str2 = str.slice(0, -2);
  const splitted = str2.split('\r\n');
  for (let i = 0; i < splitted.length; i += 1) {
    const matches = splitted[i].match(regexp);
    if (!matches) {
      return false;
    }
    if (Number(matches[1]) !== matches[2].length) {
      return false;
    }
  }

  return true;
}

module.exports.pack = pack;
module.exports.unpack = unpack;
module.exports.isValid = isValid;
