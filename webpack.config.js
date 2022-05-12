const { readdirSync, existsSync } = require('fs')
const path = require('path')
const glob = require('glob')

const CssMinimizerPlugin = require('css-minimizer-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const TerserPlugin = require('terser-webpack-plugin')

const dirPaths = [
  path.resolve(__dirname, './src/components/'),
]

const getJsEntries = () => {
  const entries = {}

  dirPaths.forEach(dirPath =>
    readdirSync(dirPath, { withFileTypes: true })
      .filter(dir => dir.isDirectory())
      .filter(
        dir =>
          existsSync(`${dirPath}/${dir.name}/index.js`) ||
          existsSync(`${dirPath}/${dir.name}/index.ts`)
      )
      .forEach(({ name }) => {
        entries[name] = `${dirPath}/${name}`
      })
  )

  return entries
}

const getStyleEntries = pattern =>
  glob.sync(pattern).reduce((entries, filename) => {
    // Skip includes
    if (path.basename(filename)[0] === '_') {
      return entries
    }

    const [, dirName] = filename.match(/\/([^\/]+\/[^\/]+).scss$/)
    const entryName = 'style-' + dirName.replace('/', '-')
    entries[entryName] = filename

    return entries
  }, {})

module.exports = {
  target: 'web',
  devtool: 'source-map',
  entry: { ...getJsEntries(), ...getStyleEntries('./src/**/*.scss') },
  resolve: {
    extensions: ['.scss', '.ts', '.js'],
    modules: [
      path.resolve(__dirname, 'src'),
      path.resolve(__dirname, 'node_modules'),
    ],
  },
  output: {
    filename: pathData => {
      const isStylesheet = pathData.chunk.name.startsWith('style-')

      return isStylesheet ? '[name]' : '[name]/index.js'
    },
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
        test: /\.css$/i,
        use: [MiniCssExtractPlugin.loader, 'css-loader'],
      },
      {
        test: /\.scss$/,
        use: [
          MiniCssExtractPlugin.loader,
          { loader: 'css-loader' },
          { loader: 'resolve-url-loader', options: { debug: false } },
          { loader: 'sass-loader' },
        ],
      },
    ],
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: pathData => {
        return pathData.chunk.name.replace('style-', '') + '.css'
      },
    }),
  ],
  stats: {
    preset: 'normal',
    assetsSpace: 100,
    modulesSpace: 100,
  },
}
