import '../../test-setup';
import { describe, test, expect } from 'bun:test';
import { render } from '@testing-library/react';
import { Position } from 'reactflow';
import { DefaultEdge } from './DefaultEdge';
import { ReactFlowWrapper } from '../../test-utils';
import type { EdgeProps } from 'reactflow';

const mockEdgeProps: EdgeProps = {
  id: 'edge-1',
  source: 'A',
  target: 'B',
  sourceX: 100,
  sourceY: 100,
  targetX: 200,
  targetY: 200,
  sourcePosition: Position.Right,
  targetPosition: Position.Left,
};

describe('DefaultEdge', () => {
  test('renders edge without label', () => {
    const { container } = render(
      <ReactFlowWrapper>
        <DefaultEdge {...mockEdgeProps} />
      </ReactFlowWrapper>
    );

    const baseEdge = container.querySelector('path');
    expect(baseEdge).toBeDefined();
  });

  test('renders edge with label', () => {
    const props: EdgeProps = {
      ...mockEdgeProps,
      label: 'Test Label',
    };

    const { container } = render(
      <ReactFlowWrapper>
        <DefaultEdge {...props} />
      </ReactFlowWrapper>
    );

  });

  test('applies default stroke color when not provided', () => {
    const { container } = render(
      <ReactFlowWrapper>
        <DefaultEdge {...mockEdgeProps} />
      </ReactFlowWrapper>
    );

    const path = container.querySelector('path');
    const style = path?.getAttribute('style');

    expect(style).toContain('stroke');
  });

  test('applies custom stroke color from data', () => {
    const props: EdgeProps = {
      ...mockEdgeProps,
      data: {
        strokeColor: '#ff0000',
      },
    };

    const { container } = render(
      <ReactFlowWrapper>
        <DefaultEdge {...props} />
      </ReactFlowWrapper>
    );

    const path = container.querySelector('path');
    const style = path?.getAttribute('style');

    expect(style).toContain('#ff0000');
  });

  test('applies custom stroke width from data', () => {
    const props: EdgeProps = {
      ...mockEdgeProps,
      data: {
        strokeWidth: 5,
      },
    };

    const { container } = render(
      <ReactFlowWrapper>
        <DefaultEdge {...props} />
      </ReactFlowWrapper>
    );

    const path = container.querySelector('path');
    const style = path?.getAttribute('style');

    expect(style).toContain('stroke-width');
  });

  test('applies custom label class from data', () => {
    const props: EdgeProps = {
      ...mockEdgeProps,
      label: 'Custom Label',
      data: {
        labelClass: 'custom-label-class',
      },
    };

    const { container } = render(
      <ReactFlowWrapper>
        <DefaultEdge {...props} />
      </ReactFlowWrapper>
    );

    const labelElement = container.querySelector('.custom-label-class');
    expect(labelElement).toBeDefined();
  });

  test('applies custom wrapper class from data', () => {
    const props: EdgeProps = {
      ...mockEdgeProps,
      label: 'Wrapper Test',
      data: {
        wrapperClass: 'custom-wrapper-class',
      },
    };

    const { container } = render(
      <ReactFlowWrapper>
        <DefaultEdge {...props} />
      </ReactFlowWrapper>
    );

    const wrapperElement = container.querySelector('.custom-wrapper-class');
    expect(wrapperElement).toBeDefined();
  });

  test('applies default classes when data not provided', () => {
    const props: EdgeProps = {
      ...mockEdgeProps,
      label: 'Default Classes',
    };

    const { container } = render(
      <ReactFlowWrapper>
        <DefaultEdge {...props} />
      </ReactFlowWrapper>
    );

    const labelElement = container.querySelector('.text-xs');
    expect(labelElement).toBeDefined();
  });

  test('renders with marker end', () => {
    const props: EdgeProps = {
      ...mockEdgeProps,
      markerEnd: 'url(#arrow)',
    };

    const { container } = render(
      <ReactFlowWrapper>
        <DefaultEdge {...props} />
      </ReactFlowWrapper>
    );

    const path = container.querySelector('path');
    expect(path?.getAttribute('marker-end')).toBe('url(#arrow)');
  });

  test('handles empty data object', () => {
    const props: EdgeProps = {
      ...mockEdgeProps,
      data: {},
      label: 'Empty Data',
    };

    const { container } = render(
      <ReactFlowWrapper>
        <DefaultEdge {...props} />
      </ReactFlowWrapper>
    );

  });

  test('renders label with transform positioning', () => {
    const props: EdgeProps = {
      ...mockEdgeProps,
      label: 'Positioned Label',
    };

    const { container } = render(
      <ReactFlowWrapper>
        <DefaultEdge {...props} />
      </ReactFlowWrapper>
    );

    const labelWrapper = container.querySelector('[style*="transform"]');
    expect(labelWrapper).toBeDefined();
  });

  test('combines custom and default classes', () => {
    const props: EdgeProps = {
      ...mockEdgeProps,
      label: 'Combined Classes',
      data: {
        wrapperClass: 'custom-wrapper',
        labelClass: 'custom-label',
      },
    };

    const { container } = render(
      <ReactFlowWrapper>
        <DefaultEdge {...props} />
      </ReactFlowWrapper>
    );

    const element = container.querySelector('.custom-wrapper.custom-label');
    expect(element).toBeDefined();
  });
});
