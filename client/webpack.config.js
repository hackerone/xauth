var webpack = require('webpack');
var path = require('path');


const config = {
    entry: {
        index: './src/index.js'
    },
    output: {
        path: path.join(__dirname, 'dist'),
        filename: '[name].js'
    },
    module: {
        loaders: [
            {
                test: /\.js$/,
                exclude: /(node_modules|bower_components)/,
                loader: 'babel-loader'
            }
        ]
    },
    plugins: []
};

config.plugins.push(
    new webpack.optimize.UglifyJsPlugin({
        compress: {
            screw_ie8: true
        }
    })
);

module.exports = config;