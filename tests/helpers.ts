import { connect } from 'node:tls';
import { expect, type Page } from '@playwright/test';

// Days before the HTTPS certificate of `host` expires. Alert below 14:
// Let's Encrypt certificates (all of these sites) renew 30 days ahead, so
// under 14 left means the renewal has failed at least twice.
export const MIN_CERTIFICATE_DAYS = 14;

export function certificateDaysLeft(host: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const socket = connect({ host, port: 443, servername: host, timeout: 15_000 }, () => {
      const { valid_to } = socket.getPeerCertificate();
      socket.end();
      resolve((new Date(valid_to).getTime() - Date.now()) / 86_400_000);
    });
    socket.on('timeout', () => socket.destroy(new Error(`${host}: pas de réponse TLS en 15 s`)));
    socket.on('error', reject);
  });
}

export async function expectValidCertificate(host: string) {
  const days = await certificateDaysLeft(host);
  expect(days, `le certificat HTTPS de ${host} expire dans ${Math.floor(days)} jours`)
    .toBeGreaterThan(MIN_CERTIFICATE_DAYS);
}

// Uncaught JavaScript errors on the page: a site that loads but whose
// scripts crash (a white Flarum page, for instance) still answers 200.
export function collectPageErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  return errors;
}

// Opens `url` and checks the answer came quickly enough; returns the time
// taken to get the page (headers + HTML), in ms.
export async function openPage(page: Page, url: string, maxMs = 5_000) {
  const start = Date.now();
  const response = await page.goto(url, { waitUntil: 'domcontentloaded' });
  const ms = Date.now() - start;
  expect(response?.status(), `${url} répond ${response?.status()}`).toBe(200);
  expect(ms, `${url} a mis ${(ms / 1000).toFixed(1)} s à répondre`).toBeLessThan(maxMs);
  return ms;
}
