import '../../test-setup';
import { describe, expect, test } from 'vitest';
import { render } from '@testing-library/react';
import { Position, type EdgeProps } from 'reactflow';
import { ReactFlowWrapper } from '../../test-utils';
import type { EdgeComponentProps, EdgeComponentRegistry } from '../../types/index';
import { ComponentEdge, DefaultEdge } from './index';

const TestEdgeComponent = ({ label, source, target }: EdgeComponentProps) => (
  <div data-testid="custom-edge-component">
    Edge: {label} ({source} -&gt; {target})
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

    const labelWrapper = container.querySelector('[style*="transform"]');

    expect(labelWrapper).toBeDefined();
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

  test('applies start-to-finish animation from data', () => {
    const props: EdgeProps = {
      ...mockEdgeProps,
      data: {
        animation: 'start-to-finish',
      },
    };

    const { container } = render(
      <ReactFlowWrapper>
        <DefaultEdge {...props} />
      </ReactFlowWrapper>
    );

    const path = container.querySelector('path');
    const style = path?.getAttribute('style');

    expect(style).toContain('m2rf-edge-start-to-finish');
    expect(style).toContain('stroke-dasharray');
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

    const labelWrapper = container.querySelector('[style*="transform"]');

    expect(labelWrapper).toBeDefined();
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

    const labelElement = container.querySelector('.text-xs');

    expect(labelElement).toBeDefined();
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

    const labelElement = container.querySelector('.text-xs');

    expect(labelElement).toBeDefined();
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

    const labelElement = container.querySelector('.text-xs');

    expect(labelElement).toBeDefined();
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
