const { NxAppWebpackPlugin } = require('@nx/webpack/app-plugin');
const { join } = require('path');
const webpack = require('webpack');

// @nestjs/swagger pulls in @nestjs/mapped-types, which lazily requires
// class-transformer/class-validator internals only used by decorators we
// don't use (PartialType, OmitType, etc). Webpack tries to statically
// resolve those requires and fails at build time even though they're never
// called at runtime — this is the standard workaround.
// See https://github.com/nestjs/mapped-types/issues/486
const lazyImports = [
  '@nestjs/microservices',
  '@nestjs/microservices/microservices-module',
  '@nestjs/websockets/socket-module',
  'class-transformer/storage',
];

module.exports = {
  output: {
    path: join(__dirname, 'dist'),
    clean: true,
    ...(process.env.NODE_ENV !== 'production' && {
      devtoolModuleFilenameTemplate: '[absolute-resource-path]',
    }),
  },
  // Externalize real node_modules packages instead of bundling them. This
  // matters most for Prisma: it ships a native query-engine binary next to
  // @prisma/client that webpack can't relocate into a single-file bundle.
  // NxAppWebpackPlugin's own `externalDependencies: 'all'` delegates to
  // `webpack-node-externals`, which only externalizes packages hoisted
  // into the *workspace-root* node_modules — under pnpm's strict layout
  // that misses direct deps of this app that aren't shared/hoisted (e.g.
  // @prisma/client, zod, @nestjs/swagger), so they'd still get bundled.
  // This app only ever runs from inside the workspace (apps/api/dist ->
  // apps/api's own pnpm-linked node_modules), so externalizing them
  // resolves normally at runtime.
  //
  // `@props-analyzer/*` workspace libs are deliberately NOT externalized
  // here: they're ESM-only (`"type": "module"`) and this bundle is CJS, so
  // `require()`-ing their built output would fail with ERR_REQUIRE_ESM.
  // Letting webpack bundle their (TS) source alongside app code, same as
  // any other tsconfig-path-mapped import, avoids that mismatch.
  externals: [
    ({ request }, callback) => {
      if (
        request &&
        !request.startsWith('.') &&
        !request.startsWith('/') &&
        !request.startsWith('@props-analyzer/')
      ) {
        return callback(null, `commonjs ${request}`);
      }
      callback();
    },
  ],
  plugins: [
    new NxAppWebpackPlugin({
      target: 'node',
      compiler: 'tsc',
      main: './src/main.ts',
      tsConfig: './tsconfig.app.json',
      assets: ['./src/assets'],
      optimization: false,
      outputHashing: 'none',
      // Preserve the `externals` array above — without this,
      // NxAppWebpackPlugin unconditionally replaces `config.externals`.
      mergeExternals: true,
      generatePackageJson: false,
      sourceMap: true,
    }),
    new webpack.IgnorePlugin({
      checkResource(resource) {
        if (!lazyImports.includes(resource)) {
          return false;
        }
        try {
          require.resolve(resource);
          return false;
        } catch {
          return true;
        }
      },
    }),
  ],
};
