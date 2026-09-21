import { SURGE_EDGE_TYPES } from '@/app/components/edges';
import { StateDiagramNode, StateTransitionEdge } from '@/app/components/state-diagram';
import { STATE_EDGE_TYPE, STATE_NODE_TYPE } from '@/app/graph/state/constants';
import { ClassDiagramNode, ClassRelationEdge } from '@/app/components/class-diagram';
import { CLASS_EDGE_TYPE, CLASS_NODE_TYPE } from '@/app/graph/class/constants';
import {
  SequenceActionNode,
  SequenceFrameNode,
  SequenceMessageEdge,
  SequenceNoteNode,
  SequenceParticipantNode,
} from '@/app/components/sequence';
import {
  SEQUENCE_ACTION_NODE_TYPE,
  SEQUENCE_FRAME_NODE_TYPE,
  SEQUENCE_MESSAGE_EDGE_TYPE,
  SEQUENCE_NOTE_NODE_TYPE,
  SEQUENCE_PARTICIPANT_NODE_TYPE,
} from '@/app/graph/constants';

export const RENDER_LABELS = {
  output: 'React Flow output',
  resetLayout: 'Reset layout',
  nodeSelected: 'Node selected',
  edgeSelected: 'Edge selected',
};
export const RENDER_PRO_OPTIONS = { hideAttribution: true };
export const RENDER_MIN_ZOOM = 0.1;

export const RENDER_EDGE_TYPES = Object.assign({}, SURGE_EDGE_TYPES, {
  [CLASS_EDGE_TYPE]: ClassRelationEdge,
  [STATE_EDGE_TYPE]: StateTransitionEdge,
  [SEQUENCE_MESSAGE_EDGE_TYPE]: SequenceMessageEdge,
});
export const RENDER_NODE_TYPES = {
  [CLASS_NODE_TYPE]: ClassDiagramNode,
  [STATE_NODE_TYPE]: StateDiagramNode,
  [SEQUENCE_ACTION_NODE_TYPE]: SequenceActionNode,
  [SEQUENCE_FRAME_NODE_TYPE]: SequenceFrameNode,
  [SEQUENCE_NOTE_NODE_TYPE]: SequenceNoteNode,
  [SEQUENCE_PARTICIPANT_NODE_TYPE]: SequenceParticipantNode,
};
