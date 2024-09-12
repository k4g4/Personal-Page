import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': '/home/anders/js/personalpage/client/src',
    },
    extensions: ['.ts', '.tsx'],
  },
})
