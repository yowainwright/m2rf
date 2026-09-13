'use client';

import { useEffect, type CSSProperties } from 'react';
import {
  BaseEdge,
  EdgeLabelRenderer,
  Handle,
  Position,
  useUpdateNodeInternals,
  type EdgeProps,
  type NodeProps,
} from 'reactflow';
import { NODE_PATTERN_SIZE, SEQUENCE_HANDLE_STYLE, SEQUENCE_RIGHT_HANDLE_STYLE } from '@/app/graph/constants';
import { createDiagonalPatternImage } from '@/app/graph';
import type {
  SequenceActionData, SequenceFrameData, SequenceMessageData, SequenceNoteData, SequenceParticipantData,
} from '@/app/graph/types';

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

export function SequenceParticipantNode({ data, id }: NodeProps<SequenceParticipantData>) {
  const updateNodeInternals = useUpdateNodeInternals();
  useEffect(() => updateNodeInternals(id), [data.handles, id, updateNodeInternals]);
  const headerStyle = getHeaderStyle(data.style);
  const lifelineStyle = { borderColor: data.style.borderColor };
  const handleStyle = SEQUENCE_HANDLE_STYLE;
  const rightHandleStyle = SEQUENCE_RIGHT_HANDLE_STYLE;
  const activationStyle = {
    backgroundColor: data.style.backgroundColor,
    borderColor: data.style.borderColor,
  };
  const activations = (data.activations || []).map((activation, index) => (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute z-0 border border-gray-400 bg-gray-100"
      key={`${activation.x}-${activation.y}-${index}`}
      style={Object.assign({}, activationStyle, {
        height: activation.height,
        left: activation.x,
        top: activation.y,
        width: activation.width,
      })}
    />
  ));
  const header = (
    <div className="flex h-16 w-full items-center justify-center rounded-sm border border-gray-200 bg-gray-100 px-3 text-center text-base font-medium text-gray-900" style={headerStyle}>
      {data.label}
    </div>
  );
  const handles = (data.handles || []).flatMap((handle) => [
    <Handle id={`${handle.id}-source-left`} key={`${handle.id}-source-left`} position={Position.Left} style={Object.assign({}, handleStyle, { top: handle.sourceY })} type="source" />,
    <Handle id={`${handle.id}-source-right`} key={`${handle.id}-source-right`} position={Position.Right} style={Object.assign({}, rightHandleStyle, { top: handle.sourceY })} type="source" />,
    <Handle id={`${handle.id}-target-left`} key={`${handle.id}-target-left`} position={Position.Left} style={Object.assign({}, handleStyle, { top: handle.targetY })} type="target" />,
    <Handle id={`${handle.id}-target-right`} key={`${handle.id}-target-right`} position={Position.Right} style={Object.assign({}, rightHandleStyle, { top: handle.targetY })} type="target" />,
  ]);

  return (
    <div className="relative h-full w-full">
      {activations}
      <div className="relative z-10">{header}</div>
      <div aria-hidden="true" className="pointer-events-none absolute bottom-16 left-1/2 top-16 border-l-2 border-gray-400" style={lifelineStyle} />
      <div className="absolute bottom-0 left-0 z-10 w-full">{header}</div>
      {handles}
    </div>
  );
}

const getMessagePath = (
  sourceX: number,
  sourceY: number,
  targetX: number,
  targetY: number,
  selfMessage: boolean
) => {
  if (!selfMessage) return `M ${sourceX},${sourceY} L ${targetX},${targetY}`;
  const controlX = Math.max(sourceX, targetX) + 48;
  const midpointY = sourceY + ((targetY - sourceY) / 2);
  return `M ${sourceX},${sourceY} C ${controlX},${sourceY} ${controlX},${midpointY} ${targetX},${targetY}`;
};

export function SequenceMessageEdge({
  data,
  interactionWidth,
  markerEnd,
  markerStart,
  sourceX,
  sourceY,
  targetX,
  targetY,
  style,
}: EdgeProps<SequenceMessageData>) {
  const path = getMessagePath(sourceX, sourceY, targetX, targetY, data?.selfMessage === true && data.segment === 'target');
  const edgeStyle = data?.dashed ? Object.assign({}, style, { strokeDasharray: '6 4' }) : style;
  const showSequenceNumber = data?.segment === 'source' && Boolean(data.sequenceNumber);
  const sequenceNumber = showSequenceNumber ? (
    <EdgeLabelRenderer>
      <div className="nodrag nopan pointer-events-none absolute" style={{ transform: `translate(-50%, -50%) translate(${sourceX}px, ${sourceY}px)` }}>
        <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-gray-700 px-1 text-xs font-semibold text-white">{data.sequenceNumber}</span>
      </div>
    </EdgeLabelRenderer>
  ) : null;

  return (
    <>
      <BaseEdge interactionWidth={interactionWidth} markerEnd={data?.markerEnd ? markerEnd : undefined} markerStart={data?.markerStart ? markerStart : undefined} path={path} style={edgeStyle} />
      {sequenceNumber}
    </>
  );
}

const actionHandleStyle = SEQUENCE_HANDLE_STYLE;

export function SequenceActionNode({ data }: NodeProps<SequenceActionData>) {
  const style = data.style;
  const title = [data.sequenceNumber, data.label].filter(Boolean).join(' ');
  return (
    <>
      <Handle id="left-target" position={Position.Left} style={actionHandleStyle} type="target" />
      <Handle id="left-source" position={Position.Left} style={actionHandleStyle} type="source" />
      <div className="flex h-full w-full -translate-y-1/2 items-end justify-center whitespace-nowrap bg-transparent px-1 pb-1 text-base text-gray-900" style={style} title={title}>{data.label}</div>
      <Handle id="right-target" position={Position.Right} style={SEQUENCE_RIGHT_HANDLE_STYLE} type="target" />
      <Handle id="right-source" position={Position.Right} style={SEQUENCE_RIGHT_HANDLE_STYLE} type="source" />
    </>
  );
}

export function SequenceNoteNode({ data }: NodeProps<SequenceNoteData>) {
  const style = data.style;
  return <div className="h-full w-full rounded-sm border border-gray-200 bg-gray-50 p-2 text-sm text-gray-900" style={style}>{data.label}</div>;
}

const getFrameStyle = (data: SequenceFrameData): CSSProperties => {
  const pattern = createDiagonalPatternImage('var(--color-gray-200)', NODE_PATTERN_SIZE);
  const patternStyle = { '--sequence-pattern': pattern } as CSSProperties;
  const fillStyle = data.fill ? { backgroundColor: data.fill, backgroundImage: 'none' } : {};
  const hasCustomFill = data.style.backgroundColor !== undefined;
  const customBackground = hasCustomFill ? { backgroundImage: 'none' } : {};
  return Object.assign({}, patternStyle, fillStyle, customBackground, data.style);
};

export function SequenceFrameNode({ data }: NodeProps<SequenceFrameData>) {
  const frameStyle = getFrameStyle(data);
  const isRegion = data.frameType === 'rect';
  const className = isRegion
    ? 'pointer-events-none relative h-full w-full border-0 bg-gray-50 bg-[image:var(--sequence-pattern)] text-gray-700'
    : 'pointer-events-none relative h-full w-full border border-dashed border-gray-400 bg-transparent text-gray-700';
  const sections = data.sections.map((section) => (
    <div className="absolute inset-x-0 border-t border-dashed border-gray-400" key={`${section.label}-${section.y}`} style={{ top: section.y, borderColor: data.style.borderColor }}>
      <span className="ml-2 bg-white/90 px-1 text-sm">{section.label}</span>
    </div>
  ));
  const title = isRegion ? null : <span className="absolute left-0 top-0 border-b border-r border-gray-300 bg-gray-100 px-2 text-sm font-medium">{data.frameType}</span>;
  const condition = data.label ? <span className="absolute left-16 right-2 top-0 text-center text-sm">{data.label}</span> : null;
  return (
    <div className={className} style={frameStyle}>
      {title}
      {condition}
      {sections}
    </div>
  );
}
