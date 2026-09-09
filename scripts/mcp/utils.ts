import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { Effect } from 'effect';
import {
  DOCKER_ARGUMENTS,
  MCP_CONFIG_PATH,
  SHADCN_IMAGE,
  SKILL_CONTENT,
  SKILL_PATH,
} from './constants.ts';
import type { GeneratedFile, McpConfiguration } from './types.ts';

export const createMcpConfiguration = (): McpConfiguration => {
  const args = DOCKER_ARGUMENTS.concat(SHADCN_IMAGE);
  return { mcpServers: { shadcn: { command: 'docker', args } } };
};

export const createMcpFiles = (): GeneratedFile[] => {
  const configuration = createMcpConfiguration();
  const content = JSON.stringify(configuration, null, 2).concat('\n');
  return [
    { path: MCP_CONFIG_PATH, content },
    { path: SKILL_PATH, content: SKILL_CONTENT },
  ];
};

const writeMcpFile = (root: string, file: GeneratedFile) => {
  return Effect.tryPromise(async () => {
    const destination = resolve(root, file.path);
    await mkdir(dirname(destination), { recursive: true });
    await writeFile(destination, file.content, 'utf8');
  });
};

export const generateMcpSkill = (root: string) => {
  const files = createMcpFiles();
  return Effect.forEach(files, (file) => writeMcpFile(root, file), {
    concurrency: 1,
    discard: true,
  });
};
