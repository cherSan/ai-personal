const { NxAppWebpackPlugin } = require('@nx/webpack/app-plugin');
const { join } = require('path');
const webpack = require('webpack'); // <-- Импортируем сам webpack для IgnorePlugin

module.exports = {
  output: {
    path: join(__dirname, 'dist'),
    clean: true,
    ...(process.env.NODE_ENV !== 'production' && {
      devtoolModuleFilenameTemplate: '[absolute-resource-path]',
    }),
  },
  plugins: [
    new NxAppWebpackPlugin({
      target: 'node',
      compiler: 'tsc',
      main: './src/main.ts',
      tsConfig: './tsconfig.app.json',
      assets: ["./src/assets"],
      optimization: false,
      outputHashing: 'none',
      generatePackageJson: false,
      sourceMap: true,

      // ИСПРАВЛЕНИЕ 1: Оставляем бэкенд-зависимости внешними для стабильности
      externalDependencies: 'all',

      // ИСПРАВЛЕНИЕ 2: Принудительно за бандлим только те ESM-модули, которые падали на Vercel
      bundlePackages: [
        'uuid',
        '@octokit/rest',
        '@octokit/core',
        '@octokit/request',
        '@octokit/endpoint',
        '@langchain/langgraph-checkpoint',
        '@langchain/textsplitters',
        '@langchain/core'
      ]
    }),

    // ИСПРАВЛЕНИЕ 3: Игнорируем опциональные микросервисы NestJS, чтобы сборка не падала
    new webpack.IgnorePlugin({
      checkResource(resource) {
        const lazyImports = [
          '@nestjs/microservices',
          '@nestjs/microservices/microservices-module',
          '@nestjs/websockets/socket-module',
          'cache-manager',
          'class-validator',
          'class-transformer'
        ];
        if (!lazyImports.includes(resource)) {
          return false;
        }
        try {
          require.resolve(resource);
          return false;
        } catch (err) {
          return true;
        }
      },
    }),
  ],
};
