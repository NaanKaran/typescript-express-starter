import assert from 'node:assert/strict';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import fs from 'fs-extra';

const swcDir = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  'devtools',
  'build',
  'swc',
);

async function listSwcrcFiles(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map((entry) => {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) return listSwcrcFiles(fullPath);
      return entry.name.endsWith('.swcrc') ? [fullPath] : [];
    }),
  );
  return nested.flat();
}

// .swcrc files may contain trailing commas, which JSON.parse rejects.
function parseSwcrc(source) {
  return JSON.parse(source.replace(/,(\s*[}\]])/g, '$1'));
}

test('swc exclude entries are regex strings, not globs', async () => {
  const files = await listSwcrcFiles(swcDir);
  assert.ok(files.length > 0);

  for (const file of files) {
    const config = parseSwcrc(await fs.readFile(file, 'utf8'));
    for (const pattern of config.exclude ?? []) {
      const name = path.relative(swcDir, file);
      assert.doesNotThrow(() => new RegExp(pattern), `${name}: invalid regex ${pattern}`);
      assert.ok(!pattern.includes('**'), `${name}: glob pattern ${pattern}`);
      assert.ok(
        !new RegExp(pattern).test('src/server.ts'),
        `${name}: ${pattern} excludes src/server.ts`,
      );
      assert.ok(
        !new RegExp(pattern).test('src/utils/logger.ts'),
        `${name}: ${pattern} excludes src/utils/logger.ts`,
      );
    }
  }
});

test('swc configs do not require @swc/helpers', async () => {
  for (const file of await listSwcrcFiles(swcDir)) {
    const config = parseSwcrc(await fs.readFile(file, 'utf8'));
    assert.notEqual(
      config.jsc?.externalHelpers,
      true,
      `${path.relative(swcDir, file)} sets externalHelpers`,
    );
  }
});
