const path = require('path');

module.exports = {
  mode: 'production',
  entry: {
    background: './src/background.js',
    page: './src/page.js'
  },
  output: {
    path: path.resolve(__dirname, 'dist')
  },
};
