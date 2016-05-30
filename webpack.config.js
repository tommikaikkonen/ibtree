var webpack = require('webpack');
var path = require('path');

module.exports = {
    entry: './src/index.js',
    output: {
        libraryTarget: 'var',
        library: 'ibtree',
        path: './dist',
        filename: 'ibtree.js',
    },
    module: {
        loaders: [{
            test: /\.js$/,
            exclude: /node_modules/,
            loader: 'babel-loader',
        }],
    },
};
