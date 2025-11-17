import { memo } from 'react';
import { BaseEdge, EdgeLabelRenderer, getSmoothStepPath, type EdgeProps } from 'reactflow';
import type { EdgeComponentRegistry } from '../../types/index';
import { DEFAULT_EDGE, DEFAULT_COMPONENT_EDGE } from '../../core/constants';

interface ComponentEdgeProps extends EdgeProps {
  edgeComponents?: EdgeComponentRegistry;
}

export const ComponentEdge = memo<ComponentEdgeProps>(({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  source,
  target,
  label,
  markerEnd,
  data,
  edgeComponents,
}) => {
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const componentName = data?.componentName;
  const UserComponent = componentName && edgeComponents ? edgeComponents[componentName] : null;

  const strokeColor = (data as any)?.strokeColor || DEFAULT_COMPONENT_EDGE.strokeColor;
  const strokeWidth = (data as any)?.strokeWidth || DEFAULT_COMPONENT_EDGE.strokeWidth;
  const labelClass = (data as any)?.labelClass || DEFAULT_COMPONENT_EDGE.labelClass;
  const wrapperClass = (data as any)?.wrapperClass || (UserComponent ? DEFAULT_COMPONENT_EDGE.wrapperClass : DEFAULT_EDGE.wrapperClass);

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={{ stroke: strokeColor, strokeWidth }}
      />
      {UserComponent ? (
        <EdgeLabelRenderer>
          <div
            className={wrapperClass}
            style={{
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            }}
          >
            <UserComponent
              id={id}
              label={label as string}
              source={source}
              target={target}
              data={data}
            />
          </div>
        </EdgeLabelRenderer>
      ) : label ? (
        <EdgeLabelRenderer>
          <div
            className={`${wrapperClass} ${labelClass}`}
            style={{
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            }}
          >
            {label}
          </div>
        </EdgeLabelRenderer>
      ) : null}
    </>
  );
});

ComponentEdge.displayName = 'ComponentEdge';
