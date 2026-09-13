'use client';

import type { CSSProperties } from 'react';
import {
  BaseEdge,
  EdgeLabelRenderer,
  Handle,
  Position,
  type EdgeProps,
  type NodeProps,
} from 'reactflow';

type SequenceParticipantData = {
  label: string;
  style: CSSProperties;
};

type SequenceMessageData = {
  dashed: boolean;
  messageY: number;
};

const getMessageStyle = (style: CSSProperties | undefined, dashed: boolean) => {
  if (!dashed) return style;
  return Object.assign({}, style, { strokeDasharray: '6 4' });
};

const getMessageLabelX = (sourceX: number, targetX: number) => {
  if (sourceX === targetX) return sourceX + 42;
  const midpoint = sourceX + targetX;
  return midpoint / 2;
};

const createMessageLabel = (label: EdgeProps<SequenceMessageData>['label'], labelStyle: CSSProperties) => {
  const hasLabel = typeof label === 'string' && label.length > 0;
  if (!hasLabel) return null;
  return (
    <EdgeLabelRenderer>
      <div className="nodrag nopan pointer-events-none absolute rounded-sm bg-background px-1 text-xs text-foreground" style={labelStyle}>
        {label}
      </div>
    </EdgeLabelRenderer>
  );
};

const getHeaderStyle = (style: CSSProperties | undefined): CSSProperties => ({
  backgroundColor: style?.backgroundColor,
  backgroundImage: style?.backgroundImage,
  backgroundSize: style?.backgroundSize,
  borderColor: style?.borderColor,
  borderRadius: style?.borderRadius,
  borderStyle: style?.borderStyle,
  borderWidth: style?.borderWidth,
  boxShadow: style?.boxShadow,
  clipPath: style?.clipPath,
  color: style?.color,
  fontFamily: style?.fontFamily,
});

export function SequenceParticipantNode({ data }: NodeProps<SequenceParticipantData>) {
  const headerStyle = getHeaderStyle(data.style);
  const lifelineStyle = { borderColor: data.style.borderColor };
  const handleStyle = { opacity: 0, pointerEvents: 'none' as const };
  const header = (
    <div className="flex h-16 w-full items-center justify-center px-3 text-center text-sm font-medium" style={headerStyle}>
      {data.label}
    </div>
  );

  return (
    <div className="relative h-full w-full">
      <div className="relative z-10">{header}</div>
      <div aria-hidden="true" className="pointer-events-none absolute bottom-16 left-1/2 top-16 border-l-2 border-dashed" style={lifelineStyle} />
      <div className="absolute bottom-0 left-0 z-10 w-full">{header}</div>
      <Handle id="sequence-target" position={Position.Bottom} style={handleStyle} type="target" />
      <Handle id="sequence-source" position={Position.Bottom} style={handleStyle} type="source" />
    </div>
  );
}

const getMessagePath = (sourceX: number, targetX: number, messageY: number) => {
  const isSelfMessage = sourceX === targetX;
  if (!isSelfMessage) return `M ${sourceX},${messageY} L ${targetX},${messageY}`;
  const controlX = sourceX + 64;
  const firstControlY = messageY - 20;
  const secondControlY = messageY + 20;
  const endY = messageY + 36;
  return `M ${sourceX},${messageY} C ${controlX},${firstControlY} ${controlX},${secondControlY} ${sourceX},${endY}`;
};

export function SequenceMessageEdge({
  data,
  interactionWidth,
  label,
  markerEnd,
  markerStart,
  sourceX,
  targetX,
  style,
}: EdgeProps<SequenceMessageData>) {
  const messageY = data?.messageY || 0;
  const path = getMessagePath(sourceX, targetX, messageY);
  const edgeStyle = getMessageStyle(style, data?.dashed === true);
  const labelX = getMessageLabelX(sourceX, targetX);
  const labelStyle = {
    transform: `translate(-50%, -100%) translate(${labelX}px, ${messageY - 6}px)`,
  };
  const messageLabel = createMessageLabel(label, labelStyle);

  return (
    <>
      <BaseEdge
        interactionWidth={interactionWidth}
        markerEnd={markerEnd}
        markerStart={markerStart}
        path={path}
        style={edgeStyle}
      />
      {messageLabel}
    </>
  );
}
