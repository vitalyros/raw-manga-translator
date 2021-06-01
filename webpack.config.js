const path = require('path');
const CopyPlugin = require("copy-webpack-plugin");

module.exports = {
  mode: 'development',
  entry: {
    background: './src/background.js',
    page: './src/page.js'
  },
  devtool: 'inline-source-map',
  watchOptions: {
    aggregateTimeout: 1000,
    ignored: /node_modules/,
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    clean: true,
    publicPath: ''
  },
  module: {
    rules: [
      {
        test: /\.jsx$/,
        exclude: /node_modules/,
        loader: 'babel-loader',
      }
    ],
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        { from: "./node_modules/tesseract.js/dist/worker.min.js", to: "tesseract" },
        { from: "./node_modules/tesseract.js-core/tesseract-core.wasm.js", to: "tesseract-core" },
      ],
    }),
  ]
};
