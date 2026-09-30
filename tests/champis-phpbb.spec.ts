// The current phpBB champis.net and keys.champis.net. Delete this file once
// champis.net runs Flarum (and point CHAMPIS_URL at it, see sites.ts).
import { expect, test } from '@playwright/test';
import { champisPhpbb, hostOf } from '../sites';
import { expectValidCertificate, openPage } from './helpers';

test.describe('champis.net (phpBB)', () => {
  test("accueil : la page s'affiche avec les derniers sujets", async ({ page }) => {
    await openPage(page, champisPhpbb.url);
    await expect(page).toHaveTitle(/Champis\.net/);
    // Filled in by the home page's React widget, from api.champis.net.
    await expect(page.locator('.react-home a[href*="viewtopic"]').first(), 'aucun sujet affiché').toBeVisible();
  });

  test('clés de détermination : un fichier se télécharge depuis keys.champis.net', async ({ request }) => {
    const response = await request.get(champisPhpbb.keyFile);
    expect(response.status(), `${champisPhpbb.keyFile} répond ${response.status()}`).toBe(200);
    expect((await response.body()).length).toBeGreaterThan(1000);
  });

  test('certificats HTTPS : valables encore au moins 14 jours', async () => {
    await expectValidCertificate(hostOf(champisPhpbb.url));
    await expectValidCertificate(hostOf(champisPhpbb.keyFile));
  });
});
