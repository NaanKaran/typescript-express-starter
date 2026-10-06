import assert from 'node:assert/strict';
import path from 'node:path';
import test from 'node:test';

import fs from 'fs-extra';

import { DEVTOOLS_VALUES } from '../bin/common.js';

const oxlintDir = path.resolve('devtools', 'core', 'oxlint');
const oxlint = DEVTOOLS_VALUES.find((tool) => tool.value === 'oxlint');

test('oxlint devtool pins an exact oxlint version', () => {
  const spec = oxlint.devPkgs.find((pkg) => pkg.startsWith('oxlint@'));
  assert.match(spec, /^oxlint@\d+\.\d+\.\d+$/, 'unpinned ranges pick up releases that drop rules');
});

test('oxlint config only uses rules from enabled plugins', async () => {
  const config = await fs.readJson(path.join(oxlintDir, '.oxlintrc.json'));
  const plugins = new Set(config.plugins);

  for (const rule of Object.keys(config.rules)) {
    assert.ok(!rule.startsWith('@'), `${rule}: use oxlint plugin names, not ESLint package scopes`);
    const [plugin] = rule.split('/');
    if (rule.includes('/'))
      assert.ok(plugins.has(plugin), `${rule}: plugin "${plugin}" not enabled`);
  }
  // Known rules that oxlint 1.x does not implement
  assert.equal(config.rules['import/no-unresolved'], undefined);
  assert.equal(config.rules['typescript/no-unused-function-parameters'], undefined);
});

test('every copied devtool file for oxlint is valid config', async () => {
  for (const file of oxlint.files) {
    // Both .oxlintrc.json and .prettierrc must be JSON; a plain ignore list breaks `prettier`
    await assert.doesNotReject(fs.readJson(path.join(oxlintDir, file)), file);
  }
});
