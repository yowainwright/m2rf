import { toPng, toSvg } from 'html-to-image';
import {
  GRAPH_EXPORT_SELECTOR,
  PNG_FILE_EXTENSION,
  SVG_FILE_EXTENSION,
  SVG_FILE_FALLBACK_NAME,
} from './constants';
import type {
  PngExportInput,
  PngExportResult,
  SvgExportInput,
  SvgExportResult,
} from './types';

const invalidFileNamePattern = /[^a-z0-9-_]+/gi;
const duplicateDashPattern = /-+/g;

const getSafeFileStem = (name: string) => {
  const stem = name
    .trim()
    .replace(invalidFileNamePattern, '-')
    .replace(duplicateDashPattern, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();

  return stem || SVG_FILE_FALLBACK_NAME;
};

const createFileName = (name: string, extension: string) => {
  return `${getSafeFileStem(name)}.${extension}`;
};

const shouldExportNode = (node: Node) => {
  if (!(node instanceof Element)) {
    return true;
  }

  return node.closest('[data-m2rf-export-ignore="true"]') === null;
};

const downloadDataUrl = (dataUrl: string, fileName: string) => {
  const link = document.createElement('a');

  link.download = fileName;
  link.href = dataUrl;
  link.rel = 'noopener';
  link.click();
};

const toSvgDataUrl = async (element: HTMLElement) => {
  return toSvg(element, {
    cacheBust: true,
    filter: shouldExportNode,
  });
};

const toPngDataUrl = async (element: HTMLElement) => {
  return toPng(element, {
    cacheBust: true,
    filter: shouldExportNode,
  });
};

export const getSvgExportElement = () => {
  return document.querySelector<HTMLElement>(GRAPH_EXPORT_SELECTOR);
};

export const getPngExportElement = getSvgExportElement;

export const exportPng = async (
  input: PngExportInput
): Promise<PngExportResult> => {
  const fileName = createFileName(input.name, PNG_FILE_EXTENSION);
  const dataUrl = await toPngDataUrl(input.element);

  downloadDataUrl(dataUrl, fileName);

  return { fileName };
};

export const exportSvg = async (
  input: SvgExportInput
): Promise<SvgExportResult> => {
  const fileName = createFileName(input.name, SVG_FILE_EXTENSION);
  const dataUrl = await toSvgDataUrl(input.element);

  downloadDataUrl(dataUrl, fileName);

  return { fileName };
};
