import Dexie, { type Table } from 'dexie';
import {
  GRAPH_DATABASE_NAME,
  GRAPH_DATABASE_VERSION,
  GRAPH_INPUT_FORMAT,
  GRAPH_TABLES,
} from './constants';
import type {
  CreateGraphInput,
  CreateGraphTranslation,
  CreateGraphWorkspace,
  GraphInput,
  GraphRepository,
  GraphTranslation,
  GraphWorkspace,
  UpdateGraphInput,
  UpdateGraphTranslation,
  UpdateGraphWorkspace,
} from './types';

type TimestampedRecord = {
  updatedAt: string;
};

type WritableGraphTable<TRecord extends TimestampedRecord> = Pick<
  Table<TRecord, string>,
  'get' | 'put'
>;

class GraphDatabase extends Dexie {
  inputs!: Table<GraphInput, string>;
  translations!: Table<GraphTranslation, string>;
  workspaces!: Table<GraphWorkspace, string>;

  constructor() {
    super(GRAPH_DATABASE_NAME);

    this.version(GRAPH_DATABASE_VERSION).stores({
      [GRAPH_TABLES.inputs]: 'id, workspaceId, createdAt, updatedAt',
      [GRAPH_TABLES.translations]: 'id, workspaceId, inputId, createdAt, updatedAt',
      [GRAPH_TABLES.workspaces]: 'id, createdAt, updatedAt',
    });
  }
}

const createId = () => {
  return globalThis.crypto.randomUUID();
};

const getTimestamp = () => {
  return new Date().toISOString();
};

const sortByUpdatedAt = <TRecord extends { updatedAt: string }>(
  records: TRecord[]
) => {
  return records.sort((left, right) => {
    return right.updatedAt.localeCompare(left.updatedAt);
  });
};

const updateRecord = async <TRecord extends TimestampedRecord>(
  table: WritableGraphTable<TRecord>,
  id: string,
  input: Partial<TRecord>
): Promise<TRecord | undefined> => {
  const currentRecord = await table.get(id);

  if (!currentRecord) {
    return undefined;
  }

  const nextRecord: TRecord = {
    ...currentRecord,
    ...input,
    updatedAt: getTimestamp(),
  };

  await table.put(nextRecord);

  return nextRecord;
};

class GraphDexieRepository implements GraphRepository {
  constructor(private readonly database = new GraphDatabase()) {}

  async createWorkspace(input: CreateGraphWorkspace) {
    const now = getTimestamp();
    const workspace: GraphWorkspace = {
      id: createId(),
      name: input.name,
      createdAt: now,
      updatedAt: now,
    };

    await this.database.workspaces.add(workspace);

    return workspace;
  }

  getWorkspace(id: string) {
    return this.database.workspaces.get(id);
  }

  async listWorkspaces() {
    const workspaces = await this.database.workspaces.toArray();

    return sortByUpdatedAt(workspaces);
  }

  updateWorkspace(id: string, input: UpdateGraphWorkspace) {
    return updateRecord<GraphWorkspace>(this.database.workspaces, id, input);
  }

  async deleteWorkspace(id: string) {
    await this.database.transaction(
      'rw',
      this.database.workspaces,
      this.database.inputs,
      this.database.translations,
      async () => {
        await this.database.translations.where({ workspaceId: id }).delete();
        await this.database.inputs.where({ workspaceId: id }).delete();
        await this.database.workspaces.delete(id);
      }
    );
  }

  async createInput(input: CreateGraphInput) {
    const now = getTimestamp();
    const graphInput: GraphInput = {
      id: createId(),
      workspaceId: input.workspaceId,
      format: GRAPH_INPUT_FORMAT,
      title: input.title,
      source: input.source,
      createdAt: now,
      updatedAt: now,
    };

    await this.database.inputs.add(graphInput);

    return graphInput;
  }

  getInput(id: string) {
    return this.database.inputs.get(id);
  }

  async listInputs(workspaceId: string) {
    const inputs = await this.database.inputs.where({ workspaceId }).toArray();

    return sortByUpdatedAt(inputs);
  }

  updateInput(id: string, input: UpdateGraphInput) {
    return updateRecord<GraphInput>(this.database.inputs, id, input);
  }

  async deleteInput(id: string) {
    await this.database.transaction(
      'rw',
      this.database.inputs,
      this.database.translations,
      async () => {
        await this.database.translations.where({ inputId: id }).delete();
        await this.database.inputs.delete(id);
      }
    );
  }

  async createTranslation(input: CreateGraphTranslation) {
    const now = getTimestamp();
    const translation: GraphTranslation = {
      id: createId(),
      workspaceId: input.workspaceId,
      inputId: input.inputId,
      title: input.title,
      elements: input.elements,
      view: input.view,
      settings: input.settings,
      createdAt: now,
      updatedAt: now,
    };

    await this.database.translations.add(translation);

    return translation;
  }

  getTranslation(id: string) {
    return this.database.translations.get(id);
  }

  async listTranslations(inputId: string) {
    const translations = await this.database.translations
      .where({ inputId })
      .toArray();

    return sortByUpdatedAt(translations);
  }

  updateTranslation(
    id: string,
    input: UpdateGraphTranslation
  ) {
    return updateRecord<GraphTranslation>(
      this.database.translations,
      id,
      input
    );
  }

  async deleteTranslation(id: string) {
    await this.database.translations.delete(id);
  }
}

export const createGraphRepository = (
  database = new GraphDatabase()
): GraphRepository => {
  return new GraphDexieRepository(database);
};

export const graphRepository = createGraphRepository();
