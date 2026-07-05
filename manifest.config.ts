import type { ManifestV3Export } from '@crxjs/vite-plugin';

import pkg from './package.json';

const manifest: ManifestV3Export = {
  manifest_version: 3,
  name: 'tab-mama',
  version: pkg.version,
  description: 'タブを自動管理する拡張機能',
  permissions: ['tabs', 'storage', 'alarms'],
  icons: {
    '16': 'icons/icon-16.png',
    '32': 'icons/icon-32.png',
    '48': 'icons/icon-48.png',
    '128': 'icons/icon-128.png',
  },
  background: {
    service_worker: 'src/background/index.ts',
    type: 'module',
  },
  action: {
    default_popup: 'src/popup/index.html',
    default_title: 'tab-mama',
    default_icon: {
      '16': 'icons/icon-16.png',
      '32': 'icons/icon-32.png',
      '48': 'icons/icon-48.png',
      '128': 'icons/icon-128.png',
    },
  },
};

export default manifest;
