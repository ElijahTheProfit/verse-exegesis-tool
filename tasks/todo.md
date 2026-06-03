# Verse Exegesis Tool — TODO

Plan: `C:\Users\ecsei\.claude\plans\lets-create-a-mobile-happy-river.md`

## 1. Scaffold  ✅ DONE
- [x] package.json (ESM; scripts call binaries via `node ./node_modules/...` to dodge the `&` path bug)
- [x] tsconfig (client + server), vite.config.ts, tailwind, postcss
- [x] index.html, src/main.tsx, src/App.tsx, base styles + theme tokens
- [x] server/server.ts (express: /api/health + static + SPA fallback)
- [x] .node-version, .gitignore, .env.example, render.yaml
- [x] `npm install`, build verified, server boots, /api/health ok

## 2. Deterministic data layer (no AI)  ✅ DONE
- [x] scripts/build-data.ts — downloads (cache) + transforms open datasets
- [x] outputs (gzip): lexicon/strongs.json.gz, morph/codes.json.gz, interlinear/<CODE>.json.gz, manifest.json (8.7MB total)
- [x] server/lib/books.ts (66-book table + resolveBook), types.ts, dataStore.ts (lazy+cache)
- [x] GET /api/interlinear, GET /api/lexicon/:strongs, GET /api/manifest
- [x] Verified: John 3:16 → 25 tokens w/ Strong's+morph; Gen 1:1 Hebrew; "1 Cor" abbrev resolves; 404 graceful

## 3. Search (AI call #1)  ✅ DONE (live call needs key)
- [x] server/lib/models.ts (allowlist + per-feature defaults), ratelimit.ts, openai.ts (chatJson structured outputs), prompts.ts (verbatim prompt + rule 7)
- [x] POST /api/search; .env loaded via process.loadEnvFile
- [x] Verified: empty→400, bad model→400, no-key→503. Live JSON shape pending an OPENAI_API_KEY.

## 4. Frontend: Search + Results + theming
- [ ] SearchBox, results grouped by topic, TappableVerse, serif theme, light/dark

## 4. Frontend: Search + Results + theming  ✅ DONE & VERIFIED
- [x] SearchBox, Results grouped by topic + dividers, TappableVerse, serif theme, light/dark + CSS tokens
- [x] api.ts client, SettingsProvider, StudyProvider, App shell, Welcome (examples + recents)

## 5. Alignment (AI call #2) + Word Study  ✅ DONE & VERIFIED
- [x] POST /api/align (mapping only; tokens from deterministic interlinear)
- [x] WordStudyDrawer: 25 chips, script↔translit toggle, Strong's, root/lemma, morphology, definition/usage/derivation
- [x] Verified via preview: interlinear loads, toggle works, graceful fallback note when alignment unavailable

## 6. Etymology (LLM on-demand)  ✅ DONE & VERIFIED
- [x] POST /api/etymology; TappableText primitive; EtymologyDrawer (stacked, recursive related-word chips)
- [x] Verified: stacks over word study, graceful no-key error

## 7. Settings + persistence + About  ✅ DONE & VERIFIED
- [x] Settings: 3 model dropdowns (gpt-5.5/5.4-mini/5.4-nano) + theme; localStorage persistence verified
- [x] About/attribution sheet (manifest-driven)

## 8. Polish  ✅ DONE
- [x] Rate limiting (40/min/IP on AI routes), error/empty/loading states, mobile QA (375px), dev-only demo loader

## 9. Deploy  ◀ PENDING USER
- [ ] Git repo + GitHub, Render Blueprint, set OPENAI_API_KEY secret, live smoke test
- [x] Production single-service mode verified locally (SPA + fallback + API on one port, env=production)

---

## Review
- Deterministic data layer (66 books, 420k tokens, 14k lexicon entries, 8.7MB gzip) parsed from OpenScriptures + STEPBible; verified John 3:16 / Gen 1:1 / abbrev resolution / 404s.
- Full UI verified via preview (eval-driven; screenshot tool stalls in this env): search results → tap word/citation → interlinear + lexicon → script toggle → etymology stack; settings dropdowns + dark mode + persistence.
- Remaining: live AI (search/align/etymology) needs an OPENAI_API_KEY; then deploy to Render.
