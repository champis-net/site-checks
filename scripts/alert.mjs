// Turns the Playwright results (results/results.json) into GitHub issues,
// one per site, labelled "panne":
// - a site with failing tests and no open issue gets one;
// - an open issue gets a comment only when the set of failing tests
//   changes, not on every run while the outage lasts;
// - an open issue whose site passes again (or is no longer monitored)
//   gets a closing comment and is closed.
// Each issue's body ends with a marker holding the failing tests, which is
// how the next run knows what changed.
//
// Environment (all set by GitHub Actions): GITHUB_TOKEN, GITHUB_REPOSITORY,
// GITHUB_API_URL, GITHUB_SERVER_URL, GITHUB_RUN_ID. Without GITHUB_TOKEN it
// only prints what it would do (local dry run).
//
// Exits 1 if the results are missing or Playwright itself failed (a
// broken test file, say), so the workflow run turns red and GitHub mails
// about the monitoring being broken - as opposed to a site being down,
// which is reported through the issues and keeps the run green.

import { readFileSync } from 'node:fs';

const LABEL = 'panne';
const RESULTS = process.env.RESULTS_FILE || 'results/results.json';
const MARKER = /<!-- site-checks:failing=(.*?) -->/s;

const {
  GITHUB_TOKEN: token,
  GITHUB_REPOSITORY: repo,
  GITHUB_API_URL: api = 'https://api.github.com',
  GITHUB_SERVER_URL: server = 'https://github.com',
  GITHUB_RUN_ID: runId,
} = process.env;

const runUrl = repo && runId ? `${server}/${repo}/actions/runs/${runId}` : null;
const now = new Date().toLocaleString('fr-CH', { timeZone: 'Europe/Zurich', dateStyle: 'short', timeStyle: 'short' });

// --- Playwright results → { site: { passed, failures: [{ title, error }] } }

let results;
try {
  results = JSON.parse(readFileSync(RESULTS, 'utf8'));
} catch (error) {
  console.error(`Résultats illisibles (${RESULTS}) : ${error.message}`);
  process.exit(1);
}

const stripAnsi = (s) => s.replace(/\u001b\[[0-9;]*m/g, '');

const sites = new Map();
const collect = (suite, site) => {
  for (const spec of suite.specs ?? []) {
    const entry = sites.get(site) ?? { failures: [] };
    sites.set(site, entry);
    for (const test of spec.tests) {
      if (test.status !== 'unexpected') continue;
      const last = test.results.at(-1);
      const message = stripAnsi(last?.error?.message ?? last?.status ?? 'échec').trim();
      entry.failures.push({ title: spec.title, error: message.split('\n').slice(0, 6).join('\n') });
    }
  }
  for (const child of suite.suites ?? []) collect(child, site);
};
// Top-level suites are the files, their children the test.describe blocks,
// named after each site.
for (const file of results.suites ?? []) {
  for (const describe of file.suites ?? []) collect(describe, describe.title);
}

const playwrightErrors = (results.errors ?? []).map((e) => stripAnsi(e.message ?? String(e)));

// --- GitHub API

async function gh(method, path, body) {
  if (!token) {
    if (method !== 'GET') console.log(`[simulation] ${method} ${path}`, body ? JSON.stringify(body) : '');
    return method === 'GET' ? [] : {};
  }
  const response = await fetch(`${api}/repos/${repo}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (method === 'POST' && path === '/labels' && response.status === 422) return {}; // already exists
  if (!response.ok) throw new Error(`${method} ${path} : ${response.status} ${await response.text()}`);
  return response.json();
}

const issueTitle = (site) => `Panne : ${site}`;
const failingKey = (failures) => failures.map((f) => f.title).sort().join('\n');

function describeFailures(failures) {
  return failures
    .map((f) => `- **${f.title}**\n\n  \`\`\`\n${f.error.replace(/^/gm, '  ')}\n  \`\`\``)
    .join('\n');
}

function issueBody(site, failures) {
  return [
    `La surveillance a détecté un problème sur **${site}** (${now}).`,
    '',
    describeFailures(failures),
    '',
    runUrl ? `Détails, captures d'écran et traces : ${runUrl}` : '',
    '',
    'Cette issue se fermera toute seule quand tous les tests de ce site repasseront.',
    '',
    `<!-- site-checks:failing=${failingKey(failures)} -->`,
  ].join('\n');
}

// --- Reconcile

await gh('POST', '/labels', { name: LABEL, color: 'd73a4a', description: 'Site en panne, ouverte par la surveillance' });

const open = await gh('GET', `/issues?labels=${LABEL}&state=open&per_page=100`);
const openBySite = new Map(
  open.filter((i) => !i.pull_request && i.title.startsWith('Panne : ')).map((i) => [i.title.slice('Panne : '.length), i]),
);

for (const [site, { failures }] of sites) {
  const issue = openBySite.get(site);
  openBySite.delete(site);

  if (failures.length === 0) {
    if (issue) {
      console.log(`${site} : rétabli, fermeture de #${issue.number}`);
      await gh('POST', `/issues/${issue.number}/comments`, { body: `Rétabli (${now}) : tous les tests passent de nouveau.` });
      await gh('PATCH', `/issues/${issue.number}`, { state: 'closed', state_reason: 'completed' });
    } else {
      console.log(`${site} : ok`);
    }
    continue;
  }

  if (!issue) {
    console.log(`${site} : ${failures.length} échec(s), ouverture d'une issue`);
    await gh('POST', '/issues', { title: issueTitle(site), body: issueBody(site, failures), labels: [LABEL] });
    continue;
  }

  const previous = issue.body?.match(MARKER)?.[1] ?? '';
  if (previous === failingKey(failures)) {
    console.log(`${site} : toujours en panne (#${issue.number}), rien de nouveau`);
    continue;
  }
  console.log(`${site} : la panne a changé, commentaire sur #${issue.number}`);
  await gh('POST', `/issues/${issue.number}/comments`, {
    body: [`Mise à jour (${now}) - échecs actuels :`, '', describeFailures(failures), '', runUrl ?? ''].join('\n'),
  });
  await gh('PATCH', `/issues/${issue.number}`, { body: issueBody(site, failures) });
}

// Open issues for sites no longer in the results (removed from the tests) -
// unless Playwright failed, in which case a site can be missing only
// because its test file crashed.
for (const [site, issue] of playwrightErrors.length > 0 ? [] : openBySite) {
  console.log(`${site} : n'est plus surveillé, fermeture de #${issue.number}`);
  await gh('POST', `/issues/${issue.number}/comments`, { body: `Ce site n'est plus surveillé (${now}).` });
  await gh('PATCH', `/issues/${issue.number}`, { state: 'closed', state_reason: 'not_planned' });
}

if (playwrightErrors.length > 0 || sites.size === 0) {
  console.error('Playwright a échoué :', playwrightErrors.join('\n') || 'aucun test exécuté');
  process.exit(1);
}
