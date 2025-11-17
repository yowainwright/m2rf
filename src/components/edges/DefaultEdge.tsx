import { memo } from 'react';
import { BaseEdge, EdgeLabelRenderer, getSmoothStepPath, type EdgeProps } from 'reactflow';
import { DEFAULT_EDGE } from '../../core/constants';

export const DefaultEdge = memo<EdgeProps>(({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  label,
  markerEnd,
  data,
}) => {
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const strokeColor = (data as any)?.strokeColor || DEFAULT_EDGE.strokeColor;
  const strokeWidth = (data as any)?.strokeWidth || DEFAULT_EDGE.strokeWidth;
  const labelClass = (data as any)?.labelClass || DEFAULT_EDGE.labelClass;
  const wrapperClass = (data as any)?.wrapperClass || DEFAULT_EDGE.wrapperClass;

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={{ stroke: strokeColor, strokeWidth }}
      />
      {label && (
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
      )}
    </>
  );
});

DefaultEdge.displayName = 'DefaultEdge';
