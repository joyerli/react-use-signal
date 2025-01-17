import { defineConfig, UserConfig } from 'vite';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig(() => {
  const config: UserConfig = {
    build: {
      lib: {
        entry: path.resolve(__dirname, 'src/index.ts'),
        name: 'react-use-signal',
        fileName: (format) => `react-use-signal.${format}.js`,
      },
      rollupOptions: {
        // 确保外部化处理那些你不想打包进库的依赖
        external: ['react'],
        output: {
          // 在 UMD 构建模式下为这些外部化的依赖提供一个全局变量
          globals: {
            react: 'React'
          }
        }
      },
    },
  };
  return config;
});
