'use strict';

const assign = require('lodash.assign');
const utils = require('./lib/utils');
const pipelining = require('./lib/');

assign(pipelining, utils);

module.exports = pipelining;
