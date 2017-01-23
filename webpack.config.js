'use strict';

const path = require('path');
const buildPath = path.resolve(__dirname, './test/browser/');

const webpackConfig = {
  entry: './test/browser/xhr.js',
  output: {
    path: buildPath,
    filename: 'bundle.js'
  },

  module: {
    loaders: [{
      test: /./,
      loader: 'babel-loader',
      query: {
        presets: ['es2015']
      }
    }]
  }
};

module.exports = webpackConfig;
