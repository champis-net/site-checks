# site-checks

Surveillance de champis.net et des sites des sociétés mycologiques :
toutes les 30 minutes, GitHub Actions ouvre les sites dans un vrai
navigateur (Playwright) et vérifie qu'ils fonctionnent. En cas de panne, une
issue GitHub « Panne : <site> » est ouverte (d'où un e-mail), commentée si
la panne change, puis fermée toute seule au retour.

## Ce qui est vérifié

| Site | Tests |
|---|---|
| champis.dev (bientôt champis.net), le forum Flarum | l'accueil s'affiche avec les dernières discussions, sans erreur JavaScript ; la discussion la plus récente s'ouvre avec ses messages ; la recherche trouve des discussions ; une fiche espèce s'affiche ; une photo envoyée s'affiche |
| champis.net (phpBB), jusqu'à la mise en production | l'accueil affiche les derniers sujets ; un fichier de clé se télécharge depuis keys.champis.net |
| ia.champis.net | le service de reconnaissance est prêt (`/health`) |
| smajoie.ch, mycotra.org, champignons-geneve.ch | l'accueil s'affiche, sans message d'erreur WordPress ; `/wp-json/` répond avec le nom du site |

Partout : chaque page s'ouvre en moins de 5 s et le certificat HTTPS est
valable encore au moins 14 jours. Un test raté est relancé une fois avant de compter comme
une panne.

## Mise en place

1. Créer le dépôt **public** `champis-net/site-checks` sur GitHub et y
   pousser ce dossier (public : les minutes GitHub Actions y sont
   illimitées ; aucun mot de passe n'est dans le code).
2. Settings > Secrets and variables > Actions > **New repository secret** :
   `CHAMPIS_HTTP_AUTH` = `champis:<mot de passe du .htaccess de champis.dev>`.
3. Actions > « Surveillance des sites » > **Run workflow**, pour un premier
   passage sans attendre la demi-heure.
4. Recevoir les alertes : les issues ouvertes par la surveillance arrivent
   par e-mail si le dépôt est suivi (« Watch » > All activity, ou au moins
   Issues) et que les notifications e-mail sont activées dans les réglages
   GitHub.

Les passages planifiés de GitHub peuvent avoir quelques minutes de retard.

## À la mise en production de Flarum

- Settings > Secrets and variables > Actions > Variables : `CHAMPIS_URL` =
  `https://champis.net`, puis supprimer le secret `CHAMPIS_HTTP_AUTH` ;
- supprimer `tests/champis-phpbb.spec.ts`.

L'issue ouverte, s'il y en a une, pour un site qui n'est plus testé se ferme
toute seule au passage suivant.

## Ajouter un site

Un site WordPress : une ligne dans `wordpressSites` (`sites.ts`), avec le
nom que renvoie son `/wp-json/`. Un autre type de site : un fichier
`tests/<site>.spec.ts` dont le `test.describe` porte le nom du site (c'est
aussi le titre de son issue).

## En local

    npm ci
    npx playwright install chromium --only-shell
    npx playwright test                                   # champis.dev échoue sans le mot de passe
    CHAMPIS_URL=https://champis.ddev.site npx playwright test   # Flarum local (ddev)
    npx playwright show-report results/report
    node scripts/alert.mjs                                # sans GITHUB_TOKEN : affiche seulement ce qu'il ferait

Le rapport d'un passage en échec (captures d'écran, traces) est aussi
téléchargeable depuis la page du passage sur GitHub (artefact « rapport »).
