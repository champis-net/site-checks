// The monitored sites. Each test group (test.describe) is named after its
// site's host, and that name is also the title of the GitHub issue opened
// when it breaks (scripts/alert.mjs) - renaming one closes the old issue
// and opens a new one.

// The Flarum forum: champis.dev (test site, password-protected) until the
// launch, then champis.net - set the repository variable CHAMPIS_URL then
// (Settings > Secrets and variables > Actions > Variables).
export const champis = {
  url: process.env.CHAMPIS_URL || 'https://champis.dev',
  // "user:password" of champis.dev's .htaccess (secret CHAMPIS_HTTP_AUTH);
  // not needed once on champis.net.
  httpAuth: process.env.CHAMPIS_HTTP_AUTH || '',
  // A frequently determined species, for the species pages.
  species: { id: 2525710, name: 'Hygrophoropsis aurantiaca' },
  searchTerm: 'bolet',
  // Old phpBB addresses still linked from other sites, bookmarks and search
  // engines (champis-forum's Legacy*RedirectController), and the path each
  // must 301 to. Public content only: topic 22457 "Définition" in forum 62
  // (Articles), 215533 one of its posts, 65978 a public attachment.
  legacyRedirects: [
    { from: '/viewtopic.php?t=22457', to: /^\/d\/1022457(-|$)/ },
    { from: '/viewtopic.php?f=62&t=22457', to: /^\/d\/1022457(-|$)/ },
    { from: '/viewtopic.php?p=215533', to: /^\/d\/1022457(-|\/|$)/ },
    { from: '/viewforum.php?f=62', to: /^\/t\/articles$/ },
    { from: '/download/file.php?id=65978', to: /^\/assets\/files\/./ },
    { from: '/index.php', to: /^\/$/ },
  ],
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
