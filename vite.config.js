import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: "/qqkneadgame/", // use the repo name here
  plugins: [react()],
})