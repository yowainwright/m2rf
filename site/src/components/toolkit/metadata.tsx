'use client';

import { Field, FieldDescription, FieldGroup, FieldLegend, FieldSet, FieldTitle } from '@/ui/field';
import { TOOLKIT_DATE_OPTIONS, TOOLKIT_METADATA_LABELS as LABELS } from './constants';
import type { EdgeMetadataProps, MetadataFieldsProps, NodeMetadataProps, ToolkitMetadataProps } from './types';

function MetadataFields({ fields }: MetadataFieldsProps) {
  const items = fields.map(({ label, value, hideLabel }) => {
    const text = String(value);
    const caption = hideLabel ? null : (
      <FieldTitle className="shrink-0 text-xs font-normal text-muted-foreground">{label}</FieldTitle>
    );
    return (
      <Field aria-label={label} className="w-auto min-w-0 max-w-full gap-1" key={label} orientation="horizontal">
        {caption}
        <FieldDescription className="min-w-0 truncate text-xs leading-4 text-foreground" title={text}>{text}</FieldDescription>
      </Field>
    );
  });
  return <FieldGroup className="flex-row flex-wrap gap-x-3 gap-y-0.5">{items}</FieldGroup>;
}

function GlobalMetadata({ elements, version, workspaceName }: ToolkitMetadataProps) {
  const versionNumber = version ? `v${version.version}` : LABELS.unsaved;
  const saved = version
    ? new Date(version.updatedAt).toLocaleString(undefined, TOOLKIT_DATE_OPTIONS)
    : null;
  const savedFields = saved ? [{ label: LABELS.saved, value: saved, hideLabel: true }] : [];
  const summaryFields: MetadataFieldsProps['fields'] = [
    { label: LABELS.name, value: workspaceName, hideLabel: true },
    { label: LABELS.version, value: versionNumber, hideLabel: true },
  ];
  const fields = summaryFields.concat(savedFields, [
    { label: LABELS.nodes, value: elements.nodes.length },
    { label: LABELS.edges, value: elements.edges.length },
  ]);
  return <MetadataFields fields={fields} />;
}

function NodeMetadata({ node }: NodeMetadataProps) {
  const label = typeof node.data.label === 'string' ? node.data.label : LABELS.unlabeled;
  const fields = [
    { label: LABELS.label, value: label, hideLabel: true },
    { label: LABELS.id, value: node.id },
  ];
  return <MetadataFields fields={fields} />;
}

function EdgeMetadata({ edge }: EdgeMetadataProps) {
  const edgeLabel = edge.label;
  const hasLabel = typeof edgeLabel === 'string' && edgeLabel.length > 0;
  const label = hasLabel ? edgeLabel : LABELS.unlabeled;
  const fields = [
    { label: LABELS.label, value: label, hideLabel: true },
    { label: LABELS.id, value: edge.id },
    { label: LABELS.from, value: edge.source },
    { label: LABELS.to, value: edge.target },
  ];
  return <MetadataFields fields={fields} />;
}

function ToolkitDetails(props: ToolkitMetadataProps) {
  const nodeCount = props.selectedNodeIds.length;
  const edgeCount = props.selectedEdgeIds.length;
  const isGlobal = nodeCount === 0 && edgeCount === 0;
  if (isGlobal) return <GlobalMetadata {...props} />;
  const node = props.elements.nodes.find((item) => item.id === props.selectedNodeIds[0]);
  const edge = props.elements.edges.find((item) => item.id === props.selectedEdgeIds[0]);
  const hasOnlyOneNode = nodeCount === 1 && edgeCount === 0;
  const hasOnlyOneEdge = edgeCount === 1 && nodeCount === 0;
  const isSingleNode = hasOnlyOneNode && node !== undefined;
  const isSingleEdge = hasOnlyOneEdge && edge !== undefined;
  if (isSingleNode) return <NodeMetadata node={node} />;
  if (isSingleEdge) return <EdgeMetadata edge={edge} />;
  const fields = [
    { label: LABELS.nodes, value: nodeCount },
    { label: LABELS.edges, value: edgeCount },
  ];
  return <MetadataFields fields={fields} />;
}

export function ToolkitMetadata(props: ToolkitMetadataProps) {
  return (
    <FieldSet className="gap-1">
      <FieldLegend className="mb-0 data-[variant=label]:text-xs" variant="label">{props.scope}</FieldLegend>
      <ToolkitDetails {...props} />
    </FieldSet>
  );
}
