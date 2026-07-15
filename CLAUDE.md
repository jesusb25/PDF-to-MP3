# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

Run from the **repo root** unless noted:

```sh
npm install         # install server (root) deps
npm run build       # installs web/ deps AND builds the React app into web/dist
npm run dev         # concurrently: nodemon server + Vite dev server
npm start           # production: node server/server.js (serves API + web/dist on :8000)
```

- `npm run dev` runs the Express API (nodemon) and the Vite dev server together. The Vite dev server is at `http://localhost:5173/`, the API at `http://localhost:8000`. The frontend calls the API same-origin, so during dev you rely on Vite's proxy / same-origin assumption — run both.
- Frontend-only work can also be done from `web/`: `npm run dev`, `npm run build`, `npm run preview`.
- There is **no test suite, linter, or formatter** configured. Do not invent commands for them.
- Node 20 is required (pinned in `render.yaml`, `server/.nvmrc`, `server/.node-version`).

## Architecture

Single deployable: one Express process serves both the JSON API and the built React SPA. This shapes everything.

**Two-endpoint API** (`server/server.js`):
- `POST /get-text` — accepts an uploaded PDF (`request.files.pdf` via express-fileupload), extracts text with `pdfjs-dist` (concatenates `item.str` across all pages), returns it as plain text.
- `GET /base64data?text=...` — converts a text string to base64 MP3 via `google-tts-api` and returns the concatenated base64 string. Language is **hardcoded to `en`**.
- `app.get('*')` is an SPA fallback returning `web/dist/index.html` so React Router routes (`/mission`, `/demo`) survive hard reloads. Any new API route must be registered **before** this catch-all.

**Client-side conversion pipeline** (`web/src/lib/convert.js`) — the real orchestration lives here, not the server:
- Text is split into ≤1000-char chunks on word boundaries (`splitTextIntoChunks`) because the TTS API has a per-request length limit. The server does **not** chunk.
- `textToMp3Base64` calls `/base64data` **sequentially** per chunk (deliberate — meaningful progress + avoids hammering the free tier), then joins the base64 parts into one payload.
- `extractText` uses `XMLHttpRequest` (not `fetch`) specifically to report real upload-byte progress for large PDFs.
- `downloadMp3` triggers a browser download via a `data:audio/mpeg;base64,` anchor — audio never touches disk server-side.

**Frontend** (`web/src/`): React + Vite + Tailwind. `App.jsx` is router + layout; `pages/Home.jsx` is the converter UI; `hooks/useTheme.js` drives light/dark/system theming. `vite.config.js` uses `base: '/'` because Express serves it from root.

## Important: stale/legacy files

The repo root contains **legacy artifacts from a pre-React version** that are NOT part of the live app: `index.js`, and the `css/`, `images/`, `assets/` directories. `AGENTS.md` is **outdated** — it describes a Bootstrap/HTML frontend (`index.html`, `demo.html`, `mission.html`) that no longer exists. The active frontend is entirely in `web/`. Ignore `AGENTS.md`'s file references and do not edit the legacy root files when working on the app.

## Deployment

Single Render web service (`render.yaml`): build `npm install && npm run build`, start `npm start`. Render provides `PORT`. Because build runs from root, `npm run build` must install and build `web/` too (it does, via `--prefix web`).
