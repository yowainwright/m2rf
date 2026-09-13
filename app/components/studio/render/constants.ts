import { SURGE_EDGE_TYPES } from '@/app/components/edges/surge-edge';
import { SequenceMessageEdge, SequenceParticipantNode } from '@/app/components/sequence';
import { SEQUENCE_MESSAGE_EDGE_TYPE, SEQUENCE_PARTICIPANT_NODE_TYPE } from '@/app/graph/constants';

export const RENDER_EDGE_TYPES = Object.assign({}, SURGE_EDGE_TYPES, {
  [SEQUENCE_MESSAGE_EDGE_TYPE]: SequenceMessageEdge,
});
export const RENDER_NODE_TYPES = {
  [SEQUENCE_PARTICIPANT_NODE_TYPE]: SequenceParticipantNode,
};
