5 new maps have been added to src/data/maps.json and src/data/creator.json has been updated. Thumbnails are already downloaded in public/images/maps/. Integrate these new maps into the existing website.

## What changed in the data

### maps.json — 5 new entries added at the end:

1. **THE BOX** (id: "the-box", code: 6243-2697-8547, creator: 7KAIO) — FFA bounty game mode, 12 players, 894.8K minutes played
2. **[7R] 1V1 RANKED** (id: "7r-1v1-ranked", code: 6273-3015-8172, creator: 7KAIO) — 1v1 build fight with ranked system, DISABLED, 8.8M minutes played
3. **PIANO 1V1** (id: "piano-1v1", code: 4013-4008-3294, creator: 7KAIO) — 1v1 build fight with music, DISABLED, 2.5M minutes played
4. **BOXFIGHT 2V2 [RANKED]** (id: "boxfight-2v2-ranked", code: 7164-1343-7824, creator: GREENCAT) — 2v2 boxfight with ranked system, 64.9M minutes played, 111K favorites
5. **[2V2] FAST REALISTIC RANKED** (id: "fast-realistic-ranked-2v2", code: 2811-1355-5533, creator: TEEKZIE) — 2v2 realistic with ranked, DISABLED, 3.1M minutes played

### creator.json — updated:
- 2 new collaborators added: Greencat (1 map) and Teekzie (1 map)
- totalMaps: 10 → 15
- totalMinutesPlayed: "4.8B+" → "4.9B+"
- totalFavorites: "3.2M+" → "3.3M+"
- totalCollaborators: 3 → 5

### New thumbnails in public/images/maps/:
- the-box.jpg
- 7r-1v1-ranked.jpg
- piano-1v1.jpg
- boxfight-2v2-ranked.jpg
- fast-realistic-ranked-2v2.jpg

## What to update on the site

1. **Maps gallery (/maps)**: The 5 new maps should appear automatically since the gallery reads from maps.json. Verify they show up correctly with proper thumbnails, stats, and badges. The 3 new creators (7KAIO, GREENCAT, TEEKZIE) need to be added to the filter tabs.

2. **Individual map pages (/maps/[id])**: Verify the 5 new map detail pages generate correctly via generateStaticParams(). Each should have proper metadata, stats dashboard, and breadcrumbs.

3. **Homepage hero stats**: Update to use the new aggregate stats from creator.json (4.9B+ minutes, 3.3M+ favorites, 15 maps, 5 collaborators). The count-up animation and context line ("That's X years of non-stop play") should reflect the new numbers.

4. **Homepage collaborator logos**: Add 7KAIO, GREENCAT, and TEEKZIE to the collaborator row if they aren't auto-populated from creator.json.

5. **Homepage featured maps**: Only maps with "featured": true should show. None of the 5 new maps are featured, so no change needed — but verify.

6. **Stats section**: The bar chart showing minutes played per map should now include all 15 maps. The top 6-10 should be shown (the new maps have small numbers so they'll be at the bottom).

7. **Disabled maps**: 3 of the 5 new maps are disabled (7r-1v1-ranked, piano-1v1, fast-realistic-ranked-2v2). Verify they get the "DISABLED" badge and dimmed styling like rift-racers-alpine.

8. **SEO**: Verify sitemap.ts generates URLs for all 5 new map pages. Verify generateMetadata() produces correct titles and descriptions for each new map.

9. **i18n**: If internationalization is set up, verify the new map pages work in all locales.

10. **Run `npm run build`** to verify everything compiles with zero errors.

11. Use Chrome Connector (cdp_navigate + cdp_screenshot) to visually verify:
    - /maps page shows all 15 maps
    - /maps/the-box page renders correctly
    - /maps/7r-1v1-ranked shows disabled badge
    - Homepage stats show updated numbers
