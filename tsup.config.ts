import { defineConfig } from 'tsup'
import pkg from './package.json' assert { type: 'json' }
import { tsupPluginInlineAssets } from "@tspro/tsup-plugin-inline-assets";

const bannerText = `/* WebMusicScore v${pkg.version} | (c) 2023-2025 Stefan Brockmann | MIT License | Includes: Tone.js (MIT License), Color Name to Code (MIT License) */`;

export default defineConfig([
    // ESM bundle
    {
        entry: {
            'core/index': 'src/core/index.ts',
            'audio/index': 'src/audio/index.ts',
            'audio-synth/index': 'src/audio-instruments/audio-synth/index.ts',
            'audio-cg/index': 'src/audio-instruments/audio-cg/index.ts',
            'theory/index': 'src/theory/index.ts',
            'score/index': 'src/score/index.ts',
            'react-ui/index': 'src/react-ui/index.ts',
            'pieces/index': 'src/pieces/index.ts'
        },
        outDir: 'dist',
        target: 'es2015',
        format: ['esm'],
        dts: true,
        sourcemap: true,
        clean: true,
        external: ['react', 'web-music-score'],
        banner: {
            js: bannerText
        },
        define: {
            __LIB_INFO__: JSON.stringify(`WebMusicScore v${pkg.version} (esm)`)
        },
        esbuildPlugins: [tsupPluginInlineAssets()]
    },

    // CJS bundle
    {
        entry: {
            'core/index': 'src/core/index.ts',
            'audio/index': 'src/audio/index.ts',
            'audio-synth/index': 'src/audio-instruments/audio-synth/index.ts',
            'audio-cg/index': 'src/audio-instruments/audio-cg/index.ts',
            'theory/index': 'src/theory/index.ts',
            'score/index': 'src/score/index.ts',
            'react-ui/index': 'src/react-ui/index.ts',
            'pieces/index': 'src/pieces/index.ts'
        },
        outDir: 'dist',
        target: 'es2015',
        format: ['cjs'],
        dts: true,
        sourcemap: true,
        clean: false, // Don't wipe dist from the previous build
        external: ['react', 'web-music-score'],
        banner: {
            js: bannerText
        },
        define: {
            __LIB_INFO__: JSON.stringify(`WebMusicScore v${pkg.version} (cjs)`)
        },
        esbuildPlugins: [tsupPluginInlineAssets()]
    },

    // IIFE bundle
    {
        entry: {
            'iife/index': 'src/index.iife.ts'
        },
        outDir: 'dist',
        target: 'es2015',
        format: ['iife'],
        globalName: 'WebMusicScore',
        sourcemap: true,
        minify: true,
        clean: false, // Don't wipe dist from the previous build
        banner: {
            js: bannerText
        },
        define: {
            __LIB_INFO__: JSON.stringify(`WebMusicScore v${pkg.version} (iife)`)
        },
        esbuildPlugins: [tsupPluginInlineAssets()]
    },

    // audio-cg IIFE bundle
    {
        entry: {
            'iife/audio-cg': 'src/audio-instruments/audio-cg/index.ts'
        },
        outDir: 'dist',
        target: 'es2015',
        format: ['iife'],
        globalName: 'Audio_CG',
        sourcemap: true,
        minify: true,
        clean: false, // Don't wipe dist from the previous build
        banner: {
            js: bannerText
        },
        footer: {
            js: `
// Backward compatibility alias
var Audio_ClassicalGuitar = Audio_CG;
if (typeof window !== "undefined") {
    window.Audio_ClassicalGuitar = window.Audio_CG = Audio_CG;
}
`
        },
        define: {
            __LIB_INFO__: JSON.stringify(`Audio_CG v${pkg.version} (iife)`)
        },
        esbuildPlugins: [tsupPluginInlineAssets()]
    }
]);
