import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { execSync } from 'child_process'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    __GIT_SHA__: JSON.stringify(
      process.env.CF_PAGES_COMMIT_SHA ||
        execSync('git rev-parse HEAD').toString().trim()
    ),
  },
  server: {
    host: true, // Allow external connections
    port: 5173,
  },
})
