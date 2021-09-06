import path, { resolve } from 'path'
import scss from 'rollup-plugin-scss'
import ts from 'rollup-plugin-typescript2'
import json from '@rollup/plugin-json'
import replace from '@rollup/plugin-replace'
import { string } from 'rollup-plugin-string'
const { terser } = require('rollup-plugin-terser')

const { NODE_ENV, SOURCE_MAP } = process.env;
const { name, version } = require('./package.json');

function replaceHTMLSpacePlugin() {
  const list = [
    'player/src/components/',
    '/player/src/dom.ts',
    '/player/src/utils/output.ts'
  ];

  return {
    name: 'ReplaceHTMLSpace',
    transform(code, id) {
      if (NODE_ENV === 'production' && list.some(path => id.includes(path))) {
        return { code: code.replace(/(<.*?>)|\s+/g, (m, $1) => ($1 ? $1 : ' ')), map: { mappings: '' } }
      }
    }
  }
}

function createConfig(entryFile, output) {
  output.sourcemap = !!SOURCE_MAP
  output.externalLiveBindings = false
  output.globals = {}
  output.sourcemap = true

  const shouldEmitDeclarations = false

  const tsPlugin = ts({
    check: true,
    tsconfig: path.resolve(__dirname, 'tsconfig.json'),
    cacheRoot: path.resolve(__dirname, 'node_modules/.ts_cache'),
    tsconfigOverride: {
      compilerOptions: {
        sourceMap: output.sourcemap,
        declaration: shouldEmitDeclarations,
        declarationMap: shouldEmitDeclarations
      },
      exclude: ['**/test']
    }
  })

  const nodePlugins = [
    require('@rollup/plugin-commonjs')(),
    require('rollup-plugin-node-polyfills')(),
    require('@rollup/plugin-node-resolve').nodeResolve()
  ];

  const plugins = [];
  const external = []
  const defaultPlugins = [
    scss({
      output: false,
      failOnError: true
    }),
    json(),
    string({
      include: ['**/*.html', '**/*.css'],
      exclude: ['**/index.html', '**/index.css']
    }),
    replace({
      preventAssignment: true,
      'process.env.NODE_ENV': JSON.stringify(NODE_ENV),
    }),
    replaceHTMLSpacePlugin()
  ];

  if (NODE_ENV === 'production') {
    plugins.push(
      terser({
        module: /^esm/.test(output.format),
        compress: {
          ecma: 2015,
          pure_getters: true
        },
        output: { comments: false }
      })
    );
  }

  return {
    input: resolve(entryFile),
    external,
    plugins: [
      tsPlugin,
      ...defaultPlugins,
      ...nodePlugins,
      ...plugins,
    ],
    output,
    treeshake: {
      moduleSideEffects: false
    }
  }
}

export default [
  // recorder
  createConfig('./recorder/index.ts', { file: 'dist/xreplay-recorder.cjs.js', format: 'cjs' }),
  createConfig('./recorder/index.ts', { file: 'dist/xreplay-recorder.esm.js', format: 'esm' }),
  createConfig('./recorder/index.ts', { file: 'dist/xreplay-recorder.global.js', format: 'iife', name }),
  // player
  createConfig('./player/index.ts', { file: 'dist/xreplay-player.cjs.js', format: 'cjs' }),
  createConfig('./player/index.ts', { file: 'dist/xreplay-player.esm.js', format: 'esm' }),
  createConfig('./player/index.ts', { file: 'dist/xreplay-player.global.js', format: 'iife', name }),
];