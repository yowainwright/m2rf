import { memo, type CSSProperties, type MouseEvent } from 'react';
import { Handle, Position } from 'reactflow';
import type {
  ComponentRegistry,
  M2RFAnimationType,
  NodeComponentProps,
} from '../../types/index';
import { NODE_CLASS_NAMES, NODE_TEXT } from './constants';

interface ComponentNodeProps extends NodeComponentProps {
  components?: ComponentRegistry;
  data: NodeComponentProps['data'] & {
    componentName?: string;
  };
}

type NodeStyle = CSSProperties & {
  '--m2rf-node-bg'?: string;
  '--m2rf-node-border'?: string;
  '--m2rf-node-font'?: string;
  '--m2rf-node-text'?: string;
};

const getNodeAnimation = (
  animation: unknown
): M2RFAnimationType | undefined => {
  if (animation === 'none') {
    return animation;
  }

  if (animation === 'pulse') {
    return animation;
  }

  if (animation === 'start-to-finish') {
    return animation;
  }

  return undefined;
};

const getNodeStyle = (data: NodeComponentProps['data']): NodeStyle => {
  const primaryColor = data.primaryColor as string | undefined;
  const inverseColor = data.inverseColor as string | undefined;
  const fontFamily = data.fontFamily as string | undefined;

  return {
    '--m2rf-node-bg': primaryColor,
    '--m2rf-node-border': primaryColor,
    '--m2rf-node-font': fontFamily,
    '--m2rf-node-text': inverseColor,
  };
};

const NodeStyleButton = ({
  id,
  onStyleOpen,
}: {
  id: string;
  onStyleOpen?(nodeId: string): void;
}) => {
  if (!onStyleOpen) {
    return null;
  }

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    onStyleOpen(id);
  };

  return (
    <button
      aria-label={NODE_TEXT.openStyles}
      className={NODE_CLASS_NAMES.styleButton}
      type="button"
      onClick={handleClick}
    >
      +
    </button>
  );
};

export const DefaultNode = memo<NodeComponentProps>(({ id, data }) => {
  const style = getNodeStyle(data);
  const animation = getNodeAnimation(data.animation);

  return (
    <div
      className={NODE_CLASS_NAMES.default}
      data-animation={animation}
      style={style}
    >
      <NodeStyleButton id={id} onStyleOpen={data.onStyleOpen} />
      <Handle
        type="target"
        position={Position.Top}
        id={`${id}-target`}
        className={NODE_CLASS_NAMES.defaultHandle}
      />

      <div className={NODE_CLASS_NAMES.label}>
        {data.label}
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        id={`${id}-source`}
        className={NODE_CLASS_NAMES.defaultHandle}
      />
    </div>
  );
});

DefaultNode.displayName = 'DefaultNode';

export const ComponentNode = memo<ComponentNodeProps>(({ id, data, components }) => {
  if (!data.componentName || !components) {
    return null;
  }

  const UserComponent = components[data.componentName];

  if (!UserComponent) {
    console.warn(`${NODE_TEXT.missingComponent}: ${data.componentName}`);
    return null;
  }

  const animation = getNodeAnimation(data.animation);
  const style = getNodeStyle(data);

  return (
    <div
      className={NODE_CLASS_NAMES.component}
      data-animation={animation}
      style={style}
    >
      <NodeStyleButton id={id} onStyleOpen={data.onStyleOpen} />
      <Handle
        type="target"
        position={Position.Top}
        id={`${id}-target`}
        className={NODE_CLASS_NAMES.componentHandle}
      />

      <UserComponent id={id} data={data} />

      <Handle
        type="source"
        position={Position.Bottom}
        id={`${id}-source`}
        className={NODE_CLASS_NAMES.componentHandle}
      />
    </div>
  );
});

ComponentNode.displayName = 'ComponentNode';
