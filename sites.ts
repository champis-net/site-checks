// The monitored sites. Each test group (test.describe) is named after its
// site's host, and that name is also the title of the GitHub issue opened
// when it breaks (scripts/alert.mjs) - renaming one closes the old issue
// and opens a new one.

// The Flarum forum: champis.dev (test site, password-protected) until the
// launch, then champis.net - set the repository variable CHAMPIS_URL then
// (Settings > Secrets and variables > Actions > Variables) and delete
// tests/champis-phpbb.spec.ts.
export const champis = {
  url: process.env.CHAMPIS_URL || 'https://champis.dev',
  // "user:password" of champis.dev's .htaccess (secret CHAMPIS_HTTP_AUTH);
  // not needed once on champis.net.
  httpAuth: process.env.CHAMPIS_HTTP_AUTH || '',
  // A frequently determined species, for the species pages.
  species: { id: 2525710, name: 'Hygrophoropsis aurantiaca' },
  searchTerm: 'bolet',
};

// The phpBB site still in production, and its determination keys
// (keys.champis.net, which the migration to Flarum also downloads).
export const champisPhpbb = {
  url: 'https://champis.net',
  keyFile: 'https://keys.champis.net/Fungi/Basidiomycota/Agaricaceae/Agaricus_La%20Chiusa_IT_NC.cle',
};

// The photo recognition service (champis-recognition).
export const recognition = {
  url: 'https://ia.champis.net',
};

// `name`: the site name /wp-json/ returns, HTML entities decoded.
export const wordpressSites = [
  { url: 'https://smajoie.ch', name: "Société mycologique d'Ajoie" },
  { url: 'https://mycotra.org', name: 'Société mycologique de Tramelan' },
  { url: 'https://champignons-geneve.ch', name: 'Société mycologique de Genève' },
];

export const hostOf = (url: string) => new URL(url).host;
