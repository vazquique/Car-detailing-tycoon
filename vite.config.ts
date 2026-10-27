import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';
import { viteSingleFile } from 'vite-plugin-singlefile';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { Plugin } from 'vite';

/** Single-file build: embed the icons referenced by index.html as data URIs. */
function inlineIcons(): Plugin {
  const toData = (file: string, type: string): string =>
    `data:${type};base64,${readFileSync(resolve(import.meta.dirname, 'public', file)).toString('base64')}`;
  return {
    name: 'inline-icons',
    transformIndexHtml: (html) =>
      html
        .replace('./icons/favicon.svg', toData('icons/favicon.svg', 'image/svg+xml'))
        .replace('./icons/apple-touch-icon.png', toData('icons/apple-touch-icon.png', 'image/png')),
  };
}

const THEME = '#0B0F17';

export default defineConfig(({ mode }) => {
  const single = mode === 'single';
  return {
    base: './',
    plugins: [
      react(),
      tailwindcss(),
      single
        ? [viteSingleFile(), inlineIcons()]
        : VitePWA({
            registerType: 'autoUpdate',
            injectRegister: 'auto',
            includeAssets: ['icons/apple-touch-icon.png', 'icons/favicon.svg'],
            manifest: {
              name: 'Car Detailing Tycoon',
              short_name: 'Detailing',
              description: 'Construye tu imperio de detallado automotriz desde la cochera.',
              lang: 'es-MX',
              display: 'fullscreen',
              orientation: 'portrait',
              background_color: THEME,
              theme_color: THEME,
              start_url: './',
              scope: './',
              icons: [
                { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
                { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
                {
                  src: 'icons/icon-maskable-512.png',
                  sizes: '512x512',
                  type: 'image/png',
                  purpose: 'maskable',
                },
              ],
            },
            workbox: {
              globPatterns: ['**/*.{js,css,html,woff2,png,svg}'],
              navigateFallback: 'index.html',
            },
          }),
    ],
    publicDir: single ? false : 'public',
    build: {
      outDir: single ? 'dist-single' : 'dist',
      emptyOutDir: true,
    },
    test: {
      include: ['tests/**/*.test.ts'],
      environment: 'node',
    },
  };
});
