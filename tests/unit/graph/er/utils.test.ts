import { expect, test } from 'vitest';
import { erRelationKey, readErMetadata } from '@/app/graph/er/utils';
import type { ErMetadataEdge, ErMetadataNode } from '@/app/graph/er/types';

const node: ErMetadataNode = {
  id: 'entity-0',
  label: 'CUSTOMER',
  alias: 'Customer',
  shape: 'erBox',
  isGroup: false,
  look: 'neo',
  attributes: [{ type: 'int', name: 'id', keys: ['PK', 'FK'], comment: 'Identifier' }],
};
const edge: ErMetadataEdge = {
  id: 'relation-0',
  start: node.id,
  end: node.id,
  label: 'parent',
  arrowTypeStart: 'only_one',
  arrowTypeEnd: 'zero_or_more',
  pattern: 'solid',
};

test('preserves aliases, keys, comments, and self relationships', () => {
  const metadata = { nodes: [node], edges: [edge] };
  expect(readErMetadata(metadata)).toEqual(metadata);
});

test.each([
  { nodes: [Object.assign({}, node, { isGroup: true })], edges: [] },
  { nodes: [Object.assign({}, node, { look: 'handDrawn' })], edges: [] },
  { nodes: [node, node], edges: [] },
  { nodes: [node, Object.assign({}, node, { id: 'entity-1' })], edges: [] },
  { nodes: [node], edges: [edge, edge] },
  { nodes: [node], edges: [Object.assign({}, edge, { end: 'missing' })] },
  { nodes: [node], edges: [Object.assign({}, edge, { arrowTypeEnd: 'unknown' })] },
])('rejects incompatible or ambiguous metadata %#', (metadata) => {
  expect(() => readErMetadata(metadata)).toThrow('This ER diagram is not supported');
});

test('keeps relationship identity stable when Mermaid renumbers entities and edges', () => {
  const ids = new Map([[node.id, 'er:CUSTOMER']]);
  const renumberedIds = new Map([['entity-7', 'er:CUSTOMER']]);
  const renumbered = Object.assign({}, edge, {
    id: 'relation-9',
    start: 'entity-7',
    end: 'entity-7',
  });
  expect(erRelationKey(renumbered, renumberedIds)).toBe(erRelationKey(edge, ids));
});

test.each<Partial<ErMetadataEdge>>([
  { label: 'child' },
  { arrowTypeStart: 'zero_or_one' },
  { arrowTypeEnd: 'one_or_more' },
  { pattern: 'dashed' },
])('separates relationships with different meaning %#', (update) => {
  const ids = new Map([[node.id, 'er:CUSTOMER']]);
  const changed = Object.assign({}, edge, update);
  expect(erRelationKey(changed, ids)).not.toBe(erRelationKey(edge, ids));
});
