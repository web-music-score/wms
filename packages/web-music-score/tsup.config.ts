import { defineConfig } from 'tsup'
import pkg from './package.json' assert { type: 'json' }
import { inlineAssetsPlugin } from "./tools/inlineAssetPlugin";

const bannerText = `/* WebMusicScore v${pkg.version} | (c) 2023 PahkaSoft | MIT License | Includes: Tone.js (MIT License) */`;

export default defineConfig([
    // ESM bundle
    {
        entry: {
            'index': 'src/index.full.ts'
        },
        outDir: 'dist',
        target: 'es2015',
        format: ['esm'],
        dts: true,
        sourcemap: true,
        clean: true,
        external: ['react'],
        banner: {
            js: bannerText
        },
        define: {
            __LIB_INFO__: JSON.stringify(`WebMusicScore v${pkg.version} (esm)`)
        },
        esbuildPlugins: [inlineAssetsPlugin()]
    },

    // CJS bundle
    {
        entry: {
            'index': 'src/index.full.ts'
        },
        outDir: 'dist',
        target: 'es2015',
        format: ['cjs'],
        dts: true,
        sourcemap: true,
        clean: false, // Don't wipe dist from the previous build
        external: ['react'],
        banner: {
            js: bannerText
        },
        define: {
            __LIB_INFO__: JSON.stringify(`WebMusicScore v${pkg.version} (cjs)`)
        },
        esbuildPlugins: [inlineAssetsPlugin()]
    },

    // IIFE bundle
    {
        entry: {
            'index': 'src/index.no-react.ts'
        },
        outDir: 'dist',
        target: 'es2015',
        format: ['iife'],
        globalName: 'WebMusicScore',
        sourcemap: true,
        minify: true,
        clean: false, // Don't wipe dist from the previous build
        external: ['react'], // does not include react components
        banner: {
            js: bannerText
        },
        define: {
            __LIB_INFO__: JSON.stringify(`WebMusicScore v${pkg.version} (iife)`)
        },
        esbuildPlugins: [inlineAssetsPlugin()]
    }
]);
