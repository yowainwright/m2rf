import { memo } from 'react';
import { Handle, Position } from 'reactflow';
import type { NodeComponentProps, ComponentRegistry } from '../../types/index';

interface ComponentNodeProps extends NodeComponentProps {
  components?: ComponentRegistry;
  data: NodeComponentProps['data'] & {
    componentName?: string;
  };
}

export const ComponentNode = memo<ComponentNodeProps>(({ id, data, components }) => {
  if (!data.componentName || !components) {
    return null;
  }

  const UserComponent = components[data.componentName];

  if (!UserComponent) {
    console.warn(`Component "${data.componentName}" not found in registry`);
    return null;
  }

  return (
    <div className="m2rf-node p-2">
      <Handle
        type="target"
        position={Position.Top}
        id={`${id}-target`}
        className="!bg-blue-400"
      />

      <UserComponent id={id} data={data} />

      <Handle
        type="source"
        position={Position.Bottom}
        id={`${id}-source`}
        className="!bg-blue-400"
      />
    </div>
  );
});

ComponentNode.displayName = 'ComponentNode';
