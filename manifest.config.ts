import type { ManifestV3Export } from '@crxjs/vite-plugin';

const manifest: ManifestV3Export = {
  manifest_version: 3,
  name: 'tab-mama',
  version: '1.0.0',
  description: 'タブを自動管理する拡張機能',
  permissions: ['tabs', 'storage', 'alarms'],
  background: {
    service_worker: 'src/background/index.ts',
    type: 'module',
  },
  action: {
    default_popup: 'src/popup/index.html',
    default_title: 'tab-mama',
  },
};

export default manifest;
