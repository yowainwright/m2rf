import { expect, test, type Locator, type Page } from '@playwright/test';

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
  await page.goto('/');
  await clearIndexedDb(page);
  await page.reload();

  await updateEditor(page);

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
});
