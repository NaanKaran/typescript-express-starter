import assert from 'node:assert/strict';
import path from 'node:path';
import test from 'node:test';

import fs from 'fs-extra';

import { DEVTOOLS_VALUES, TEMPLATES_VALUES } from '../bin/common.js';
import { getCompilerVariantFile } from '../bin/devtool-variants.js';

const swcDir = path.resolve('devtools', 'build', 'swc');
const swc = DEVTOOLS_VALUES.find((tool) => tool.value === 'swc');

// .swcrc accepts trailing commas, which JSON.parse does not
const readSwcrc = async (file) =>
  JSON.parse((await fs.readFile(file, 'utf8')).replace(/,(\s*[}\]])/g, '$1'));

const swcConfigFiles = async () => {
  const files = [];
  for (const entry of await fs.readdir(swcDir, { recursive: true })) {
    if (entry.endsWith('.swcrc')) files.push(path.join(swcDir, entry));
  }
  return files;
};

test('every swc config uses regex excludes, not globs', async () => {
  for (const file of await swcConfigFiles()) {
    const config = await readSwcrc(file);
    for (const pattern of config.exclude ?? []) {
      // swc compiles exclude entries as regexes; globs like "**/*.spec.ts" abort the build
      assert.doesNotThrow(() => new RegExp(pattern), `${path.relative(swcDir, file)}: ${pattern}`);
    }
  }
});

test('swc configs do not require @swc/helpers unless it is installed', async () => {
  const helpersInstalled = [...swc.pkgs, ...swc.devPkgs].some((p) => p.startsWith('@swc/helpers'));
  if (helpersInstalled) return;

  for (const file of await swcConfigFiles()) {
    const config = await readSwcrc(file);
    assert.notEqual(
      config.jsc?.externalHelpers,
      true,
      `${path.relative(swcDir, file)}: externalHelpers needs @swc/helpers at runtime`,
    );
  }
});

test('swc configs keep test files out of the build', async () => {
  for (const template of TEMPLATES_VALUES.filter((t) => t.active)) {
    const file = path.join(swcDir, getCompilerVariantFile('swc', template.value));
    const patterns = ((await readSwcrc(file)).exclude ?? []).map((p) => new RegExp(p));
    const excluded = (p) => patterns.some((re) => re.test(p));

    assert.ok(excluded('src/test/setup.ts'), `${template.value}: src/test/ excluded`);
    assert.ok(excluded('src/test/e2e/users.e2e.spec.ts'), `${template.value}: specs excluded`);
    assert.ok(!excluded('src/server.ts'), `${template.value}: app code compiled`);
    assert.ok(!excluded('src/utils/test-helpers/a.ts'), `${template.value}: no over-matching`);
  }
});
