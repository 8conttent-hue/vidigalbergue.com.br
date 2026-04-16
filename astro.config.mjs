import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import vercel from '@astrojs/vercel';

export default defineConfig({
  output: 'server',
  adapter: vercel({
    includeFiles: ['./src/content/blog'],
    webAnalytics: {
      enabled: true,
    },
  }),
  integrations: [
    react(),
  ],
  markdown: {
    allowDangerousHtml: true,
  },
  vite: {
    plugins: [tailwindcss()],
    optimizeDeps: {
      include: ['marked'],
    },
  },
});
