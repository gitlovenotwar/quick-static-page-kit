const importer = require('postcss-import');
const advancedVariables = require('postcss-advanced-variables');
const nested = require('postcss-nested');
const autoprefixer = require('autoprefixer');

const plugins = [
  nested,
  importer({
    path: ['./src', './node_modules'],
  }),
  autoprefixer,
  advancedVariables,
];

module.exports = {
  plugins,
};
