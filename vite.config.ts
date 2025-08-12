import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import dts from 'vite-plugin-dts'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const isLib = mode === 'lib'
  
  return {
    plugins: [
      vue(),
      ...(isLib ? [dts({ include: ['src'] })] : [])
    ],
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src')
      }
    },
    ...(isLib ? {
      build: {
        lib: {
          entry: resolve(__dirname, 'src/index.ts'),
          name: 'JsonGeneratorTool',
          formats: ['es', 'umd'],
          fileName: (format) => `index.${format === 'es' ? 'esm' : format}.js`
        },
        rollupOptions: {
          external: ['vue'],
          output: {
            globals: {
              vue: 'Vue'
            }
          }
        }
      }
    } : {
      build: {
        outDir: 'dist-app'
      }
    })
  }
})