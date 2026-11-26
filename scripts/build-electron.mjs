import { mkdir } from 'node:fs/promises';
import { build } from 'esbuild';

const outdir = 'dist-electron';
await mkdir(outdir, { recursive: true });

await Promise.all([
  build({
    entryPoints: ['electron/main.ts'],
    outfile: `${outdir}/main.mjs`,
    bundle: true,
    platform: 'node',
    format: 'esm',
    packages: 'external',
    target: 'node22',
  }),
  build({
    entryPoints: ['electron/preload.ts'],
    outfile: `${outdir}/preload.cjs`,
    bundle: true,
    platform: 'node',
    format: 'cjs',
    packages: 'external',
    target: 'node22',
  }),
]);
