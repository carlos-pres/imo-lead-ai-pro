import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const buildVersion = process.env.npm_package_version || '0.0.0'
const buildTime = new Date().toISOString()

export default defineConfig({
  plugins: [react()],
  define: {
    __APP_VERSION__: JSON.stringify(buildVersion),
    __BUILD_TIME__: JSON.stringify(buildTime),
  },
  build: {
    outDir: '../dist/client',
    emptyOutDir: true,
  },
  server: {
    proxy: {
      '/api': 'http://localhost:5000',
      '/health': 'http://localhost:5000',
      '/lead': 'http://localhost:5000',
      '/leads': 'http://localhost:5000',
    },
  },
})
