import assert from 'node:assert/strict';
import path from 'node:path';
import test from 'node:test';

import fs from 'fs-extra';

import { TEMPLATES_VALUES } from '../bin/common.js';
import { TEMPLATE_DB } from '../bin/db-map.js';
import { getTemplateFamily, getTestingVariantFolder } from '../bin/devtool-variants.js';
import { validateTemplateIntegrity } from '../bin/validators.js';

const TEMPLATE = 'mongoose-mongodb';
const templateDir = path.resolve('templates', TEMPLATE);

test('mongoose template is active and selectable', () => {
  const template = TEMPLATES_VALUES.find((t) => t.value === TEMPLATE);

  assert.ok(template, 'template is registered');
  assert.equal(template.active, true);
  assert.equal(TEMPLATE_DB[TEMPLATE], 'mongodb');
  assert.equal(getTemplateFamily(TEMPLATE), 'mongoose');
});

test('mongoose template uses mongoose-specific test fixtures', async () => {
  for (const tool of ['jest', 'vitest']) {
    const variant = getTestingVariantFolder(tool, TEMPLATE);
    assert.equal(variant, 'src-mongoose');

    const fixtureDir = path.resolve('devtools', 'test', tool, variant);
    assert.ok(await fs.pathExists(path.join(fixtureDir, 'test', 'setup.ts')), `${tool} setup.ts`);
    assert.ok(await fs.pathExists(path.join(fixtureDir, 'test', 'e2e')), `${tool} e2e tests`);
  }
});

test('mongoose template ships the files the CLI expects', async () => {
  for (const file of ['package.json', 'tsconfig.json', '.env.example', 'src/server.ts']) {
    assert.ok(await fs.pathExists(path.join(templateDir, file)), file);
  }

  const pkg = await fs.readJson(path.join(templateDir, 'package.json'));
  assert.ok(pkg.dependencies.mongoose, 'mongoose dependency');
  assert.ok(pkg.devDependencies['mongodb-memory-server'], 'in-memory MongoDB for tests');

  const envExample = await fs.readFile(path.join(templateDir, '.env.example'), 'utf8');
  for (const key of ['MONGODB_URL', 'JWT_SECRET', 'SECRET_KEY']) {
    assert.match(envExample, new RegExp(`^${key}=`, 'm'), key);
  }
});

test('mongoose template contains no dynamically generated devtool files', () => {
  assert.doesNotThrow(() => validateTemplateIntegrity(templateDir));
});
