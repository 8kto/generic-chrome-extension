const path = require('path')
const glob = require('glob')

const MiniCssExtractPlugin = require('mini-css-extract-plugin')

const getJsEntries = pattern =>
  glob.sync(pattern).reduce((entries, filename) => {
    // Skip tests and .d.ts types
    const basename = path.basename(filename)
    if (
      basename.endsWith('.test.ts') ||
      basename.endsWith('.test.js') ||
      basename.endsWith('.d.ts')
    ) {
      return entries
    }

    const entryName = filename
      .replace(/^(:?\.\/)?src\//, '')
      .replace(/\.[jt]s/, '')
    entries[entryName] = filename

    return entries
  }, {})

const getStyleEntries = pattern =>
  glob.sync(pattern).reduce((entries, filename) => {
    // Skip includes
    if (path.basename(filename)[0] === '_') {
      return entries
    }

    const entryName = filename
      .replace(/^(:?\.\/)?src\//, '')
      .replace(/\.scss$/, '')
    entries[entryName] = filename

    return entries
  }, {})

module.exports = {
  target: 'web',
  devtool: 'source-map',
  entry: {
    ...getJsEntries('./src/components/**/*.{ts,js}'),
    ...getStyleEntries('./src/**/*.{scss,css}'),
  },
  resolve: {
    extensions: ['.scss', '.ts', '.js'],
    modules: [
      path.resolve(__dirname, 'src'),
      path.resolve(__dirname, 'node_modules'),
    ],
  },
  output: {
    path: path.resolve(__dirname, 'build'),
  },
  module: {
    rules: [
      {
        test: /\.ts?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.(sc|c)ss$/,
        use: [
          MiniCssExtractPlugin.loader,
          'css-loader',
          { loader: 'resolve-url-loader', options: { debug: false } },
          'sass-loader',
        ],
      },
    ],
  },
  plugins: [new MiniCssExtractPlugin()],
  stats: {
    preset: 'minimal',
    assetsSpace: 20,
    modulesSpace: 20,
  },
}
