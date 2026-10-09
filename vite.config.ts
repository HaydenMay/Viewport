import { defineConfig } from "vite";
import { readFileSync } from 'node:fs';
import { catalogAccess, catalogSettings } from './catalog.config.ts';
import { SnapshotSource } from './src/snapshot.ts';

export default defineConfig(({command, mode}) => {
  const useApiCatalog = catalogAccess(catalogSettings, command, mode);
  return {
  base: "./",
  server: { port: 4173, strictPort: true },
  plugins: [{
    name: 'viewport-catalog',
    configResolved(config) {
      if (useApiCatalog && command === 'serve' && config.server.host !== '127.0.0.1' && config.server.host !== 'localhost') {
        throw new Error('API preview must use a loopback host. Run npm run dev:catalog.');
      }
    },
    resolveId(id) { if (id === 'virtual:viewport-catalog') return '\0virtual:viewport-catalog'; },
    load(id) {
      if (id !== '\0virtual:viewport-catalog') return;
      // Never read private data in a normal production build.
      if (!useApiCatalog) return 'export default null;';
      const path = new URL('./src/generated/catalog.json', import.meta.url);
      let snapshot;
      try { snapshot = JSON.parse(readFileSync(path, 'utf8')); }
      catch { throw new Error('Local catalog unavailable. Run npm run catalog:local first.'); }
      new SnapshotSource(snapshot);
      this.addWatchFile(path.pathname);
      return `export default ${JSON.stringify(snapshot)};`;
    },
  }],
  };
});
