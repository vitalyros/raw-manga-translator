const path = require('path');
const CopyPlugin = require("copy-webpack-plugin");

module.exports = {
  mode: 'production',
  entry: {
    background: './src/background.js',
    page: './src/page.js',
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
      },
    ],
  },
  resolve: {
    fallback: {
      fs: false,
      path: false,
      crypto: false
    }
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        { from: "./node_modules/tesseract.js/dist/worker.min.js", to: "ext/tesseract" },
        { from: "./node_modules/tesseract.js-core/tesseract-core.wasm.js", to: "ext/tesseract" },
      ],
    }),
  ]
};
