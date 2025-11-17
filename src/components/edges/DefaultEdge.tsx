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

  const edgeData = data as Record<string, unknown> | undefined;
  const strokeColor = (edgeData?.strokeColor as string) || DEFAULT_EDGE.strokeColor;
  const strokeWidth = (edgeData?.strokeWidth as number) || DEFAULT_EDGE.strokeWidth;
  const labelClass = (edgeData?.labelClass as string) || DEFAULT_EDGE.labelClass;
  const wrapperClass = (edgeData?.wrapperClass as string) || DEFAULT_EDGE.wrapperClass;

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
