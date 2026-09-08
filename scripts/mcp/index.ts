import { resolve } from 'node:path';
import { Effect } from 'effect';
import { generateMcpSkill } from './utils.ts';

const root = resolve(import.meta.dirname, '../..');
await Effect.runPromise(generateMcpSkill(root));
process.stdout.write('Generated shadcn MCP skill and configuration in .agents/.\n');
