const { readdirSync, existsSync } = require('fs')
const path = require('path')

const CssMinimizerPlugin = require('css-minimizer-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const TerserPlugin = require('terser-webpack-plugin')

const dirPaths = [path.resolve(__dirname, './src/components/')]

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

module.exports = {
  target: 'web',
  devtool: 'source-map',
  entry: entries,
  resolve: {
    extensions: ['.scss', '.ts', '.js'],
    modules: [
      path.resolve(__dirname, 'src'),
      path.resolve(__dirname, 'node_modules'),
    ],
  },
  output: {
    filename: '[name]/index.js',
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
          {
            loader: 'postcss-loader',
            options: {
              postcssOptions: {
                plugins: ['autoprefixer', 'cssnano'],
              },
            },
          },
          { loader: 'resolve-url-loader' },
          {
            loader: 'sass-loader',
            options: {
              sourceMap: true,
            },
          },
        ],
      },
    ],
  },
  optimization: {
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          mangle: true,
          compress: true,
        },
      }),
      new CssMinimizerPlugin(),
    ],
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: '[name]/styles.css',
      chunkFilename: '[name]/[id].css',
      ignoreOrder: false,
    }),
  ],
  stats: {
    preset: 'normal',
    assetsSpace: 100,
    modulesSpace: 100,
  },
}
