import { defineConfig } from 'astro/config';

// SITE_URL e SITE_BASE são opcionais. Em GitHub Pages de projeto, por exemplo: SITE_BASE=/nome-do-repositorio
export default defineConfig({
  site: process.env.SITE_URL,
  base: process.env.SITE_BASE ?? '/',
  output: 'static',
  trailingSlash: 'always',
  build: { format: 'directory' },
});
