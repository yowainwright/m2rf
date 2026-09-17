import type { AppContext } from '@/app/types';
import type { GraphRecords } from '@/app/graph';

export type SavedWorkspace = { records: GraphRecords; draft: AppContext };
