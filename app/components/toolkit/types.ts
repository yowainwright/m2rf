import type { ChangeEvent, ChangeEventHandler } from 'react';
import type { Edge, Node } from 'reactflow';
import type {
  CanvasBackground, GraphCanvasSettings, GraphElements, GraphGradientSettings, GraphPatternSettings, GraphShaderSettings, GraphTranslationSettings, GraphVersion,
} from '@/app/graph';

export type ToolkitMetadataProps = {
  elements: GraphElements;
  scope: string;
  selectedEdgeIds: string[];
  selectedNodeIds: string[];
  version?: GraphVersion;
  workspaceName: string;
};
export type MetadataFieldsProps = {
  fields: Array<{ label: string; value: string | number; hideLabel?: boolean }>;
};
export type NodeMetadataProps = { node: Node };
export type EdgeMetadataProps = { edge: Edge };

export type GradientToolsProps = {
  gradient: GraphGradientSettings;
  idPrefix: string;
  onUpdate: (gradient: GraphGradientSettings) => void;
};
export type PatternToolsProps = {
  idPrefix: string;
  onUpdate: (pattern: GraphPatternSettings) => void;
  pattern: GraphPatternSettings;
};
export type ShaderToolsProps = {
  background: CanvasBackground;
  onUpdate: (shader: GraphShaderSettings) => void;
  shader: GraphShaderSettings;
};
export type ShaderColorKey = 'colorA' | 'colorB' | 'colorC';
export type ShaderColorFieldProps = {
  id: string;
  label: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  value: string;
};

export type NodeToolProps = {
  borderValue: GraphTranslationSettings['nodeBorder'];
  fillValue: string;
  gradient: GraphGradientSettings;
  onBorderUpdate: (value: string) => void;
  onFillUpdate: ChangeEventHandler<HTMLInputElement>;
  onGradientUpdate: (gradient: GraphGradientSettings) => void;
  onShapeUpdate: (value: string) => void;
  onShadowUpdate: (value: string) => void;
  onSurfaceUpdate: (value: string) => void;
  onTextUpdate: ChangeEventHandler<HTMLInputElement>;
  shadowValue: GraphTranslationSettings['nodeShadow'];
  shapeValue: GraphTranslationSettings['nodeShape'];
  surfaceValue: GraphTranslationSettings['nodeSurface'];
  textValue: string;
};
export type EdgeToolProps = {
  animationValue: GraphTranslationSettings['edgeAnimation'];
  colorValue: string;
  markerValue: GraphTranslationSettings['edgeMarker'];
  onAnimationUpdate: (value: string) => void;
  onColorUpdate: ChangeEventHandler<HTMLInputElement>;
  onMarkerUpdate: (value: string) => void;
  onTypeUpdate: (value: string) => void;
  onWidthUpdate: ChangeEventHandler<HTMLInputElement>;
  typeValue: GraphTranslationSettings['edgeType'];
  widthValue: number;
};
export type CanvasToolProps = {
  gradient: GraphGradientSettings;
  onPatternUpdate: (pattern: GraphPatternSettings) => void;
  onShaderUpdate: (shader: GraphShaderSettings) => void;
  onGradientUpdate: (gradient: GraphGradientSettings) => void;
  onBackgroundUpdate: (value: string) => void;
  onGridUpdate: (checked: boolean) => void;
  onLockUpdate: (checked: boolean) => void;
  onSnapUpdate: (checked: boolean) => void;
  settings: GraphCanvasSettings;
  pattern: GraphPatternSettings;
  shader: GraphShaderSettings;
};
