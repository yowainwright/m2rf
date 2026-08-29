import { memo, useState, type CSSProperties, type MouseEvent } from 'react';
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  getStraightPath,
  getSmoothStepPath,
  type EdgeProps,
} from 'reactflow';
import type {
  EdgeComponentRegistry,
  M2RFAnimationType,
  M2RFEdgePathType,
} from '../../types/index';
import {
  DEFAULT_COMPONENT_EDGE,
  DEFAULT_EDGE,
  EDGE_ANIMATION_STYLES,
  EDGE_CLASS_NAMES,
  EDGE_HOVER_STROKE_WIDTH,
  EDGE_TEXT,
} from './constants';

interface ComponentEdgeProps extends EdgeProps {
  edgeComponents?: EdgeComponentRegistry;
}

type EdgeStyleOpenHandler = (edgeId: string) => void;
type EdgeStyle = CSSProperties & {
  '--m2rf-edge-stroke'?: string;
  '--m2rf-edge-width'?: number;
};
type EdgeLabelStyle = CSSProperties & {
  '--m2rf-edge-font'?: string;
  '--m2rf-edge-label-color'?: string;
};

const getEdgePath = (
  pathType: M2RFEdgePathType,
  options: EdgePathOptions
) => {
  if (pathType === 'straight') {
    return getStraightPath(options);
  }

  if (pathType === 'step') {
    return getSmoothStepPath({ ...options, borderRadius: 0 });
  }

  if (pathType === 'bezier') {
    return getBezierPath(options);
  }

  return getSmoothStepPath(options);
};

type EdgePathOptions = Parameters<typeof getSmoothStepPath>[0];

const createEdgePathOptions = (props: EdgeProps): EdgePathOptions => {
  return {
    sourceX: props.sourceX,
    sourceY: props.sourceY,
    sourcePosition: props.sourcePosition,
    targetX: props.targetX,
    targetY: props.targetY,
    targetPosition: props.targetPosition,
  };
};

const getEdgeData = (data: unknown) => {
  return data as Record<string, unknown> | undefined;
};

const getStyleOpenHandler = (edgeData?: Record<string, unknown>) => {
  return edgeData?.onStyleOpen as EdgeStyleOpenHandler | undefined;
};

const getPathType = (data: unknown): M2RFEdgePathType => {
  const edgeData = getEdgeData(data);
  const pathType = edgeData?.pathType;

  if (pathType === 'straight' || pathType === 'step' || pathType === 'bezier') {
    return pathType;
  }

  return 'smoothstep';
};

const isAnimationValue = (value: unknown): value is M2RFAnimationType => {
  return value === 'none' || value === 'pulse' || value === 'start-to-finish';
};

const getAnimation = (
  data: unknown,
  animated?: boolean
): M2RFAnimationType | undefined => {
  const edgeData = getEdgeData(data);
  const animation = edgeData?.animation;

  if (isAnimationValue(animation)) {
    return animation;
  }

  if (animated) {
    return 'start-to-finish';
  }

  return undefined;
};

const getEdgeAnimationStyle = (
  animation: M2RFAnimationType | undefined
): CSSProperties => {
  if (!animation) {
    return {};
  }

  return EDGE_ANIMATION_STYLES[animation];
};

const getEdgeStrokeColor = (edgeData?: Record<string, unknown>) => {
  const strokeColor = edgeData?.strokeColor;

  if (typeof strokeColor === 'string') {
    return strokeColor;
  }

  return undefined;
};

const getEdgeStrokeWidth = (edgeData?: Record<string, unknown>) => {
  const strokeWidth = edgeData?.strokeWidth;

  if (typeof strokeWidth === 'number') {
    return strokeWidth;
  }

  return undefined;
};

const getBaseEdgeStyle = ({
  animation,
  edgeData,
  fallbackStrokeColor,
  fallbackStrokeWidth,
}: {
  animation?: M2RFAnimationType;
  edgeData?: Record<string, unknown>;
  fallbackStrokeColor: string;
  fallbackStrokeWidth: number;
}): EdgeStyle => {
  const animationStyle = getEdgeAnimationStyle(animation);
  const stroke = `var(--m2rf-edge-stroke, ${fallbackStrokeColor})`;
  const strokeWidth = `var(--m2rf-edge-width, ${fallbackStrokeWidth})`;

  return {
    '--m2rf-edge-stroke': getEdgeStrokeColor(edgeData),
    '--m2rf-edge-width': getEdgeStrokeWidth(edgeData),
    stroke,
    strokeWidth,
    ...animationStyle,
  };
};

const getEdgeLabelStyle = (
  labelX: number,
  labelY: number,
  edgeData?: Record<string, unknown>
): EdgeLabelStyle => {
  const fontFamily = edgeData?.fontFamily as string | undefined;
  const labelColor = edgeData?.labelColor as string | undefined;
  const transform = `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`;

  return {
    '--m2rf-edge-font': fontFamily,
    '--m2rf-edge-label-color': labelColor,
    color: 'var(--m2rf-edge-label-color, #111827)',
    fontFamily: 'var(--m2rf-edge-font, inherit)',
    transform,
  };
};

const getEdgePositionStyle = (labelX: number, labelY: number) => {
  const transform = `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`;

  return { pointerEvents: 'all', position: 'absolute', transform } as const;
};

const createEdgeStyleClickHandler = ({
  id,
  onStyleOpen,
}: {
  id: string;
  onStyleOpen: EdgeStyleOpenHandler;
}) => {
  return (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    onStyleOpen(id);
  };
};

const EdgeStyleButtonElement = ({
  handleClick,
  style,
}: {
  handleClick(event: MouseEvent<HTMLButtonElement>): void;
  style: CSSProperties;
}) => (
  <button
    aria-label={EDGE_TEXT.openStyles}
    className={EDGE_CLASS_NAMES.styleButton}
    style={style}
    type="button"
    onClick={handleClick}
  >
    +
  </button>
);

const EdgeStyleButton = ({
  id,
  labelX,
  labelY,
  isVisible,
  onStyleOpen,
}: {
  id: string;
  labelX: number;
  labelY: number;
  isVisible: boolean;
  onStyleOpen?: EdgeStyleOpenHandler;
}) => {
  if (!onStyleOpen || !isVisible) {
    return null;
  }

  const handleClick = createEdgeStyleClickHandler({ id, onStyleOpen });
  const style = getEdgePositionStyle(labelX, labelY);

  return (
    <EdgeLabelRenderer>
      <EdgeStyleButtonElement handleClick={handleClick} style={style} />
    </EdgeLabelRenderer>
  );
};

const EdgeHoverPath = ({
  id,
  edgePath,
  onStyleOpen,
  setIsVisible,
}: {
  id: string;
  edgePath: string;
  onStyleOpen?: EdgeStyleOpenHandler;
  setIsVisible(value: boolean): void;
}) => {
  if (!onStyleOpen) {
    return null;
  }

  return (
    <path
      d={edgePath}
      fill="none"
      stroke="transparent"
      strokeWidth={EDGE_HOVER_STROKE_WIDTH}
      style={{ pointerEvents: 'stroke' }}
      onClick={() => onStyleOpen(id)}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    />
  );
};

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
  animated,
  data,
}) => {
  const [isStyleButtonVisible, setIsStyleButtonVisible] = useState(false);
  const props = {
    id,
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    data,
  } as EdgeProps;
  const options = createEdgePathOptions(props);
  const [edgePath, labelX, labelY] = getEdgePath(getPathType(data), options);
  const edgeData = getEdgeData(data);
  const labelClass = (edgeData?.labelClass as string) || DEFAULT_EDGE.labelClass;
  const wrapperClass = (edgeData?.wrapperClass as string) || DEFAULT_EDGE.wrapperClass;
  const labelStyle = getEdgeLabelStyle(labelX, labelY, edgeData);
  const onStyleOpen = getStyleOpenHandler(edgeData);
  const animation = getAnimation(data, animated);
  const edgeStyle = getBaseEdgeStyle({
    animation,
    edgeData,
    fallbackStrokeColor: DEFAULT_EDGE.strokeColor,
    fallbackStrokeWidth: DEFAULT_EDGE.strokeWidth,
  });

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={edgeStyle}
      />
      <EdgeHoverPath
        id={id}
        edgePath={edgePath}
        onStyleOpen={onStyleOpen}
        setIsVisible={setIsStyleButtonVisible}
      />
      <EdgeStyleButton
        id={id}
        isVisible={isStyleButtonVisible}
        labelX={labelX}
        labelY={labelY}
        onStyleOpen={onStyleOpen}
      />
      {label && (
        <EdgeLabelRenderer>
          <div
            className={`${wrapperClass} ${labelClass}`}
            style={labelStyle}
          >
            {label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
});

DefaultEdge.displayName = 'DefaultEdge';

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
  animated,
  data,
  edgeComponents,
}) => {
  const [isStyleButtonVisible, setIsStyleButtonVisible] = useState(false);
  const props = {
    id,
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    data,
  } as EdgeProps;
  const options = createEdgePathOptions(props);
  const [edgePath, labelX, labelY] = getEdgePath(getPathType(data), options);
  const edgeData = getEdgeData(data);
  const componentName = edgeData?.componentName as string | undefined;
  const UserComponent =
    componentName && edgeComponents ? edgeComponents[componentName] : null;
  const hasLabel = Boolean(label);

  const labelClass =
    (edgeData?.labelClass as string) || DEFAULT_COMPONENT_EDGE.labelClass;
  const fallbackWrapperClass = UserComponent
    ? DEFAULT_COMPONENT_EDGE.wrapperClass
    : DEFAULT_EDGE.wrapperClass;
  const wrapperClass =
    (edgeData?.wrapperClass as string) || fallbackWrapperClass;
  const labelStyle = getEdgeLabelStyle(labelX, labelY, edgeData);
  const onStyleOpen = getStyleOpenHandler(edgeData);
  const animation = getAnimation(data, animated);
  const edgeStyle = getBaseEdgeStyle({
    animation,
    edgeData,
    fallbackStrokeColor: DEFAULT_COMPONENT_EDGE.strokeColor,
    fallbackStrokeWidth: DEFAULT_COMPONENT_EDGE.strokeWidth,
  });

  if (UserComponent) {
    return (
      <>
        <BaseEdge
          id={id}
          path={edgePath}
          markerEnd={markerEnd}
          style={edgeStyle}
        />
        <EdgeHoverPath
          id={id}
          edgePath={edgePath}
          onStyleOpen={onStyleOpen}
          setIsVisible={setIsStyleButtonVisible}
        />
        <EdgeStyleButton
          id={id}
          isVisible={isStyleButtonVisible}
          labelX={labelX}
          labelY={labelY}
          onStyleOpen={onStyleOpen}
        />
        <EdgeLabelRenderer>
          <div className={wrapperClass} style={labelStyle}>
            <UserComponent
              id={id}
              label={label as string}
              source={source}
              target={target}
              data={data}
            />
          </div>
        </EdgeLabelRenderer>
      </>
    );
  }

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={edgeStyle}
      />
      <EdgeHoverPath
        id={id}
        edgePath={edgePath}
        onStyleOpen={onStyleOpen}
        setIsVisible={setIsStyleButtonVisible}
      />
      <EdgeStyleButton
        id={id}
        isVisible={isStyleButtonVisible}
        labelX={labelX}
        labelY={labelY}
        onStyleOpen={onStyleOpen}
      />
      {hasLabel && (
        <EdgeLabelRenderer>
          <div
            className={`${wrapperClass} ${labelClass}`}
            style={labelStyle}
          >
            {label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
});

ComponentEdge.displayName = 'ComponentEdge';
