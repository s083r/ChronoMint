let path = require('path')
let webpack = require('webpack')
const CopyWebpackPlugin = require('copy-webpack-plugin')
const ScriptExtHtmlWebpackPlugin = require('script-ext-html-webpack-plugin')

let config = require('./webpack.config.base.js')

let HtmlWebpackPlugin = require('html-webpack-plugin')
let ExtractTextPlugin = require('extract-text-webpack-plugin')

module.exports = config.buildConfig(
  ({ srcPath, modulesPath, buildPath, indexPresentationHtmlPath, faviconPath }) => ({
    entry: path.join(srcPath, 'index'),
    output: {
      path: buildPath,
      filename: '[name].js',
      chunkFilename: '[name].chunk.js',
    },
    babel: require('./babel.prod'),
    plugins: [
      new HtmlWebpackPlugin({
        inject: true,
        template: indexPresentationHtmlPath,
        favicon: faviconPath,
        minify: {
          removeComments: true,
          collapseWhitespace: false,
          removeRedundantAttributes: true,
          useShortDoctype: true,
          removeEmptyAttributes: true,
          removeStyleLinkTypeAttributes: true,
          keepClosingSlash: true,
          minifyJS: true,
          minifyCSS: true,
          minifyURLs: true,
        },
      }),
      new ScriptExtHtmlWebpackPlugin({
        defaultAttribute: 'async'
      }),
      new webpack.DefinePlugin({
        'process.env.NODE_ENV': `"${process.env.NODE_ENV}"`,
        WEB3_RPC_LOCATION: '"' + process.env.WEB3_RPC_LOCATION + '"',
      }),
      new webpack.optimize.OccurrenceOrderPlugin(),
      new webpack.optimize.DedupePlugin(),
      new webpack.optimize.UglifyJsPlugin({
        compressor: {
          screw_ie8: true,
          warnings: false,
        },
        mangle: {
          screw_ie8: true,
        },
        output: {
          comments: false,
          screw_ie8: true,
        },
      }),
      new ExtractTextPlugin('[name].[contenthash].css'),
      new CopyWebpackPlugin([
        {
          context: path.join(modulesPath, '@chronobank/chronomint-presentation/dist/chronomint-presentation'),
          from: '**',
          to: path.join(buildPath, 'chronomint-presentation'),
        },
      ]),
    ],
  })
)
