# Lessons

Patterns learned from corrections during this project. Review at session start.

## Environment
- OS: Windows. Node v22.18.0, npm 10.9.3, git 2.50.1. Project path contains spaces and `&` — always quote paths.
- Bash tool is git-bash style; paths like `/c/Users/...` work.

## Conventions
- ESM throughout (`"type": "module"`). Server runs via `tsx` at runtime (dev + prod) to avoid tsc/ESM extension friction.
- Data files read from `process.cwd()`-relative `server/data/` so dev (tsx) and prod (node/tsx from repo root) both resolve correctly.
- Only the compact processed JSON under `server/data/` is committed; raw downloaded datasets live in gitignored `data-raw/`.

## Dev server lifecycle
- `tsx file.ts` (and `npm start` which wraps it) FORKS a child node process. Stopping the background task kills the parent but ORPHANS the child, which keeps holding the port → next start fails with EADDRINUSE.
- Fix: launch the dev server as a single process with `node --import tsx server/server.ts` so TaskStop kills it cleanly. To clear a stuck port: PowerShell `Get-NetTCPConnection -LocalPort 3000 -State Listen | %{ Stop-Process -Id $_.OwningProcess -Force }`.
- PowerShell 5.1 has NO `if` expression — `Write-Output (if(...){}else{})` errors. Use a temp var + separate Write-Output.

## Data formats (STEPBible TAHOT/TAGNT)
- Verse-keyed rows: `Book.Ch.Vs#idx=Type` then tab cols. NT: keep rows whose Type contains 'N' (Nestlé-Aland ≈ NASB base). OT: single Masoretic text.
- Hebrew cells: `/` separates morphemes, `\` separates trailing punctuation. Root morpheme marked by `{}` in the dStrongs column → use it to pick the root segment for strongs/gloss/morph.
- Morph codes expand via TEGMC/TEHMC structured line (`Function=...; ...`). Hebrew full codes include a language prefix (HNcfsa); text segments after the first drop it, so re-add H/A before lookup.
- Strong's normalize: strip padding + disambiguation letters + braces → `G976`, `H7225`. OpenScriptures Greek uses `translit` (no pron); Hebrew uses `xlit`+`pron`.

## Preview verification (Claude Preview MCP)
- `preview_screenshot` stalled/timed out in this Windows env, but `preview_eval` works great — drive clicks and read DOM via eval to verify UI rigorously without images.
- After clicking something that triggers a React setState, reading the DOM in the SAME eval is STALE (React re-renders async). Wrap the read in `new Promise(r=>setTimeout(()=>r(...), 300))`.
- `element.innerText` reflects CSS `text-transform` (e.g. `capitalize` turns "light" into "Light"), so match case-insensitively when finding buttons by text.
- Let `preview_start` own the Vite frontend (.claude/launch.json) but keep the API backend running separately; Vite proxies /api → :3000.

## (add new lessons below as corrections occur)
