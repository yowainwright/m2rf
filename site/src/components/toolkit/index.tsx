'use client';

import { Field, FieldGroup, FieldLabel, FieldLegend, FieldSet } from '@/ui/field';
import { Input } from '@/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/ui/select';
import { Switch } from '@/ui/switch';
import {
  EDGE_ANIMATION_OPTIONS,
  EDGE_MARKER_OPTIONS,
  EDGE_TYPE_OPTIONS,
  EDGE_WIDTH_LIMITS,
  CANVAS_BACKGROUND_OPTIONS,
  NODE_BORDER_OPTIONS,
  NODE_SHADOW_OPTIONS,
  NODE_SURFACE_OPTIONS,
  TOOLKIT_LABELS,
} from './constants';
import type { CanvasToolProps, EdgeToolProps, NodeToolProps } from './types';

export const NodeTools = (props: NodeToolProps) => {
  const borders = NODE_BORDER_OPTIONS.map((option) => (
    <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
  ));
  const shadows = NODE_SHADOW_OPTIONS.map((option) => (
    <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
  ));
  const surfaces = NODE_SURFACE_OPTIONS.map((option) => (
    <SelectItem key={option.value} value={option.value}>
      <span className="flex items-center gap-2">
        <span aria-hidden="true" className="size-4 shrink-0 rounded-sm border" style={{ background: option.preview }} />
        {option.label}
      </span>
    </SelectItem>
  ));

  return (
    <FieldSet className="gap-2">
      <FieldLegend className="mb-0" variant="label">{TOOLKIT_LABELS.nodes}</FieldLegend>
      <FieldGroup className="grid grid-cols-2 gap-x-3 gap-y-2">
        <Field className="min-w-0 gap-1">
          <FieldLabel className="text-xs" htmlFor="node-fill">{TOOLKIT_LABELS.fill}</FieldLabel>
          <Input className="h-8 cursor-pointer p-0.5" id="node-fill" type="color" value={props.fillValue} onChange={props.onFillUpdate} />
        </Field>
        <Field className="min-w-0 gap-1">
          <FieldLabel className="text-xs" htmlFor="node-text">{TOOLKIT_LABELS.text}</FieldLabel>
          <Input className="h-8 cursor-pointer p-0.5" id="node-text" type="color" value={props.textValue} onChange={props.onTextUpdate} />
        </Field>
        <Field className="min-w-0 gap-1">
          <FieldLabel className="text-xs" htmlFor="node-border">{TOOLKIT_LABELS.border}</FieldLabel>
          <Select onValueChange={props.onBorderUpdate} value={props.borderValue}>
            <SelectTrigger className="h-8 px-2 text-xs" id="node-border"><SelectValue /></SelectTrigger>
            <SelectContent>{borders}</SelectContent>
          </Select>
        </Field>
        <Field className="min-w-0 gap-1">
          <FieldLabel className="text-xs" htmlFor="node-shadow">{TOOLKIT_LABELS.shadow}</FieldLabel>
          <Select onValueChange={props.onShadowUpdate} value={props.shadowValue}>
            <SelectTrigger className="h-8 px-2 text-xs" id="node-shadow"><SelectValue /></SelectTrigger>
            <SelectContent>{shadows}</SelectContent>
          </Select>
        </Field>
        <Field className="col-span-2 min-w-0 gap-1">
          <FieldLabel className="text-xs" htmlFor="node-surface">{TOOLKIT_LABELS.surface}</FieldLabel>
          <Select onValueChange={props.onSurfaceUpdate} value={props.surfaceValue}>
            <SelectTrigger className="h-8 px-2 text-xs" id="node-surface"><SelectValue /></SelectTrigger>
            <SelectContent>{surfaces}</SelectContent>
          </Select>
        </Field>
      </FieldGroup>
    </FieldSet>
  );
};

export const EdgeTools = (props: EdgeToolProps) => {
  const types = EDGE_TYPE_OPTIONS.map((option) => (
    <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
  ));
  const markers = EDGE_MARKER_OPTIONS.map((option) => (
    <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
  ));
  const animations = EDGE_ANIMATION_OPTIONS.map((option) => (
    <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
  ));

  return (
    <FieldSet className="gap-2">
      <FieldLegend className="mb-0" variant="label">{TOOLKIT_LABELS.edges}</FieldLegend>
      <FieldGroup className="@container-normal grid grid-cols-4 gap-x-3 gap-y-2">
        <Field className="min-w-0 gap-1">
          <FieldLabel className="text-xs" htmlFor="edge-type">{TOOLKIT_LABELS.type}</FieldLabel>
          <Select onValueChange={props.onTypeUpdate} value={props.typeValue}>
            <SelectTrigger className="h-8 gap-1 px-2 text-xs [&>span]:min-w-0 [&>svg]:shrink-0" id="edge-type"><SelectValue /></SelectTrigger>
            <SelectContent className="w-max whitespace-nowrap">{types}</SelectContent>
          </Select>
        </Field>
        <Field className="min-w-0 gap-1">
          <FieldLabel className="text-xs" htmlFor="edge-marker">{TOOLKIT_LABELS.marker}</FieldLabel>
          <Select onValueChange={props.onMarkerUpdate} value={props.markerValue}>
            <SelectTrigger className="h-8 gap-1 px-2 text-xs [&>span]:min-w-0 [&>svg]:shrink-0" id="edge-marker"><SelectValue /></SelectTrigger>
            <SelectContent className="w-max whitespace-nowrap">{markers}</SelectContent>
          </Select>
        </Field>
        <Field className="min-w-0 gap-1">
          <FieldLabel className="text-xs" htmlFor="edge-animation">{TOOLKIT_LABELS.animation}</FieldLabel>
          <Select onValueChange={props.onAnimationUpdate} value={props.animationValue}>
            <SelectTrigger className="h-8 gap-1 px-2 text-xs [&>span]:min-w-0 [&>svg]:shrink-0" id="edge-animation"><SelectValue /></SelectTrigger>
            <SelectContent className="w-max whitespace-nowrap">{animations}</SelectContent>
          </Select>
        </Field>
        <Field className="min-w-0 gap-1">
          <FieldLabel className="text-xs" htmlFor="edge-color">{TOOLKIT_LABELS.color}</FieldLabel>
          <Input className="h-8 cursor-pointer p-0.5" id="edge-color" onChange={props.onColorUpdate} type="color" value={props.colorValue} />
        </Field>
        <Field className="min-w-0 gap-1">
          <FieldLabel className="text-xs" htmlFor="edge-width" id="edge-width-label">{TOOLKIT_LABELS.width}</FieldLabel>
          <Input className="h-8 px-2 text-xs" id="edge-width" max={EDGE_WIDTH_LIMITS.maximum} min={EDGE_WIDTH_LIMITS.minimum} onChange={props.onWidthUpdate} step={1} type="number" value={props.widthValue} />
        </Field>
      </FieldGroup>
    </FieldSet>
  );
};

export const CanvasTools = (props: CanvasToolProps) => {
  const backgrounds = CANVAS_BACKGROUND_OPTIONS.map((option) => (
    <SelectItem key={option.value} value={option.value}>
      <span className="flex items-center gap-2">
        <span aria-hidden="true" className="size-4 shrink-0 rounded-sm border" style={{ background: option.preview, backgroundSize: '8px 8px' }} />
        {option.label}
      </span>
    </SelectItem>
  ));

  return (
    <FieldSet className="gap-2">
      <FieldLegend className="mb-0" variant="label">{TOOLKIT_LABELS.canvas}</FieldLegend>
      <FieldGroup className="grid grid-cols-2 gap-x-3 gap-y-2">
        <Field className="col-span-2 min-w-0 gap-1">
          <FieldLabel className="text-xs" htmlFor="canvas-background">{TOOLKIT_LABELS.background}</FieldLabel>
          <Select onValueChange={props.onBackgroundUpdate} value={props.settings.background}>
            <SelectTrigger className="h-8 px-2 text-xs" id="canvas-background"><SelectValue /></SelectTrigger>
            <SelectContent>{backgrounds}</SelectContent>
          </Select>
        </Field>
        <Field orientation="horizontal">
          <FieldLabel className="text-xs" htmlFor="canvas-grid">{TOOLKIT_LABELS.grid}</FieldLabel>
          <Switch checked={props.settings.gridVisible} id="canvas-grid" onCheckedChange={props.onGridUpdate} />
        </Field>
        <Field orientation="horizontal">
          <FieldLabel className="text-xs" htmlFor="canvas-snap">{TOOLKIT_LABELS.snap}</FieldLabel>
          <Switch checked={props.settings.snapToGrid} id="canvas-snap" onCheckedChange={props.onSnapUpdate} />
        </Field>
        <Field orientation="horizontal">
          <FieldLabel className="text-xs" htmlFor="canvas-lock">{TOOLKIT_LABELS.lock}</FieldLabel>
          <Switch checked={props.settings.locked} id="canvas-lock" onCheckedChange={props.onLockUpdate} title={TOOLKIT_LABELS.lockDescription} />
        </Field>
      </FieldGroup>
    </FieldSet>
  );
};
