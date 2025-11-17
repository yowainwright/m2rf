import { memo } from 'react';
import { Handle, Position } from 'reactflow';
import type { NodeComponentProps } from '../../types/index';

export const DefaultNode = memo<NodeComponentProps>(({ id, data }) => {
  return (
    <div className="m2rf-node px-4 py-3 min-w-[150px]">
      <Handle
        type="target"
        position={Position.Top}
        id={`${id}-target`}
        className="!bg-gray-400"
      />

      <div className="m2rf-label text-center">
        {data.label}
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        id={`${id}-source`}
        className="!bg-gray-400"
      />
    </div>
  );
});

DefaultNode.displayName = 'DefaultNode';
