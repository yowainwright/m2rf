import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { test } from 'node:test';
import { Effect } from 'effect';
import {
  COMPONENTS_TARGET,
  MCP_CONFIG_PATH,
  SHADCN_IMAGE,
} from '../../../../scripts/mcp/constants.ts';
import { createMcpConfiguration, createMcpFiles, generateMcpSkill } from '../../../../scripts/mcp/utils.ts';

const root = resolve(import.meta.dirname, '../../../..');

const createFixture = async () => {
  const directory = resolve(root, 'tmp');
  await mkdir(directory, { recursive: true });
  return mkdtemp(resolve(directory, 'mcp-test-'));
};

test('launches the pinned shadcn image without credentials and with a targeted config mount', () => {
  const server = createMcpConfiguration(root).mcpServers.shadcn;
  assert.equal(server.command, 'docker');
  assert.equal(server.args.at(-1), SHADCN_IMAGE);
  assert.match(SHADCN_IMAGE, /^sha256:[a-f0-9]{64}$/);
  assert.ok(server.args.includes('-i'));
  assert.ok(server.args.includes('--rm'));
  assert.ok(server.args.includes('--read-only'));
  const mountIndex = server.args.indexOf('--mount');
  assert.equal(
    server.args[mountIndex + 1],
    `type=bind,source=${resolve(root, 'components.json')},target=${COMPONENTS_TARGET},readonly`,
  );
  const forbidden = ['--privileged', '--volume', '-v', '--env', '-e', '--env-file'];
  assert.equal(server.args.some((argument) => forbidden.includes(argument)), false);
});

test('regenerates the skill and config without changing unrelated agent files', async (context) => {
  const fixture = await createFixture();
  context.after(() => rm(fixture, { recursive: true, force: true }));
  await mkdir(resolve(fixture, '.agents'), { recursive: true });
  const unrelated = resolve(fixture, '.agents/keep.txt');
  await writeFile(unrelated, 'keep');
  await Effect.runPromise(generateMcpSkill(fixture));
  await writeFile(resolve(fixture, MCP_CONFIG_PATH), 'stale generated content');
  await Effect.runPromise(generateMcpSkill(fixture));
  const results = createMcpFiles(fixture).map(async (file) => {
    const content = await readFile(resolve(fixture, file.path), 'utf8');
    assert.equal(content, file.content);
  });
  const checks = await Promise.allSettled(results);
  assert.ok(checks.every((check) => check.status === 'fulfilled'));
  assert.equal(await readFile(unrelated, 'utf8'), 'keep');
});

test('reports a filesystem failure instead of silently skipping generation', async (context) => {
  const fixture = await createFixture();
  context.after(() => rm(fixture, { recursive: true, force: true }));
  await writeFile(resolve(fixture, '.agents'), 'not a directory');
  await assert.rejects(() => Effect.runPromise(generateMcpSkill(fixture)));
});
