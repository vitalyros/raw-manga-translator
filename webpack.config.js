const path = require('path');

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
      // {
      //   test: /\.html$/i,
      //   loader: 'html-loader',
      // },
      // {
      //   test: /\.css$/,
      //   use: ["style-loader", "css-loader"],
      // },
      {
        test: /\.jsx$/,
        exclude: /node_modules/,
        loader: 'babel-loader',
      },
      // {
      //   test: /\.(woff(2)?|ttf|eot|svg)(\?v=\d+\.\d+\.\d+)?$/,
      //   use: [
      //     {
      //       loader: 'url-loader',
      //       options: {
      //         limit: 100000
      //       }
      //     }
      //   ]
      // }
    ],
  }
};
