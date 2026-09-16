import { expect, test } from '@playwright/test';

test('loads the exported app and its assets under /m2rf/', async ({ page }) => {
  const response = await page.goto('./');
  expect(response?.status()).toBe(200);
  await expect(page.locator('.react-flow__node')).toHaveCount(3);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    'href',
    'https://jeffry.in/m2rf/',
  );
  const icon = page.getByRole('link', { name: 'GitHub repository' }).locator('img');
  await expect(icon).toHaveAttribute('src', '/m2rf/github.svg');
  expect(await icon.evaluate((image: HTMLImageElement) => image.naturalWidth)).toBeGreaterThan(0);
  const assets = await page
    .locator('script[src], link[rel="stylesheet"]')
    .evaluateAll((elements) =>
      elements.map((element) => element.getAttribute('src') || element.getAttribute('href')),
    );
  expect(assets.length).toBeGreaterThan(0);
  expect(assets.every((path) => path?.startsWith('/m2rf/_next/'))).toBe(true);
  await page.reload();
  await expect(page.locator('.react-flow__node')).toHaveCount(3);
  expect(await page.pageErrors()).toEqual([]);
});

test('exports a real 404 page without an app-shell fallback', async ({ request }) => {
  const missing = await request.get('./does-not-exist/');
  expect(missing.status()).toBe(404);
  const notFound = await request.get('./404.html');
  expect(notFound.status()).toBe(200);
  expect(await notFound.text()).toContain('This page could not be found');
});
