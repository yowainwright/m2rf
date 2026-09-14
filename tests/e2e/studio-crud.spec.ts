import { expect, test, type Locator, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';

const source = `flowchart LR
  Alpha[Write Mermaid] --> Beta[Build graph]
  Beta --> Gamma[React Flow preview]
`;
const sequenceSource = `sequenceDiagram
  participant A as Alice
  participant B as Bob
  A->>B: Hello
  B-->>A: Hi
  A->>A: Think
`;
const reactFlowTypeMapWarning = 'created a new nodeTypes or edgeTypes object';

const clearIndexedDb = async (page: Page) => {
  await page.evaluate(async () => {
    const databases = await indexedDB.databases();

    await Promise.allSettled(
      databases.map((database) => {
        if (!database.name) {
          return Promise.resolve();
        }

        return new Promise<void>((resolve, reject) => {
          const request = indexedDB.deleteDatabase(database.name || '');

          request.onerror = () => reject(request.error);
          request.onsuccess = () => resolve();
        });
      })
    );
  });
};

const updateEditor = async (page: Page, content = source) => {
  const editor = page.locator('.cm-content');

  await editor.click();
  await page.keyboard.press('Meta+A');
  await page.keyboard.insertText(content);
};

const setColorInput = async (
  locator: Locator,
  value: string
) => {
  await locator.evaluate((element, color) => {
    const input = element as HTMLInputElement;
    const descriptor = Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      'value'
    );

    descriptor?.set?.call(input, color);
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  }, value);
};

const getBounds = async (locator: Locator) => {
  const bounds = await locator.boundingBox();
  expect(bounds).not.toBeNull();
  return bounds!;
};

const selectDownload = async (page: Page, name: string) => {
  await page.getByRole('button', { name: 'Download', exact: true }).click();
  await page.getByRole('menuitem', { name, exact: true }).click();
};

const selectMarker = async (page: Page, name: string) => {
  await page.getByRole('combobox', { name: 'Marker', exact: true }).click();
  await page.getByRole('option', { name, exact: true }).click();
};

const openToolkit = async (page: Page) => {
  const background = page.getByRole('combobox', { name: 'Background', exact: true });
  const isOpen = await background.isVisible();
  if (!isOpen) await page.getByRole('button', { name: 'Toolkit: Global', exact: true }).click();
  await expect(background).toBeVisible();
};

const readMarker = (edge: Locator) => {
  return edge.locator('.react-flow__edge-path').evaluate((path) => {
    const reference = path.getAttribute('marker-end') || '';
    const id = reference.match(/#([^'")]+)/)?.[1];
    const marker = id ? document.getElementById(id) : null;
    const shape = marker?.querySelector('polyline');
    if (!shape) {
      return null;
    }

    const { fill, stroke } = getComputedStyle(shape);
    return { fill, stroke };
  });
};

const versionSource = (version: number) => {
  return `flowchart LR\n  A[Snapshot ${version}] --> B[Saved graph]`;
};

const saveSnapshot = async (page: Page, version: number) => {
  await page.getByRole('button', { name: /^(Save|Saved)$/ }).click();
  const history = page.getByRole('region', { name: 'Version history' });
  await expect(history.getByRole('button', { name: new RegExp(`^v${version}\\b`) })).toHaveAttribute('aria-pressed', 'true');
};

const editSnapshot = async (page: Page, version: number) => {
  await updateEditor(page, versionSource(version));
  await expect(page.locator('.react-flow__node').filter({ hasText: `Snapshot ${version}` })).toBeVisible();
};

test('restores version styling and saves the oldest as newest while keeping five', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await editSnapshot(page, 1);
  await page.getByRole('textbox', { name: 'Graph name' }).fill('Versioned diagram');
  await page.getByRole('button', { name: 'Toolkit: Global' }).click();
  await setColorInput(page.getByLabel('Fill'), '#ef4444');
  await page.keyboard.press('Escape');
  await saveSnapshot(page, 1);
  const history = page.getByRole('region', { name: 'Version history' });
  const workspaceButton = page.getByRole('button', { name: 'Versioned diagram' });
  await expect(history).toBeVisible();
  await expect(workspaceButton).toHaveAttribute('aria-expanded', 'true');
  await workspaceButton.click();
  await expect(history).not.toBeVisible();
  await expect(workspaceButton).toHaveAttribute('aria-expanded', 'false');
  await workspaceButton.click();
  await expect(history).toBeVisible();
  const viewport = page.locator('.react-flow__viewport');
  const firstCamera = await viewport.evaluate((element) => getComputedStyle(element).transform);

  await editSnapshot(page, 2);
  const node = page.locator('.react-flow__node[data-id="A"]');
  await node.click();
  await page.getByRole('button', { name: 'Toolkit: 1 node' }).click();
  await setColorInput(page.getByLabel('Fill'), '#22c55e');
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'zoom in', exact: true }).click();
  await expect(viewport).not.toHaveCSS('transform', firstCamera);
  await saveSnapshot(page, 2);
  await editSnapshot(page, 3);
  await saveSnapshot(page, 3);
  await editSnapshot(page, 4);
  await saveSnapshot(page, 4);
  await editSnapshot(page, 5);
  await saveSnapshot(page, 5);

  await expect(history.getByRole('button')).toHaveCount(5);
  await history.getByRole('button', { name: /^v1\b/ }).click();
  await expect(page.locator('.cm-content')).toContainText('Snapshot 1');
  await expect(node).toHaveCSS('background-color', 'rgb(239, 68, 68)');
  await expect(viewport).toHaveCSS('transform', firstCamera);
  await editSnapshot(page, 6);
  await saveSnapshot(page, 6);
  await expect(history.getByRole('button').locator('span')).toHaveText(['v6', 'v5', 'v4', 'v3', 'v2']);
  await page.screenshot({ path: testInfo.outputPath('version-history-desktop.png') });

  await page.reload();
  await expect(page.locator('.cm-content')).toContainText('Snapshot 6');
  await page.keyboard.press('Escape');
  await expect(history.getByRole('button', { name: /^v6\b/ })).toHaveAttribute('aria-pressed', 'true');
  await history.getByRole('button', { name: /^v2\b/ }).click();
  await expect(node).toHaveCSS('background-color', 'rgb(34, 197, 94)');
  await expect(page.locator('.cm-content')).toContainText('Snapshot 2');

  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('button', { name: 'Toggle Sidebar' }).click();
  const drawer = page.getByRole('dialog', { name: 'Sidebar', exact: true });
  await expect(drawer.getByRole('button', { name: /^v6\b/ })).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('version-history-mobile.png') });
  await drawer.getByRole('button', { name: /^v6\b/ }).click();
  await expect(drawer).toBeHidden();
  await expect(page.locator('.cm-content')).toContainText('Snapshot 6');
});

test('lists, renames, switches, and deletes saved graphs in the sidebar', async ({ page }, testInfo) => {
  let reactFlowWarnings: string[] = [];

  page.on('console', (message) => {
    const text = message.text();
    const isReactFlowTypeMapWarning = text.includes(reactFlowTypeMapWarning);

    if (!isReactFlowTypeMapWarning) {
      return;
    }

    reactFlowWarnings = reactFlowWarnings.concat(text);
  });

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await expect(page.locator('.react-flow__node')).toHaveCount(3);
  expect(reactFlowWarnings).toHaveLength(0);
  await page.keyboard.press('Escape');
  const navigation = page.getByRole('navigation', { name: 'Saved graphs' });
  const graphButtons = navigation.locator('[data-sidebar="menu-button"]');
  const graphName = page.getByRole('textbox', { name: 'Graph name' });
  await expect(navigation.getByText('No saved graphs')).toBeVisible();

  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Saved', exact: true })).toBeVisible();
  await expect(graphButtons).toHaveCount(1);
  await expect(graphButtons).toHaveText(/^[a-f0-9-]{36}$/);
  const savedId = await graphButtons.innerText();
  await expect(graphName).toHaveValue(savedId.trim());

  await page.getByRole('textbox', { name: 'Graph name' }).fill('Release plan');
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(navigation.getByRole('button', { name: 'Release plan' })).toBeVisible();
  await page.getByRole('button', { name: 'New', exact: true }).click();
  await expect(graphName).toHaveValue(/^[a-f0-9-]{36}$/);
  await page.getByRole('textbox', { name: 'Graph name' }).fill('API dependencies');
  await updateEditor(page);
  await expect(page.locator('[data-id="Alpha"]')).toBeVisible();
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(graphButtons).toHaveCount(2);

  await navigation.getByRole('button', { name: 'Release plan' }).click();
  await expect(graphName).toHaveValue('Release plan');
  await expect(page.locator('.cm-content')).toContainText('Idea');
  await expect(navigation.getByRole('button', { name: 'Release plan' })).toHaveAttribute('data-active', 'true');
  await page.reload();
  await expect(graphButtons).toHaveCount(2);
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Download', exact: true }).click();
  await expect(page.getByRole('menu', { name: 'Download', exact: true })).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('sidebar-downloads.png') });
  await page.keyboard.press('Escape');

  await page.getByRole('button', { name: 'Toggle Sidebar' }).click();
  await expect(navigation).not.toBeInViewport();
  await page.getByRole('button', { name: 'New', exact: true }).click();
  await expect(navigation).not.toBeInViewport();
  await page.getByRole('button', { name: 'Toggle Sidebar' }).click();
  await expect(navigation).toBeInViewport();
  await navigation.getByRole('button', { name: 'Release plan' }).click();
  await expect(graphName).toHaveValue('Release plan');
  await page.getByRole('button', { name: 'Delete', exact: true }).click();
  await expect(graphButtons).toHaveCount(1);
  await expect(navigation.getByRole('button', { name: 'API dependencies' })).toBeVisible();
});

test('changes edge markers and matching colors globally and per edge, then restores them', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  const edges = page.locator('.react-flow__edge');
  const firstEdge = edges.nth(0);
  const secondEdge = edges.nth(1);
  const width = page.getByRole('spinbutton', { name: 'Width' });
  await expect(edges).toHaveCount(2);
  await expect.poll(() => readMarker(firstEdge)).toEqual({ fill: 'rgb(23, 23, 23)', stroke: 'rgb(23, 23, 23)' });

  await selectMarker(page, 'Open arrow');
  await setColorInput(page.getByLabel('Color', { exact: true }), '#ef4444');
  await page.getByRole('spinbutton', { name: 'Width' }).fill('99');
  await expect(width).toHaveValue('8');
  await expect(firstEdge.locator('.react-flow__edge-path')).toHaveCSS('stroke-width', '8px');
  await expect(secondEdge.locator('.react-flow__edge-path')).toHaveCSS('stroke-width', '8px');
  await expect.poll(() => readMarker(firstEdge)).toEqual({ fill: 'none', stroke: 'rgb(239, 68, 68)' });
  await expect.poll(() => readMarker(secondEdge)).toEqual({ fill: 'none', stroke: 'rgb(239, 68, 68)' });

  await page.keyboard.press('Escape');
  await firstEdge.click();
  await page.getByRole('button', { name: 'Toolkit: 1 edge', exact: true }).click();
  await selectMarker(page, 'Filled arrow');
  await setColorInput(page.getByLabel('Color', { exact: true }), '#2563eb');
  await page.getByRole('spinbutton', { name: 'Width' }).fill('0');
  await expect(width).toHaveValue('1');
  await expect(firstEdge.locator('.react-flow__edge-path')).toHaveCSS('stroke', 'rgb(37, 99, 235)');
  await expect.poll(() => readMarker(firstEdge)).toEqual({ fill: 'rgb(37, 99, 235)', stroke: 'rgb(37, 99, 235)' });
  await expect.poll(() => readMarker(secondEdge)).toEqual({ fill: 'none', stroke: 'rgb(239, 68, 68)' });
  await page.screenshot({ path: testInfo.outputPath('edge-markers.png') });

  await selectMarker(page, 'None');
  await setColorInput(page.getByLabel('Color', { exact: true }), '#22c55e');
  await expect.poll(() => readMarker(firstEdge)).toBeNull();
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Saved', exact: true })).toBeVisible();
  await page.reload();
  await expect(firstEdge).toBeVisible();
  await expect(page.getByRole('combobox', { name: 'Marker', exact: true })).toHaveText('None');
  await expect.poll(() => readMarker(firstEdge)).toBeNull();
  await expect(firstEdge.locator('.react-flow__edge-path')).toHaveCSS('stroke', 'rgb(34, 197, 94)');
  await expect.poll(() => readMarker(secondEdge)).toEqual({ fill: 'none', stroke: 'rgb(239, 68, 68)' });
  await selectMarker(page, 'Filled arrow');
  await expect.poll(() => readMarker(firstEdge)).toEqual({ fill: 'rgb(34, 197, 94)', stroke: 'rgb(34, 197, 94)' });
});

test('loads legacy marker colors, oversized edges, and untitled names', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.react-flow__edge')).toHaveCount(2);
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Saved', exact: true })).toBeVisible();
  await page.evaluate(() => new Promise<void>((resolve, reject) => {
    const request = indexedDB.open('m2rf-studio');
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const database = request.result;
      const transaction = database.transaction(['translations', 'workspaces'], 'readwrite');
      const translations = transaction.objectStore('translations');
      const workspaces = transaction.objectStore('workspaces');
      const readTranslations = translations.getAll();
      const readWorkspaces = workspaces.getAll();
      readTranslations.onsuccess = () => {
        const [translation] = readTranslations.result;
        const settingsEntries = Object.entries(translation.settings);
        const legacyEntries = settingsEntries.filter(([key]) => key !== 'edgeMarker');
        const settings = Object.fromEntries(legacyEntries);
        const [first, second] = translation.elements.edges;
        const style = Object.assign({}, first.style, { stroke: '#a855f7', strokeWidth: 99 });
        const edge = Object.assign({}, first, { markerEnd: { type: 'arrowclosed' }, style });
        const elements = Object.assign({}, translation.elements, { edges: [edge, second] });
        const legacy = Object.assign({}, translation, { elements, settings });
        translations.put(legacy);
      };
      readWorkspaces.onsuccess = () => {
        const [workspace] = readWorkspaces.result;
        const legacy = Object.assign({}, workspace, { name: 'Untitled Graph' });
        workspaces.put(legacy);
      };
      transaction.oncomplete = () => { database.close(); resolve(); };
      transaction.onabort = () => { database.close(); reject(transaction.error); };
    };
  }));

  await page.reload();
  const firstEdge = page.locator('.react-flow__edge').first();
  await expect.poll(() => readMarker(firstEdge)).toEqual({ fill: 'rgb(168, 85, 247)', stroke: 'rgb(168, 85, 247)' });
  await expect(firstEdge.locator('.react-flow__edge-path')).toHaveCSS('stroke-width', '8px');
  const graphName = page.getByRole('textbox', { name: 'Graph name' });
  await expect(graphName).toHaveValue(/^[a-f0-9-]{36}$/);
  await expect(page.getByRole('combobox', { name: 'Marker', exact: true })).toHaveText('Filled arrow');
});

test('renders sequence diagrams as React Flow elements', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await updateEditor(page, sequenceSource);

  const alice = page.locator('.react-flow__node[data-id="A"]');
  await expect(alice).toContainText('Alice');
  await expect(page.locator('.react-flow__node')).toHaveCount(5);
  await expect(page.locator('.react-flow__edge')).toHaveCount(6);
  await expect(page.getByTestId('rf__wrapper').getByText('Hello', { exact: true })).toBeVisible();
  await expect(alice.getByText('Alice', { exact: true })).toHaveCount(2);
  await expect(alice).toHaveCSS('background-image', 'none');
  const participantFill = await page.evaluate(() => {
    const swatch = document.createElement('div');
    swatch.style.backgroundColor = 'var(--color-gray-100)';
    document.body.append(swatch);
    const color = getComputedStyle(swatch).backgroundColor;
    swatch.remove();
    return color;
  });
  await expect(alice.locator('.z-10 > div').first()).toHaveCSS('background-color', participantFill);

  await updateEditor(page, sequenceSource.replace('A->>B: Hello', 'A-->>B: Hello'));
  const firstMessage = page.getByRole('button', { name: 'Edge from A to action-message-i0', exact: true }).locator('.react-flow__edge-path');
  await expect(firstMessage).toHaveCSS('stroke-dasharray', '6px, 4px');

  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Saved', exact: true })).toBeVisible();
  await page.reload();
  await expect(page.locator('.react-flow__node[data-id="A"]')).toContainText('Alice');
  await expect(page.locator('.react-flow__edge')).toHaveCount(6);
  await expect(page.locator('.cm-content')).toContainText('A-->>B: Hello');
  await expect(firstMessage).toHaveCSS('stroke-dasharray', '6px, 4px');
});

test('shows render errors in a dismissible dialog and keeps the editor usable', async ({ page }) => {
  await page.goto('/');
  await updateEditor(page, `pie title Pets
  "Dogs" : 45
  "Cats" : 55
`);

  const dialog = page.getByRole('dialog', { name: 'Unable to update the graph' });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('alert')).toContainText('not supported in the React Flow view yet');
  await expect(page.locator('.cm-content')).toContainText('pie title Pets');
  await page.keyboard.press('Escape');
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button', { name: 'Dismiss', exact: true }).click();
  await expect(dialog).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Save', exact: true })).toBeDisabled();
  await expect(page.locator('.react-flow__node')).toHaveCount(3);
});

test('starts new diagrams with default styles and canvas settings', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await openToolkit(page);
  await setColorInput(page.getByLabel('Fill'), '#ef4444');
  await page.getByRole('combobox', { name: 'Background', exact: true }).click();
  await page.getByRole('option', { name: 'Diagonal v3', exact: true }).click();
  await page.getByRole('button', { name: 'New', exact: true }).click();
  await openToolkit(page);

  await expect(page.getByLabel('Fill')).toHaveValue('#cccccc');
  await expect(page.getByRole('combobox', { name: 'Surface', exact: true })).toHaveText('Solid');
  await expect(page.getByRole('combobox', { name: 'Background', exact: true })).toHaveText('None');
  await expect(page.getByRole('switch', { name: 'Show grid', exact: true })).toHaveAttribute('aria-checked', 'false');
  await expect(page.locator('.react-flow__node').first()).toHaveCSS('background-color', 'rgb(204, 204, 204)');
  await expect(page.locator('.react-flow__node').first()).toHaveCSS('background-image', 'none');
});

test('supports no canvas background', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await openToolkit(page);
  await page.getByRole('combobox', { name: 'Background', exact: true }).click();
  await page.getByRole('option', { name: 'None', exact: true }).click();

  await expect(page.getByRole('combobox', { name: 'Background', exact: true })).toHaveText('None');
  await expect(page.getByLabel('Density')).toHaveCount(0);
});

test('opens the saved graph drawer and closes it after selection on mobile', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await expect(page.locator('.react-flow__node')).toHaveCount(3);
  await page.keyboard.press('Escape');
  await page.getByRole('textbox', { name: 'Graph name' }).fill('Mobile graph');
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Saved', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'New', exact: true }).click();
  await page.getByRole('button', { name: 'Toggle Sidebar' }).click();

  const drawer = page.getByRole('dialog', { name: 'Sidebar', exact: true });
  await expect(drawer).toBeVisible();
  await expect(drawer.getByRole('button', { name: 'Mobile graph' })).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('mobile-sidebar.png') });
  await drawer.getByRole('button', { name: 'Mobile graph' }).click();
  await expect(drawer).toBeHidden();
  await expect(page.getByRole('textbox', { name: 'Graph name' })).toHaveValue('Mobile graph');
  await expect(page.locator('.cm-content')).toContainText('Idea');
});

test('resizes the editor and canvas with pointer and keyboard', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await expect(page.locator('.react-flow__node')).toHaveCount(3);
  await expect(page.locator('.react-flow__edge-path')).toHaveCount(2);
  await page.keyboard.press('Escape');

  const editor = page.locator('#mermaid-panel');
  const canvas = page.locator('#flow-panel');
  const handle = page.getByRole('separator', { name: 'Resize Mermaid and React Flow panels' });
  const editorBefore = await getBounds(editor);
  const canvasBefore = await getBounds(canvas);
  const handleBefore = await getBounds(handle);
  const x = handleBefore.x + handleBefore.width / 2;
  const y = handleBefore.y + handleBefore.height / 2;

  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + 140, y, { steps: 12 });
  await page.mouse.up();

  const minimumEditorWidth = editorBefore.width + 100;
  const maximumCanvasWidth = canvasBefore.width - 100;
  await expect.poll(async () => (await getBounds(editor)).width).toBeGreaterThan(minimumEditorWidth);
  await expect.poll(async () => (await getBounds(canvas)).width).toBeLessThan(maximumCanvasWidth);

  const editorAfterDrag = await getBounds(editor);
  await handle.focus();
  await page.keyboard.press('ArrowLeft');
  await expect.poll(async () => (await getBounds(editor)).width).toBeLessThan(editorAfterDrag.width);

  await updateEditor(page);
  await expect(page.locator('.react-flow__node').filter({ hasText: 'Write Mermaid' })).toBeVisible();
  await expect(page.locator('.react-flow__edge-path')).toHaveCount(2);
  await page.getByRole('button', { name: 'fit view', exact: true }).click();
  await page.screenshot({ path: testInfo.outputPath('desktop-resizable.png') });

  await page.getByRole('button', { name: 'New', exact: true }).click();
  await expect(page.locator('#studio-panels')).toHaveCSS('flex-direction', 'row');
});

test('stacks the editor above the canvas on mobile', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.keyboard.press('Escape');
  await expect(page.locator('.react-flow__node')).toHaveCount(3);
  await expect(page.locator('#studio-panels')).toHaveCSS('flex-direction', 'column');
  await expect(page.getByRole('separator', { includeHidden: true })).toBeHidden();

  const editor = await getBounds(page.locator('#mermaid-panel'));
  const canvas = await getBounds(page.locator('#flow-panel'));
  const editorBottom = editor.y + editor.height;
  expect(canvas.y).toBeGreaterThanOrEqual(editorBottom);
  expect(canvas.height).toBeGreaterThanOrEqual(520);
  expect(editor.height).toBeGreaterThanOrEqual(520);
  const hasHorizontalOverflow = await page.evaluate(() => {
    const root = document.documentElement;
    return root.scrollWidth > root.clientWidth;
  });
  expect(hasHorizontalOverflow).toBe(false);
  await page.screenshot({ path: testInfo.outputPath('mobile-stacked.png'), fullPage: true });

  await page.setViewportSize({ width: 1440, height: 900 });
  await expect(page.locator('#studio-panels')).toHaveCSS('flex-direction', 'row');
  await expect(page.getByRole('separator', { name: 'Resize Mermaid and React Flow panels' })).toBeVisible();
});

test('saves selected node visual edits after Mermaid update', async ({ page }) => {
  let consoleMessages: unknown[] = [];

  page.on('console', (message) => {
    const [firstArgument] = message.args();
    const isInfo = message.type() === 'info';
    const hasArgument = Boolean(firstArgument);
    const shouldSkipMessage = !isInfo || !hasArgument;

    if (shouldSkipMessage) {
      return;
    }

    void firstArgument
      .jsonValue()
      .then((value) => {
        const isObjectValue = value !== null && typeof value === 'object';

        if (isObjectValue) {
          consoleMessages = consoleMessages.concat(value);
        }
      })
      .catch(() => {});
  });

  await page.goto('/');
  await clearIndexedDb(page);
  await page.reload();

  await updateEditor(page);

  await expect.poll(() => consoleMessages).toContainEqual(
    expect.objectContaining({
      event: 'input.update',
      msg: 'm2rf app event',
      source: '[REDACTED]',
    })
  );

  const node = page.locator('.react-flow__node').filter({
    hasText: 'Write Mermaid',
  });

  await expect(node).toBeVisible();
  await node.click();
  await expect(page.getByText('Node selected')).toBeVisible();

  await page.getByRole('button', { name: 'Toolkit: 1 node' }).click();
  await setColorInput(page.getByLabel('Fill'), '#ef4444');
  await expect(node).toHaveCSS('background-color', 'rgb(239, 68, 68)');

  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByRole('button', { name: 'Saved' })).toBeVisible();

  await page.reload();

  const reloadedNode = page.locator('.react-flow__node').filter({
    hasText: 'Write Mermaid',
  });

  await expect(reloadedNode).toHaveCSS('background-color', 'rgb(239, 68, 68)');
  await expect(page.getByLabel('Fill')).toBeVisible();
  await expect(page.getByLabel('Fill')).toHaveValue('#ef4444');

  const downloadPromise = page.waitForEvent('download');

  await selectDownload(page, 'SVG');

  const download = await downloadPromise;
  const outputPath = '.next/cache/playwright/export.svg';

  await download.saveAs(outputPath);

  const svg = await readFile(outputPath, 'utf8');

  expect(download.suggestedFilename()).toBe('m2rf-graph.svg');
  expect(svg).toContain('<svg');
  expect(svg).toContain('Write Mermaid');
  expect(svg).toContain('rgb(239, 68, 68)');

  const pngDownloadPromise = page.waitForEvent('download');

  await selectDownload(page, 'PNG');

  const pngDownload = await pngDownloadPromise;
  const pngOutputPath = '.next/cache/playwright/export.png';

  await pngDownload.saveAs(pngOutputPath);

  const png = await readFile(pngOutputPath);
  const pngSignature = Array.from(png.subarray(0, 4));

  expect(pngDownload.suggestedFilename()).toBe('m2rf-graph.png');
  expect(pngSignature).toEqual([0x89, 0x50, 0x4e, 0x47]);

  const gifDownloadPromise = page.waitForEvent('download');

  await selectDownload(page, 'GIF (loop)');

  const gifDownload = await gifDownloadPromise;
  const gifOutputPath = '.next/cache/playwright/export.gif';

  await gifDownload.saveAs(gifOutputPath);

  const gif = await readFile(gifOutputPath);

  expect(gifDownload.suggestedFilename()).toBe('m2rf-graph.gif');
  expect(gif.subarray(0, 6).toString('ascii')).toBe('GIF89a');
  expect(gif.toString('latin1')).toContain('NETSCAPE2.0');

  const onceDownloadPromise = page.waitForEvent('download');

  await selectDownload(page, 'GIF (once)');

  const onceDownload = await onceDownloadPromise;
  const onceOutputPath = '.next/cache/playwright/export-once.gif';

  await onceDownload.saveAs(onceOutputPath);

  const onceGif = await readFile(onceOutputPath);

  expect(onceDownload.suggestedFilename()).toBe('m2rf-graph.gif');
  expect(onceGif.subarray(0, 6).toString('ascii')).toBe('GIF89a');
  expect(onceGif.toString('latin1')).not.toContain('NETSCAPE2.0');
});
