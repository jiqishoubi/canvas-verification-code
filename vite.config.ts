import { defineConfig } from 'vite'
import path from 'path'
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js'

export default defineConfig({
  plugins: [cssInjectedByJsPlugin()],
  // 打包库模式
  build: {
    lib: {
      entry: path.resolve(__dirname, './src/source/index.ts'),
      name: 'CanvasVerificationCode',
      fileName: 'CanvasVerificationCode',
    },
    emptyOutDir: true,
    rollupOptions: {
      output: [
        {
          format: 'umd',
          dir: path.resolve(__dirname, 'dist/umd'),
          name: 'CanvasVerificationCode',
        },
      ],
    },
  },
})
