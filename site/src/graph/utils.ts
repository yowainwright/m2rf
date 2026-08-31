import Dexie, { type EntityTable } from 'dexie';
import { formatISO } from 'date-fns';
import {
  GRAPH_DATABASE_NAME,
  GRAPH_DATABASE_VERSION,
  GRAPH_INPUT_FORMAT,
  GRAPH_TABLES,
} from './constants';
import type {
  CreateGraphRecordsInput,
  GraphInput,
  GraphRecords,
  GraphRepository,
  GraphTranslation,
  GraphWorkspace,
  UpdateGraphRecordsInput,
} from './types';

type GraphDatabase = Dexie & {
  inputs: EntityTable<GraphInput, 'id'>;
  translations: EntityTable<GraphTranslation, 'id'>;
  workspaces: EntityTable<GraphWorkspace, 'id'>;
};

const database = new Dexie(GRAPH_DATABASE_NAME) as GraphDatabase;

database.version(GRAPH_DATABASE_VERSION).stores({
  [GRAPH_TABLES.inputs]: 'id, workspaceId, updatedAt',
  [GRAPH_TABLES.translations]: 'id, inputId, updatedAt',
  [GRAPH_TABLES.workspaces]: 'id, updatedAt',
});

const createId = () => {
  return crypto.randomUUID();
};

const getUpdatedAt = () => {
  return formatISO(new Date());
};

const createWorkspace = (
  input: CreateGraphRecordsInput['workspace'],
  activeInputId: string,
  activeTranslationId: string
): GraphWorkspace => {
  return {
    ...input,
    activeInputId,
    activeTranslationId,
    id: createId(),
    updatedAt: getUpdatedAt(),
  };
};

const createInput = (
  input: CreateGraphRecordsInput['input'],
  workspaceId: string
): GraphInput => {
  return {
    ...input,
    format: GRAPH_INPUT_FORMAT,
    id: createId(),
    updatedAt: getUpdatedAt(),
    workspaceId,
  };
};

const createTranslation = (
  translation: CreateGraphRecordsInput['translation'],
  inputId: string
): GraphTranslation => {
  return {
    ...translation,
    id: createId(),
    inputId,
    updatedAt: getUpdatedAt(),
  };
};

const putRecords = async (records: GraphRecords) => {
  await database.transaction(
    'rw',
    database.workspaces,
    database.inputs,
    database.translations,
    async () => {
      await database.workspaces.put(records.workspace);
      await database.inputs.put(records.input);
      await database.translations.put(records.translation);
    }
  );

  return records;
};

const createRecords = (input: CreateGraphRecordsInput): GraphRecords => {
  const inputId = createId();
  const translationId = createId();
  const workspace = createWorkspace(input.workspace, inputId, translationId);
  const graphInput = {
    ...createInput(input.input, workspace.id),
    id: inputId,
  };
  const translation = {
    ...createTranslation(input.translation, inputId),
    id: translationId,
  };

  return { input: graphInput, translation, workspace };
};

const readRecords = async (
  workspace: GraphWorkspace
): Promise<GraphRecords | null> => {
  if (!workspace.activeInputId || !workspace.activeTranslationId) {
    return null;
  }

  const input = await database.inputs.get(workspace.activeInputId);
  const translation = await database.translations.get(workspace.activeTranslationId);

  if (!input || !translation) {
    return null;
  }

  return { input, translation, workspace };
};

const updateRecords = async (
  records: UpdateGraphRecordsInput
): Promise<GraphRecords> => {
  const existing = await database.workspaces.get(records.workspace.id);

  if (!existing) {
    throw new Error('Workspace not found.');
  }

  const inputId = existing.activeInputId;
  const translationId = existing.activeTranslationId;

  if (!inputId || !translationId) {
    throw new Error('Workspace is missing active records.');
  }

  const updatedAt = getUpdatedAt();
  const workspace = { ...existing, name: records.workspace.name, updatedAt };
  const input: GraphInput = {
    ...records.input,
    format: GRAPH_INPUT_FORMAT,
    id: inputId,
    updatedAt,
    workspaceId: workspace.id,
  };
  const translation: GraphTranslation = {
    ...records.translation,
    id: translationId,
    inputId,
    updatedAt,
  };

  return putRecords({ input, translation, workspace });
};

export const graphRepository: GraphRepository = {
  async create(input) {
    return putRecords(createRecords(input));
  },
  async delete(workspaceId) {
    const workspace = await database.workspaces.get(workspaceId);

    if (!workspace) {
      return;
    }

    await database.transaction(
      'rw',
      database.workspaces,
      database.inputs,
      database.translations,
      async () => {
        await database.workspaces.delete(workspace.id);

        if (workspace.activeInputId) {
          await database.inputs.delete(workspace.activeInputId);
        }

        if (workspace.activeTranslationId) {
          await database.translations.delete(workspace.activeTranslationId);
        }
      }
    );
  },
  list() {
    return database.workspaces.orderBy('updatedAt').reverse().toArray();
  },
  async read(workspaceId) {
    const workspace = await database.workspaces.get(workspaceId);

    if (!workspace) {
      return null;
    }

    return readRecords(workspace);
  },
  update(records) {
    return updateRecords(records);
  },
};
