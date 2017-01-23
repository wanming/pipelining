'use strict';

const assign = require('lodash.assign');
const utils = require('./lib/utils');
const pipelining = require('./lib/xhr');

assign(pipelining, utils);

module.exports = pipelining;
