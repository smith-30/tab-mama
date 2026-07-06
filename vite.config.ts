import { mkdirSync, writeFileSync } from 'node:fs';

import { crx } from '@crxjs/vite-plugin';
import preact from '@preact/preset-vite';
import tailwindcss from '@tailwindcss/vite';
import { type Plugin, defineConfig } from 'vite';

import manifest from './manifest.config';
import { MESSAGES } from './src/locales';

// src/locales.ts を単一ソースとして Chrome ネイティブ i18n 用の
// public/_locales/<locale>/messages.json を生成する。生成物は gitignore 済み。
function genLocales(): Plugin {
  return {
    name: 'gen-locales',
    buildStart() {
      for (const [locale, map] of Object.entries(MESSAGES)) {
        const out: Record<string, { message: string; placeholders?: unknown }> = {};
        for (const [key, tpl] of Object.entries(map)) {
          out[key] = tpl.includes('$1')
            ? { message: tpl.replaceAll('$1', '$MIN$'), placeholders: { min: { content: '$1' } } }
            : { message: tpl };
        }
        const dir = `public/_locales/${locale}`;
        mkdirSync(dir, { recursive: true });
        writeFileSync(`${dir}/messages.json`, `${JSON.stringify(out, null, 2)}\n`);
      }
    },
  };
}

export default defineConfig({
  plugins: [genLocales(), preact(), tailwindcss(), crx({ manifest })],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
});
