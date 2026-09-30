import { expect, test } from '@playwright/test';
import { hostOf, recognition } from '../sites';
import { expectValidCertificate } from './helpers';

test.describe(hostOf(recognition.url), () => {
  test('reconnaissance des photos : le service est prêt', async ({ request }) => {
    const response = await request.get(`${recognition.url}/health`);
    expect(response.status(), `/health répond ${response.status()}`).toBe(200);
    const health = await response.json();
    expect(health.status, 'le modèle n’est pas chargé').toBe('ok');
    expect(health.species, 'liste d’espèces vide').toBeGreaterThan(0);
  });

  test('certificat HTTPS : valable encore au moins 14 jours', async () => {
    await expectValidCertificate(hostOf(recognition.url));
  });
});
