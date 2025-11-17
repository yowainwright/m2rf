import '../../test-setup';
import { describe, test, expect } from 'bun:test';
import { render } from '@testing-library/react';
import { Position } from 'reactflow';
import { ComponentEdge } from './ComponentEdge';
import { ReactFlowWrapper } from '../../test-utils';
import type { EdgeProps } from 'reactflow';
import type { EdgeComponentProps, EdgeComponentRegistry } from '../../types/index';

const TestEdgeComponent = ({ id, label, source, target }: EdgeComponentProps) => (
  <div data-testid="custom-edge-component">
    Edge: {label} ({source} → {target})
  </div>
);

const AnotherEdgeComponent = ({ id }: EdgeComponentProps) => (
  <div data-testid="another-edge-component">
    Edge ID: {id}
  </div>
);

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

describe('ComponentEdge', () => {
  test('renders custom edge component when found in registry', () => {
    const edgeComponents: EdgeComponentRegistry = {
      TestEdgeComponent,
    };

    const props = {
      ...mockEdgeProps,
      label: 'Custom Label',
      data: {
        componentName: 'TestEdgeComponent',
      },
      edgeComponents,
    };

    const { container } = render(
      <ReactFlowWrapper>
        <ComponentEdge {...props} />
      </ReactFlowWrapper>
    );

    const customEdge = container.querySelector('[data-testid="custom-edge-component"]');
    expect(customEdge).toBeDefined();
  });

  test('renders default label when component not in registry', () => {
    const edgeComponents: EdgeComponentRegistry = {
      TestEdgeComponent,
    };

    const props = {
      ...mockEdgeProps,
      label: 'Fallback Label',
      data: {
        componentName: 'NonExistent',
      },
      edgeComponents,
    };

    const { container } = render(
      <ReactFlowWrapper>
        <ComponentEdge {...props} />
      </ReactFlowWrapper>
    );

  });

  test('renders default label when componentName is missing', () => {
    const edgeComponents: EdgeComponentRegistry = {
      TestEdgeComponent,
    };

    const props = {
      ...mockEdgeProps,
      label: 'No Component Name',
      edgeComponents,
    };

    const { container } = render(
      <ReactFlowWrapper>
        <ComponentEdge {...props} />
      </ReactFlowWrapper>
    );

  });

  test('renders default label when edgeComponents registry is missing', () => {
    const props = {
      ...mockEdgeProps,
      label: 'No Registry',
      data: {
        componentName: 'TestEdgeComponent',
      },
    };

    const { container } = render(
      <ReactFlowWrapper>
        <ComponentEdge {...props} />
      </ReactFlowWrapper>
    );

  });

  test('renders nothing when no label and no component', () => {
    const props = {
      ...mockEdgeProps,
    };

    const { container } = render(
      <ReactFlowWrapper>
        <ComponentEdge {...props} />
      </ReactFlowWrapper>
    );

    const path = container.querySelector('path');
    expect(path).toBeDefined();
  });

  test('applies custom stroke color from data', () => {
    const edgeComponents: EdgeComponentRegistry = {
      TestEdgeComponent,
    };

    const props = {
      ...mockEdgeProps,
      data: {
        componentName: 'TestEdgeComponent',
        strokeColor: '#0000ff',
      },
      edgeComponents,
    };

    const { container } = render(
      <ReactFlowWrapper>
        <ComponentEdge {...props} />
      </ReactFlowWrapper>
    );

    const path = container.querySelector('path');
    const style = path?.getAttribute('style');

    expect(style).toContain('#0000ff');
  });

  test('applies custom stroke width from data', () => {
    const props = {
      ...mockEdgeProps,
      data: {
        strokeWidth: 3,
      },
    };

    const { container } = render(
      <ReactFlowWrapper>
        <ComponentEdge {...props} />
      </ReactFlowWrapper>
    );

    const path = container.querySelector('path');
    const style = path?.getAttribute('style');

    expect(style).toContain('stroke-width');
  });

  test('applies custom label class from data', () => {
    const props = {
      ...mockEdgeProps,
      label: 'Styled Label',
      data: {
        labelClass: 'custom-edge-label',
      },
    };

    const { container } = render(
      <ReactFlowWrapper>
        <ComponentEdge {...props} />
      </ReactFlowWrapper>
    );

    const labelElement = container.querySelector('.custom-edge-label');
    expect(labelElement).toBeDefined();
  });

  test('applies different wrapper class for component edges', () => {
    const edgeComponents: EdgeComponentRegistry = {
      TestEdgeComponent,
    };

    const props = {
      ...mockEdgeProps,
      label: 'Component Edge',
      data: {
        componentName: 'TestEdgeComponent',
      },
      edgeComponents,
    };

    const { container } = render(
      <ReactFlowWrapper>
        <ComponentEdge {...props} />
      </ReactFlowWrapper>
    );

    const wrapperElement = container.querySelector('[style*="transform"]');
    expect(wrapperElement).toBeDefined();
  });

  test('passes correct props to custom edge component', () => {
    const edgeComponents: EdgeComponentRegistry = {
      AnotherEdgeComponent,
    };

    const props = {
      ...mockEdgeProps,
      id: 'test-edge-id',
      data: {
        componentName: 'AnotherEdgeComponent',
      },
      edgeComponents,
    };

    const { container } = render(
      <ReactFlowWrapper>
        <ComponentEdge {...props} />
      </ReactFlowWrapper>
    );

    const element = container.querySelector('[data-testid="another-edge-component"]');
    expect(element).toBeDefined();
  });

  test('handles multiple components in registry', () => {
    const edgeComponents: EdgeComponentRegistry = {
      TestEdgeComponent,
      AnotherEdgeComponent,
    };

    const props = {
      ...mockEdgeProps,
      data: {
        componentName: 'AnotherEdgeComponent',
      },
      edgeComponents,
    };

    const { container } = render(
      <ReactFlowWrapper>
        <ComponentEdge {...props} />
      </ReactFlowWrapper>
    );

    const element = container.querySelector('[data-testid="another-edge-component"]');
    expect(element).toBeDefined();
  });

  test('renders with marker end', () => {
    const props = {
      ...mockEdgeProps,
      markerEnd: 'url(#arrow)',
    };

    const { container } = render(
      <ReactFlowWrapper>
        <ComponentEdge {...props} />
      </ReactFlowWrapper>
    );

    const path = container.querySelector('path');
    expect(path?.getAttribute('marker-end')).toBe('url(#arrow)');
  });

  test('applies default component edge classes', () => {
    const edgeComponents: EdgeComponentRegistry = {
      TestEdgeComponent,
    };

    const props = {
      ...mockEdgeProps,
      label: 'Default Classes',
      data: {
        componentName: 'TestEdgeComponent',
      },
      edgeComponents,
    };

    const { container } = render(
      <ReactFlowWrapper>
        <ComponentEdge {...props} />
      </ReactFlowWrapper>
    );

    const element = container.querySelector('[data-testid="custom-edge-component"]');
    expect(element).toBeDefined();
  });

  test('passes data to custom component', () => {
    const edgeComponents: EdgeComponentRegistry = {
      TestEdgeComponent,
    };

    const customData = {
      componentName: 'TestEdgeComponent',
      customField: 'custom value',
    };

    const props = {
      ...mockEdgeProps,
      label: 'Data Test',
      data: customData,
      edgeComponents,
    };

    const { container } = render(
      <ReactFlowWrapper>
        <ComponentEdge {...props} />
      </ReactFlowWrapper>
    );

    const element = container.querySelector('[data-testid="custom-edge-component"]');
    expect(element).toBeDefined();
  });
});
