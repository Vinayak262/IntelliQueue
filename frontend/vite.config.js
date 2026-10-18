import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  base: '/IntelliQueue/',
  plugins: [react()],
  base: process.env.GITHUB_ACTIONS ? "/IntelliQueue/" : "/",
  resolve: {
    conditions: ["onnxruntime-web-use-extern-wasm"],
  },
})
