const webpack = require('webpack');
const path = require('path');
module.exports = (w) => {
  return [
    {
      name: 'worker',
      target: 'webworker',
      plugins: [],
      mode: w.mode,
      entry: {
        'SharedWASQLiteDB.worker': path.join(__dirname, 'dist', 'worker', 'SharedWASQLiteDB.js')
      },
      externalsType: 'window',
      externals: w.externals,
      output: {
        path:  path.join(__dirname, 'dist', 'worker'),
        filename: '[name].js',
        publicPath: 'dist',
        globalObject: 'this' // required for the worker, otherwise HMR breaks it
      },
      resolve: {
        extensions: ['.js', '.ts'],
        modules: [path.join(__dirname, './node_modules'), path.join(__dirname, '../../node_modules')],
        alias: {},
      },
      optimization: w.optimization,
      module: {
        rules: []
      },
    }
  ];
};
