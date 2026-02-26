import { defineConfig } from 'tsup'
import { tsupPluginInlineAssets } from "@tspro/tsup-plugin-inline-assets";

export default defineConfig([
    // ESM bundle
    {
        entry: {
            'core/index': 'src/core/index.ts',
            'classical-guitar/index': 'src/classical-guitar/index.ts',
        },
        outDir: 'dist',
        target: 'es2015',
        format: ['esm'],
        dts: false,
        sourcemap: true,
        clean: true,
        esbuildPlugins: [tsupPluginInlineAssets()]
    },

    // CJS bundle
    {
        entry: {
            'core/index': 'src/core/index.ts',
            'classical-guitar/index': 'src/classical-guitar/index.ts',
        },
        outDir: 'dist',
        target: 'es2015',
        format: ['cjs'],
        dts: true,
        sourcemap: true,
        clean: false, // Don't wipe dist from the previous build
        esbuildPlugins: [tsupPluginInlineAssets()]
    },

    // classical-guitar IIFE bundle
    {
        entry: {
            'iife/classical-guitar': 'src/classical-guitar/index.ts'
        },
        outDir: 'dist',
        target: 'es2015',
        format: ['iife'],
        globalName: 'Samples_ClassicalGuitar',
        dts: false,
        sourcemap: true,
        minify: true,
        clean: false, // Don't wipe dist from the previous build
        esbuildPlugins: [tsupPluginInlineAssets()],
        outExtension({ format }) {
            return format === 'iife' ? { js: '.js' } : {};
        }
    }
]);
