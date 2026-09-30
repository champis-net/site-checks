import { expect, test } from '@playwright/test';
import { hostOf, wordpressSites } from '../sites';
import { expectValidCertificate, openPage } from './helpers';

// What WordPress prints instead of the site when PHP or the database fails
// (French and English, depending on the site's language).
const WORDPRESS_ERRORS = [
  'Il y a eu une erreur critique',
  'There has been a critical error',
  'Erreur lors de la connexion à la base de données',
  'Error establishing a database connection',
  'Briefly unavailable for scheduled maintenance',
  'Brièvement indisponible pour cause de maintenance',
];

const decodeEntities = (s: string) =>
  s.replace(/&#0*39;|&apos;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, '&');

for (const site of wordpressSites) {
  test.describe(hostOf(site.url), () => {
    test("accueil : la page s'affiche", async ({ page }) => {
      await openPage(page, site.url);
      const body = await page.locator('body').innerText();
      for (const error of WORDPRESS_ERRORS) {
        expect(body, `WordPress affiche « ${error} »`).not.toContain(error);
      }
      expect(decodeEntities(await page.title())).toContain(site.name);
    });

    test('API WordPress : répond avec le nom du site', async ({ request }) => {
      const response = await request.get(`${site.url}/wp-json/`);
      expect(response.status(), `/wp-json/ répond ${response.status()}`).toBe(200);
      const { name } = await response.json();
      expect(decodeEntities(name)).toBe(site.name);
    });

    test('certificat HTTPS : valable encore au moins 14 jours', async () => {
      await expectValidCertificate(hostOf(site.url));
    });
  });
}
