import { expect, test, type Locator, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';

const source = `flowchart LR
  Alpha[Write Mermaid] --> Beta[Build graph]
  Beta --> Gamma[React Flow preview]
`;

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

  await page.getByRole('button', { name: 'Export SVG' }).click();

  const download = await downloadPromise;
  const outputPath = '.next/cache/playwright/export.svg';

  await download.saveAs(outputPath);

  const svg = await readFile(outputPath, 'utf8');

  expect(download.suggestedFilename()).toBe('untitled-graph.svg');
  expect(svg).toContain('<svg');
  expect(svg).toContain('Write Mermaid');
  expect(svg).toContain('rgb(239, 68, 68)');

  const pngDownloadPromise = page.waitForEvent('download');

  await page.getByRole('button', { name: 'Export PNG' }).click();

  const pngDownload = await pngDownloadPromise;
  const pngOutputPath = '.next/cache/playwright/export.png';

  await pngDownload.saveAs(pngOutputPath);

  const png = await readFile(pngOutputPath);
  const pngSignature = Array.from(png.subarray(0, 4));

  expect(pngDownload.suggestedFilename()).toBe('untitled-graph.png');
  expect(pngSignature).toEqual([0x89, 0x50, 0x4e, 0x47]);

  const gifDownloadPromise = page.waitForEvent('download');

  await page.getByRole('button', { name: 'Export GIF', exact: true }).click();

  const gifDownload = await gifDownloadPromise;
  const gifOutputPath = '.next/cache/playwright/export.gif';

  await gifDownload.saveAs(gifOutputPath);

  const gif = await readFile(gifOutputPath);

  expect(gifDownload.suggestedFilename()).toBe('untitled-graph.gif');
  expect(gif.subarray(0, 6).toString('ascii')).toBe('GIF89a');
  expect(gif.toString('latin1')).toContain('NETSCAPE2.0');

  const onceDownloadPromise = page.waitForEvent('download');

  await page.getByRole('button', { name: 'Export GIF Once' }).click();

  const onceDownload = await onceDownloadPromise;
  const onceOutputPath = '.next/cache/playwright/export-once.gif';

  await onceDownload.saveAs(onceOutputPath);

  const onceGif = await readFile(onceOutputPath);

  expect(onceDownload.suggestedFilename()).toBe('untitled-graph.gif');
  expect(onceGif.subarray(0, 6).toString('ascii')).toBe('GIF89a');
  expect(onceGif.toString('latin1')).not.toContain('NETSCAPE2.0');
});
