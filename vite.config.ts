import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// GitHub Pages 项目站点地址为 https://<user>.github.io/<repo>/
const base = process.env.VITE_BASE ?? (process.env.GITHUB_PAGES === 'true' ? '/billiards-scores/' : '/');

export default defineConfig({
  base,
  plugins: [react()],
});
