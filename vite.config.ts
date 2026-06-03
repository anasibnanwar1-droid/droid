import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
// base './' so built assets load over file:// inside the Electron app.
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
})
