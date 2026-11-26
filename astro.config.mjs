// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  site: 'https://santiagocsm.github.io',
  base: '/priors',
  build: {
    inlineStylesheets: 'always',
  },
});
