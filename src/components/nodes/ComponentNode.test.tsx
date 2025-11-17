import '../../test-setup';
import { describe, test, expect } from 'bun:test';
import { render } from '@testing-library/react';
import { ComponentNode } from './ComponentNode';
import { ReactFlowWrapper } from '../../test-utils';
import type { ComponentRegistry, NodeComponentProps } from '../../types/index';

const TestComponent = ({ id, data }: NodeComponentProps) => (
  <div data-testid="custom-component">
    Custom: {data.label}
  </div>
);

const AnotherComponent = ({ id, data }: NodeComponentProps) => (
  <div data-testid="another-component">
    Another: {id}
  </div>
);

describe('ComponentNode', () => {
  test('renders custom component when found in registry', () => {
    const components: ComponentRegistry = {
      TestComponent,
    };

    const props = {
      id: 'comp-node-1',
      data: {
        label: 'Test Label',
        mermaidType: 'default',
        componentName: 'TestComponent',
      },
      components,
    };

    const { container } = render(
      <ReactFlowWrapper>
        <ComponentNode {...props} />
      </ReactFlowWrapper>
    );

    const customComponent = container.querySelector('[data-testid="custom-component"]');
    expect(customComponent).toBeDefined();
    expect(container.textContent).toContain('Custom: Test Label');
  });

  test('returns null when componentName is missing', () => {
    const components: ComponentRegistry = {
      TestComponent,
    };

    const props = {
      id: 'comp-node-2',
      data: {
        label: 'No Component',
        mermaidType: 'default',
      },
      components,
    };

    const { container } = render(
      <ReactFlowWrapper>
        <ComponentNode {...props} />
      </ReactFlowWrapper>
    );

    const nodeElement = container.querySelector('.m2rf-node');
    expect(nodeElement).toBeNull();
  });

  test('returns null when components registry is missing', () => {
    const props = {
      id: 'comp-node-3',
      data: {
        label: 'No Registry',
        mermaidType: 'default',
        componentName: 'TestComponent',
      },
    };

    const { container } = render(
      <ReactFlowWrapper>
        <ComponentNode {...props} />
      </ReactFlowWrapper>
    );

    const nodeElement = container.querySelector('.m2rf-node');
    expect(nodeElement).toBeNull();
  });

  test('returns null and warns when component not found in registry', () => {
    const components: ComponentRegistry = {
      TestComponent,
    };

    const props = {
      id: 'comp-node-4',
      data: {
        label: 'Missing Component',
        mermaidType: 'default',
        componentName: 'NonExistent',
      },
      components,
    };

    const { container } = render(
      <ReactFlowWrapper>
        <ComponentNode {...props} />
      </ReactFlowWrapper>
    );

    const nodeElement = container.querySelector('.m2rf-node');
    expect(nodeElement).toBeNull();
  });

  test('renders with handles when component is found', () => {
    const components: ComponentRegistry = {
      TestComponent,
    };

    const props = {
      id: 'comp-node-5',
      data: {
        label: 'With Handles',
        mermaidType: 'default',
        componentName: 'TestComponent',
      },
      components,
    };

    const { container } = render(
      <ReactFlowWrapper>
        <ComponentNode {...props} />
      </ReactFlowWrapper>
    );

    const targetHandle = container.querySelector('[data-handleid="comp-node-5-target"]');
    const sourceHandle = container.querySelector('[data-handleid="comp-node-5-source"]');

    expect(targetHandle).toBeDefined();
    expect(sourceHandle).toBeDefined();
  });

  test('applies correct CSS classes to wrapper', () => {
    const components: ComponentRegistry = {
      TestComponent,
    };

    const props = {
      id: 'comp-node-6',
      data: {
        label: 'Styled Component',
        mermaidType: 'default',
        componentName: 'TestComponent',
      },
      components,
    };

    const { container } = render(
      <ReactFlowWrapper>
        <ComponentNode {...props} />
      </ReactFlowWrapper>
    );

    const nodeElement = container.querySelector('.m2rf-node');
    expect(nodeElement).toBeDefined();
    expect(nodeElement?.className).toContain('p-2');
  });

  test('passes correct props to custom component', () => {
    const components: ComponentRegistry = {
      AnotherComponent,
    };

    const props = {
      id: 'comp-node-7',
      data: {
        label: 'Props Test',
        mermaidType: 'custom',
        componentName: 'AnotherComponent',
      },
      components,
    };

    const { container } = render(
      <ReactFlowWrapper>
        <ComponentNode {...props} />
      </ReactFlowWrapper>
    );

    const anotherComponent = container.querySelector('[data-testid="another-component"]');
    expect(anotherComponent).toBeDefined();
    expect(container.textContent).toContain('Another: comp-node-7');
  });

  test('handles multiple components in registry', () => {
    const components: ComponentRegistry = {
      TestComponent,
      AnotherComponent,
    };

    const props = {
      id: 'comp-node-8',
      data: {
        label: 'Multi Registry',
        mermaidType: 'default',
        componentName: 'AnotherComponent',
      },
      components,
    };

    const { container } = render(
      <ReactFlowWrapper>
        <ComponentNode {...props} />
      </ReactFlowWrapper>
    );

    const anotherComponent = container.querySelector('[data-testid="another-component"]');
    expect(anotherComponent).toBeDefined();
  });

  test('renders with additional data properties passed to component', () => {
    const components: ComponentRegistry = {
      TestComponent,
    };

    const props = {
      id: 'comp-node-9',
      data: {
        label: 'Extra Props',
        mermaidType: 'default',
        componentName: 'TestComponent',
        customField: 'custom value',
        styles: ['color:blue'],
      },
      components,
    };

    const { container } = render(
      <ReactFlowWrapper>
        <ComponentNode {...props} />
      </ReactFlowWrapper>
    );

    const customComponent = container.querySelector('[data-testid="custom-component"]');
    expect(customComponent).toBeDefined();
  });
});
