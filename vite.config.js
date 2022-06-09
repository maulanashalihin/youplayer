import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
const path = require("path")
// https://vitejs.dev/config/
export default defineConfig({
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/index.js'),
      name: 'YouPlayer',
      fileName: (format) => `youplayer.${format}.js`
    },
    rollupOptions: {
      // make sure to externalize deps that shouldn't be bundled
      // into your library
      external: [],
      output: {
        // Provide global variables to use in the UMD build
        // for externalized deps
        
      }
    }
  },
  plugins: [svelte()]
})
