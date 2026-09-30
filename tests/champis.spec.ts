import { expect, test } from '@playwright/test';
import { champis, hostOf } from '../sites';
import { collectPageErrors, expectValidCertificate, openPage } from './helpers';

const [username, ...rest] = champis.httpAuth.split(':');
const origin = new URL(champis.url).origin;

test.use({
  baseURL: champis.url,
  // champis.dev's .htaccess password, sent to champis.dev only.
  httpCredentials: champis.httpAuth ? { username, password: rest.join(':'), origin, send: 'always' } : undefined,
  // Local runs against ddev's self-signed certificate.
  ignoreHTTPSErrors: origin.endsWith('.ddev.site'),
});

test.describe(hostOf(champis.url), () => {
  test("accueil : la page s'affiche avec les dernières discussions", async ({ page }) => {
    const errors = collectPageErrors(page);
    await openPage(page, '/');
    await expect(page.locator('.DiscussionListItem').first(), 'aucune discussion affichée').toBeVisible();
    expect(errors, 'erreurs JavaScript sur la page').toEqual([]);
  });

  test("discussion : la plus récente s'ouvre avec ses messages", async ({ page }) => {
    const errors = collectPageErrors(page);
    await openPage(page, '/');
    const href = await page.locator('.DiscussionListItem-main').first().getAttribute('href');
    expect(href, "pas de lien vers une discussion sur l'accueil").toBeTruthy();
    await openPage(page, href!);
    await expect(page.locator('.DiscussionHero-title')).toBeVisible();
    await expect(page.locator('.PostStream-item .Post-body').first(), 'aucun message affiché').toBeVisible();
    expect(errors, 'erreurs JavaScript sur la page').toEqual([]);
  });

  test('recherche : trouve des discussions', async ({ request }) => {
    const response = await request.get('/api/discussions', {
      params: { 'filter[q]': champis.searchTerm, 'page[limit]': 5 },
    });
    expect(response.status(), `la recherche répond ${response.status()}`).toBe(200);
    const { data } = await response.json();
    expect(data.length, `aucun résultat pour « ${champis.searchTerm} »`).toBeGreaterThan(0);
  });

  test("fiche espèce : s'affiche avec son nom", async ({ page }) => {
    const errors = collectPageErrors(page);
    await openPage(page, `/species/${champis.species.id}`);
    await expect(page.locator('h1').first()).toContainText(champis.species.name);
    expect(errors, 'erreurs JavaScript sur la page').toEqual([]);
  });

  test("images : une photo envoyée s'affiche", async ({ page, request }) => {
    await openPage(page, '/');
    const src = await page.locator('img[src*="/assets/files/"]').first().getAttribute('src');
    expect(src, "pas de photo sur l'accueil").toBeTruthy();
    const response = await request.get(src!);
    expect(response.status(), `${src} répond ${response.status()}`).toBe(200);
    expect(response.headers()['content-type']).toMatch(/^image\//);
  });

  test('certificat HTTPS : valable encore au moins 14 jours', async () => {
    test.skip(origin.endsWith('.ddev.site'), 'certificat local');
    await expectValidCertificate(hostOf(champis.url));
  });
});
