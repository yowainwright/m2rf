import { expect, test, type Locator, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';

const source = `flowchart LR
  Alpha[Write Mermaid] --> Beta[Build graph]
  Beta --> Gamma[React Flow preview]
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

const updateEditor = async (page: Page) => {
  const editor = page.locator('.cm-content');

  await editor.click();
  await page.keyboard.press('Meta+A');
  await page.keyboard.insertText(source);
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
  const graphName = page.getByRole('textbox', { name: 'Graph name' });
  await expect(navigation.getByText('No saved graphs')).toBeVisible();

  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Saved', exact: true })).toBeVisible();
  await expect(navigation.getByRole('button')).toHaveCount(1);
  await expect(navigation.getByRole('button')).toHaveText(/^[a-f0-9-]{36}$/);

  await page.getByRole('textbox', { name: 'Graph name' }).fill('Release plan');
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(navigation.getByRole('button', { name: 'Release plan' })).toBeVisible();
  await page.getByRole('button', { name: 'New', exact: true }).click();
  await expect(graphName).toHaveValue('');
  await page.getByRole('textbox', { name: 'Graph name' }).fill('API dependencies');
  await updateEditor(page);
  await expect(page.locator('[data-id="Alpha"]')).toBeVisible();
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(navigation.getByRole('button')).toHaveCount(2);

  await navigation.getByRole('button', { name: 'Release plan' }).click();
  await expect(graphName).toHaveValue('Release plan');
  await expect(page.locator('.cm-content')).toContainText('Idea');
  await expect(navigation.getByRole('button', { name: 'Release plan' })).toHaveAttribute('data-active', 'true');
  await page.reload();
  await expect(navigation.getByRole('button')).toHaveCount(2);
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
  await expect(navigation.getByRole('button')).toHaveCount(1);
  await expect(navigation.getByRole('button', { name: 'API dependencies' })).toBeVisible();
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
