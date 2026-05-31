import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// GitHub Pages 项目站点地址为 https://<user>.github.io/<repo>/
const base = process.env.VITE_BASE ?? (process.env.GITHUB_PAGES === 'true' ? '/billiards-scores/' : '/');

export default defineConfig({
  base,
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom'],
          antd: ['antd', '@ant-design/icons'],
          dndkit: ['@dnd-kit/core', '@dnd-kit/sortable', '@dnd-kit/utilities'],
          media: ['html5-qrcode', 'qrcode', 'jsqr', 'html-to-image'],
          data: ['dexie', 'dayjs'],
        },
      },
    },
  },
});
