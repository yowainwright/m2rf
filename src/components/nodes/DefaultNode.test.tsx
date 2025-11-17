import '../../test-setup';
import { describe, test, expect } from 'bun:test';
import { render, screen } from '@testing-library/react';
import { DefaultNode } from './DefaultNode';
import { ReactFlowWrapper } from '../../test-utils';
import type { NodeComponentProps } from '../../types/index';

describe('DefaultNode', () => {
  test('renders node with label', () => {
    const props: NodeComponentProps = {
      id: 'test-node',
      data: {
        label: 'Test Label',
        mermaidType: 'default',
      },
    };

    render(
      <ReactFlowWrapper>
        <DefaultNode {...props} />
      </ReactFlowWrapper>
    );

    const { container } = render(
      <ReactFlowWrapper>
        <DefaultNode {...props} />
      </ReactFlowWrapper>
    );
    expect(container.textContent).toContain('Test Label');
  });

  test('renders with correct structure', () => {
    const props: NodeComponentProps = {
      id: 'node-1',
      data: {
        label: 'Node Content',
        mermaidType: 'default',
      },
    };

    const { container } = render(
      <ReactFlowWrapper>
        <DefaultNode {...props} />
      </ReactFlowWrapper>
    );

    const nodeElement = container.querySelector('.m2rf-node');
    expect(nodeElement).toBeDefined();

    const labelElement = container.querySelector('.m2rf-label');
    expect(labelElement).toBeDefined();
    expect(labelElement?.textContent).toBe('Node Content');
  });

  test('renders target and source handles', () => {
    const props: NodeComponentProps = {
      id: 'node-2',
      data: {
        label: 'Handle Test',
        mermaidType: 'default',
      },
    };

    const { container } = render(
      <ReactFlowWrapper>
        <DefaultNode {...props} />
      </ReactFlowWrapper>
    );

    const targetHandle = container.querySelector('[data-handleid="node-2-target"]');
    const sourceHandle = container.querySelector('[data-handleid="node-2-source"]');

    expect(targetHandle).toBeDefined();
    expect(sourceHandle).toBeDefined();
  });

  test('applies correct CSS classes', () => {
    const props: NodeComponentProps = {
      id: 'styled-node',
      data: {
        label: 'Styled',
        mermaidType: 'default',
      },
    };

    const { container } = render(
      <ReactFlowWrapper>
        <DefaultNode {...props} />
      </ReactFlowWrapper>
    );

    const nodeElement = container.querySelector('.m2rf-node');
    expect(nodeElement?.className).toContain('px-4');
    expect(nodeElement?.className).toContain('py-3');
    expect(nodeElement?.className).toContain('min-w-[150px]');
  });

  test('renders with mermaidType in data', () => {
    const props: NodeComponentProps = {
      id: 'typed-node',
      data: {
        label: 'Custom Type',
        mermaidType: 'rectangle',
      },
    };

    render(
      <ReactFlowWrapper>
        <DefaultNode {...props} />
      </ReactFlowWrapper>
    );

    const { container } = render(
      <ReactFlowWrapper>
        <DefaultNode {...props} />
      </ReactFlowWrapper>
    );
    expect(container.textContent).toContain('Custom Type');
  });

  test('handles empty label', () => {
    const props: NodeComponentProps = {
      id: 'empty-node',
      data: {
        label: '',
        mermaidType: 'default',
      },
    };

    const { container } = render(
      <ReactFlowWrapper>
        <DefaultNode {...props} />
      </ReactFlowWrapper>
    );

    const labelElement = container.querySelector('.m2rf-label');
    expect(labelElement?.textContent).toBe('');
  });

  test('renders with additional data properties', () => {
    const props: NodeComponentProps<{ customProp: string; styles: string[] }> = {
      id: 'data-node',
      data: {
        label: 'Extra Data',
        mermaidType: 'default',
        customProp: 'custom value',
        styles: ['color:red'],
      },
    };

    render(
      <ReactFlowWrapper>
        <DefaultNode {...props} />
      </ReactFlowWrapper>
    );

    const { container } = render(
      <ReactFlowWrapper>
        <DefaultNode {...props} />
      </ReactFlowWrapper>
    );
    expect(container.textContent).toContain('Extra Data');
  });
});
