import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    lib: {
      entry: 'src/index.ts',
      name: 'RiddleMeThis',
      fileName: 'riddle-widget',
      formats: ['iife'],
    },
    rollupOptions: {
      output: {
        entryFileNames: 'riddle-widget.js',
        inlineDynamicImports: true,
      },
    },
    minify: 'terser',
    target: 'es2015',
  },
  define: {
    'process.env.NODE_ENV': '"production"',
  },
})
