import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Vercel 배포 시에는 '/', GitHub Pages 배포 시에는 '/todoapp/' 사용
  base: process.env.VERCEL === '1' || !process.env.GITHUB_ACTIONS ? '/' : '/todoapp/',
})
