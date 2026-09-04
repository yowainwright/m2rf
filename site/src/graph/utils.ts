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
  return Object.assign({}, input, {
    activeInputId,
    activeTranslationId,
    id: createId(),
    updatedAt: getUpdatedAt(),
  });
};

const createInput = (
  input: CreateGraphRecordsInput['input'],
  workspaceId: string
): GraphInput => {
  return Object.assign({}, input, {
    format: GRAPH_INPUT_FORMAT,
    id: createId(),
    updatedAt: getUpdatedAt(),
    workspaceId,
  });
};

const createTranslation = (
  translation: CreateGraphRecordsInput['translation'],
  inputId: string
): GraphTranslation => {
  return Object.assign({}, translation, {
    id: createId(),
    inputId,
    updatedAt: getUpdatedAt(),
  });
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
  const createdInput = createInput(input.input, workspace.id);
  const createdTranslation = createTranslation(input.translation, inputId);
  const graphInput = Object.assign({}, createdInput, { id: inputId });
  const translation = Object.assign({}, createdTranslation, { id: translationId });

  return { input: graphInput, translation, workspace };
};

const readRecords = async (
  workspace: GraphWorkspace
): Promise<GraphRecords | null> => {
  const activeInputId = workspace.activeInputId;
  const activeTranslationId = workspace.activeTranslationId;

  if (!activeInputId) {
    return null;
  }

  if (!activeTranslationId) {
    return null;
  }

  const input = await database.inputs.get(activeInputId);
  const translation = await database.translations.get(activeTranslationId);

  if (!input) {
    return null;
  }

  if (!translation) {
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

  if (!inputId) {
    throw new Error('Workspace is missing active records.');
  }

  if (!translationId) {
    throw new Error('Workspace is missing active records.');
  }

  const updatedAt = getUpdatedAt();
  const workspace = Object.assign({}, existing, {
    name: records.workspace.name,
    updatedAt,
  });
  const input = Object.assign({}, records.input, {
    format: GRAPH_INPUT_FORMAT,
    id: inputId,
    updatedAt,
    workspaceId: workspace.id,
  }) satisfies GraphInput;
  const translation = Object.assign({}, records.translation, {
    id: translationId,
    inputId,
    updatedAt,
  }) satisfies GraphTranslation;

  return putRecords({ input, translation, workspace });
};

const deleteWorkspaceRecord = async (workspaceId: string) => {
  await database.workspaces.delete(workspaceId);
};

const deleteInputRecord = async (inputId: string) => {
  await database.inputs.delete(inputId);
};

const deleteTranslationRecord = async (translationId: string) => {
  await database.translations.delete(translationId);
};

export const graphRepository: GraphRepository = {
  create(input) {
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
        await deleteWorkspaceRecord(workspace.id);

        if (workspace.activeInputId) {
          await deleteInputRecord(workspace.activeInputId);
        }

        if (workspace.activeTranslationId) {
          await deleteTranslationRecord(workspace.activeTranslationId);
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
