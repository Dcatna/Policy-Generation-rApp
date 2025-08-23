import {defineConfig} from 'vite'
import react from '@vitejs/plugin-react'
import path from "path"

// https://vitejs.dev/config/

export default defineConfig({
  server: {
    proxy: {
      "/api":     { target: "http://127.0.0.1:8088", changeOrigin: true },
      "/healthz": { target: "http://127.0.0.1:8088", changeOrigin: true },
      "/version": { target: "http://127.0.0.1:8088", changeOrigin: true },
      "/metrics": { target: "http://127.0.0.1:8088", changeOrigin: true },
    },
  },
  plugins: [react()],
  resolve: { alias: { "@": path.resolve(__dirname, "./src") } },
});
