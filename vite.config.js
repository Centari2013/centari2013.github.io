import { defineConfig } from 'vite'
import wasm from 'vite-plugin-wasm'
import vue from '@vitejs/plugin-vue'
import svgLoader from 'vite-svg-loader'
import topLevelAwait from 'vite-plugin-top-level-await'

// https://vite.dev/config/
export default defineConfig({
  base: "/centari2013.github.io/",
  plugins: [
    vue(), 
    svgLoader(),
    wasm(),
    topLevelAwait(),
  ],
    
})
