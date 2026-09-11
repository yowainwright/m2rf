import type { ChangeEventHandler } from 'react';
import type { Edge, Node } from 'reactflow';
import type { GraphCanvasSettings, GraphElements, GraphTranslationSettings, GraphVersion } from '@/graph';

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

export type NodeToolProps = {
  borderValue: GraphTranslationSettings['nodeBorder'];
  fillValue: string;
  onBorderUpdate: (value: string) => void;
  onFillUpdate: ChangeEventHandler<HTMLInputElement>;
  onShadowUpdate: (value: string) => void;
  onSurfaceUpdate: (value: string) => void;
  onTextUpdate: ChangeEventHandler<HTMLInputElement>;
  shadowValue: GraphTranslationSettings['nodeShadow'];
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
  onBackgroundUpdate: (value: string) => void;
  onGridUpdate: (checked: boolean) => void;
  onLockUpdate: (checked: boolean) => void;
  onSnapUpdate: (checked: boolean) => void;
  settings: GraphCanvasSettings;
};
