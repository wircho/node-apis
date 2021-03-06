var path = require('path');
var webpack = require('webpack');
 
module.exports = {
  entry: {
    main:'./src/main.js',
    "twitter/main":'./src/twitter.js',
    "tagging/main":'./src/tagging.js',
  },
  output: { path: './public', filename: '[name].entry.js' },
  module: {
    loaders: [
      {
        include: /\.json$/,
        loaders: ["json-loader"]
      },
      {
        test: /.js?$/,
        loader: 'babel-loader',
        exclude: /node_modules/
      }
    ]
  },
  resolve: {
    extensions: ['', '.js', '.json'] 
  }
};