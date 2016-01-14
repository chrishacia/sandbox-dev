var fs = require('fs');
var os = require('os');
var path = require('path');

var webpack = require('webpack');
var BrowserSyncPlugin = require('browser-sync-webpack-plugin');

var files = fs.readdirSync('./src/scripts/').filter(function (file) {
  return path.extname(file) === '.js';
});

var entries = files.reduce(function (obj, file, index) {
  var key = path.basename(file, '.js');
  obj[key] = [
    './src/scripts/' + key
  ];
  return obj;
}, {});

// console.log(entries);

// chunkName: 'vendor'
entries.vendor = ['jquery', 'backbone-react-component', 'bootstrap-sass', 'backbone', 'underscore', 'moment', 'react', 'react-dom'];


module.exports = {
  devtool: 'eval',
  externals: {
      raven: 'Raven',
      mixpanel: true
  },
  entry: entries,
  output: {
    filename: 'dist/scripts/[name].js'
  },
  plugins: [
    // new webpack.optimize.CommonsChunkPlugin('dist/scripts/init.js'),
    new webpack.optimize.CommonsChunkPlugin(/* chunkName= */"vendor", /* filename= */"dist/scripts/vendor.js"),
    new webpack.ProvidePlugin({
      $: "jquery",
      jQuery: "jquery"
    }),
    new BrowserSyncPlugin({
      proxy: {
        target: 'https://' + os.hostname(), // hostname example: site.domain.com
      }
    })
  ],
  module: {
    loaders: [
      {
        test: /\.jsx?$/,
        loader: 'babel',
        include: path.join(__dirname, 'src')
      }
    ]
  }
};

