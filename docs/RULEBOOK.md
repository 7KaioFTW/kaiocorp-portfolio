# Claude Rulebook — application au projet Portfolio

Référence complète : [`docs/Claude_Rulebook_Thariq_v2.pdf`](./Claude_Rulebook_Thariq_v2.pdf)
(synthèse des essais de Thariq @trq212 + guide Claude Agent SDK).

Ce fichier traduit les règles du rulebook en **directives concrètes pour ce dépôt**. Tout agent
travaillant sur Portfolio doit le lire (référencé depuis `CLAUDE.md`) et l'appliquer.

## Boucle de travail (R1.x)

1. **Gather** — lister les fichiers/faits à lire avant d'agir. Si la liste est vide, demander (R1.1).
2. **Act** — éditer, exécuter.
3. **Verify** — *jamais terminer un tour sur une mutation non vérifiée* (R1.2). Ici : `npx tsc --noEmit`
   + `npx eslint src`. Pour l'UI : un rendu / screenshot, pas une description (R1.5).
4. **Repeat** — réinjecter la vérification dans le tour suivant.

> Si une approche échoue 2 fois, **rewind** plutôt que rustine — une 3ᵉ tentative sur le même
> chemin aggrave le bug (R1.3). Préférer le feedback machine (lint/types/tests) à l'auto-revue
> en texte (R1.4).

## Système de fichiers & état (R5.x) — appliqué ici

| Dossier | Rôle |
|---|---|
| `specs/` | Specs et cahiers des charges (ex. `refonte-kaiocorp.md`). La spec est le contrat (R6.4). |
| `plans/` | Plans d'implémentation, découpage en étapes. |
| `reports/` | Rapports, synthèses, audits (préférer HTML pour les longs — R10.1). |
| `docs/` | Références durables (ce rulebook, PDF). Gros fichiers chargés par tranches via bash (R5.3). |
| `playground/` | Prototypes HTML jetables (R6.12) — ex. `prototype-homepage.html`. |
| `CACHE.md` | État courant du projet. **Lire en premier, mettre à jour en dernier** (R5.4). |

Règles clés : persister décisions/specs/plans dans des fichiers, jamais seulement dans le chat
(R5.1) ; ne jamais écrire de secret (tokens, clés, PII) dans un fichier lu en contexte (R5.6).

## Vérification (R5.7–R5.10)

- **Règles d'abord** : lint, typecheck, test — déterministe, rapide (R5.7). → `tsc` + `eslint`.
- **Visuel** quand la sortie est visuelle : rendu HTML / screenshot (R5.8).
- **TypeScript > JavaScript**, schémas typés > dicts : double les couches de feedback (R5.10).
  (Le repo est déjà en TS strict — le conserver.)

## Outils & bash (R4.x)

- Privilégier **bash + système de fichiers** plutôt que multiplier des outils étroits (R4.1).
- Pré-filtrer le gros contenu avec `grep / head / tail / jq` — ne jamais déverser un log/CSV
  entier en contexte (R4.10).
- Avant de dire « je n'ai pas d'outil pour X » : `curl / jq / pandoc / rg / awk` peuvent-ils le faire ? (R4.11)
- Élicitation = capacité de première classe : `AskUserQuestion` avec options structurées, pas du
  « précise s'il te plaît » en texte libre (R4.4).

## HTML comme format de sortie (R10.x)

- Préférer **HTML** au markdown pour tout artefact substantiel qu'un humain doit lire (specs longues,
  rapports, prototypes) — densité, clarté, partage par lien (R10.1). Markdown réservé au court /
  relu ligne à ligne (R10.10).
- Esquisser en HTML même quand la cible est React (R10.5) — c'est ce que fait `playground/`.
- Terminer tout artefact interactif par un export « copier en JSON / en prompt » (R10.8).

## Skills & code réutilisable (R7.x, R9.x)

- Transformer une consigne récurrente en **skill** (`.claude/skills/...`) plutôt que gonfler les
  instructions (R7.3). Un skill est un *dossier* (scripts + assets + data), pas un simple .md (R9.1).
- Le champ `description` d'un skill = **condition de déclenchement** (« quand l'utiliser »), pas un
  résumé (R9.7).
- Traiter « code » comme un format de sortie : si la réponse peut être du code réutilisable, le
  préférer à la prose (R7.4). → ex. candidat : un script de rafraîchissement des stats fortnite.gg.

## Spécifique à ce projet

- **Source de vérité unique** : `src/data/maps.json` (stats des maps) et `src/data/creator.json`
  (collaborateurs, email, agrégats). Le total de minutes est **calculé** dans `src/lib/stats.ts`
  (`TOTAL_MINUTES_LABEL`) — ne jamais coder ce chiffre en dur.
- Toute modif se termine par `npm run build` (ou au minimum `tsc --noEmit` + `eslint src`) — voir
  `CLAUDE.md`.
