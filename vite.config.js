import { defineConfig } from 'vite'
import wasm from 'vite-plugin-wasm'
import vue from '@vitejs/plugin-vue'
import svgLoader from 'vite-svg-loader'
import topLevelAwait from 'vite-plugin-top-level-await'
import { visualizer } from 'rollup-plugin-visualizer'
import tailwindcss from "@tailwindcss/vite";

export default defineConfig(({ mode }) => {
  const isAnalyze = mode === 'analyze'

  return {
    base: "/",
    plugins: [
      tailwindcss(),
      vue(),
      svgLoader(),
      wasm(),
      topLevelAwait(),
    ],
    resolve: {
      alias: [
        {
          find: '@',
          replacement: '/src'
        },
      ]
    },
    build: {
      rollupOptions: {
        plugins: isAnalyze
          ? [
              visualizer({
                open: true,
                filename: 'dist/report.html',
                gzipSize: true,
                brotliSize: true
              })
            ]
          : []
      }
    }
  }
})
