import { defineConfig } from 'vite'
import { resolve } from 'node:path'

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        cronometro: resolve(__dirname, 'index.html'),
        alumnos: resolve(__dirname, 'alumnos.html'),
        alumno: resolve(__dirname, 'alumno.html'),
      },
    },
  },
})
