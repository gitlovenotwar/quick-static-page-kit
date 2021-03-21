require('dotenv').config();
const path = require('path');
const { v1: uuidv1 } = require('uuid');
const { DefinePlugin } = require('webpack');
const Dotenv = require('dotenv-webpack');
const HTMLWebpackPlugin = require('html-webpack-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const CompressionPlugin = require('compression-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const OptimizeCssAssetsPlugin = require('optimize-css-assets-webpack-plugin');

const clientDir = `${__dirname}/src`;
const distDir = `${__dirname}/dist`;
const hash = uuidv1();

module.exports = (env, argv) => {
  const isProduction = process.env.NODE_ENV === 'production' || (argv && argv.mode === 'production');
  return {
    entry: [
      '@babel/polyfill', 
      `${clientDir}/index.js`
    ],
    output: {
      filename: `bundle.${hash}.js`,
      path: distDir,
      publicPath: '/',
    },
    module: {
      rules: [
        {
          test: /\.js$/,
          exclude: /node_module/,
          loader: 'babel-loader',
        },
        {
          test: /\.css$/,
          exclude: /assets\/fonts/,
          use: [
            isProduction ? MiniCssExtractPlugin.loader : 'style-loader',
            {
              loader: 'css-loader',
              options: {
                modules: true,
                importLoaders: 1,
                localIdentName: '[name]__[local]',
                minimize: { safe: true },
              },
            },
            {
              loader: 'postcss-loader',
              options: {
                config: {
                  path: path.resolve(__dirname, './postcss.config.js'),
                },
              },
            },
          ],
        },
        {
          test: /\.(png|jpg|jpeg|gif|svg)$/, 
          loader: 'url-loader?limit=8192'
        }
      ],
    },
    plugins: getPlugins(isProduction),
    devServer: {
      historyApiFallback: true,
    },
    optimization: {
      splitChunks: {
        chunks: 'all',
      }
    }
  };
}

/** Initialize all the webpack plugins here */
function getPlugins(isProduction) {
  let plugins = [];
  
  /** CHECK FOR PRODUCTION ENV */
  if(isProduction) {
    // CLEAN WEBPACK PLUGIN SHOULD BE ADDED FIRST IN PRODUCTION SO IT CLEANS THE DIST FIRST
    plugins.push(new CleanWebpackPlugin([distDir]));
    
    /** WEBPACK ENV VARS AVAILABLE TO CLIENT SIDE */
    const data = {};
    Object.keys(process.env).map((key) => {
      data[`process.env.${key}`] = JSON.stringify(process.env[key]);
    });
    plugins.push(new DefinePlugin(data));
  }

  /** COMMON WEBPACK PLUGIN */
  plugins.push(new Dotenv({
    path: './.env',
    silent: false,
    expand: true,
  }));

  /** PRODUCTION MIDDLE PLUGINS */
  if(isProduction) {
    plugins.push(new MiniCssExtractPlugin({
      filename: `main.${hash}.css`,
    }));
    plugins.push(new OptimizeCssAssetsPlugin());
  }

  plugins.push(new HTMLWebpackPlugin({
    title: process.env.APP_TITLE,
    filename: 'index.html',
    template: `${clientDir}/index.html`,
    inject: true,
  }));

  /** PRODUCTION END PLUGINS */
  if(isProduction) {
    plugins.push(new TerserPlugin({ sourceMap: true }));
    plugins.push(new CompressionPlugin());
  }

  return plugins;
}
