import { build } from 'esbuild';
import { mkdir } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
await mkdir('.test-output', { recursive: true });
await build({ entryPoints: ['tests/core.test.ts'], bundle: true, platform: 'node', format: 'esm', outfile: '.test-output/core.test.mjs' });
const result = spawnSync(process.execPath, ['--test', '.test-output/core.test.mjs'], { stdio: 'inherit' });
process.exit(result.status ?? 1);
