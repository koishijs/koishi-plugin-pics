const path = require('path');
const packgeInfo = require('./package.json');
const { ESBuildMinifyPlugin } = require('esbuild-loader');

function externalsFromDep() {
  return Object.fromEntries(
    [
      ...Object.keys(packgeInfo.dependencies || {}),
      ...Object.keys(packgeInfo.peerDependencies || {}),
    ]
      .filter((dep) => dep !== 'source-map-support')
      .map((dep) => [dep, dep]),
  );
}

const packAll = !!process.env.PACK_ALL;

module.exports = {
  entry: './src/index.ts',
  mode: 'production',
  target: 'node',
  devtool: 'source-map',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      { test: /\.mustache$/, use: 'raw-loader' },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  output: {
    filename: 'index.js',
    library: {
      type: 'commonjs',
    },
    path: path.resolve(__dirname, packAll ? 'dist/full' : 'dist'),
  },
  externals: {
    koishi: 'koishi',
    '@satorijs/satori': '@satorijs/satori',
    cordis: 'cordis',
    ...(packAll ? {} : externalsFromDep()),
  },
  optimization: {
    minimizer: [
      new ESBuildMinifyPlugin({
        keepNames: true,
      }),
    ],
  },
};
