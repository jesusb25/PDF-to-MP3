# Narrate

Turn PDF documents into downloadable MP3 audio so you can listen to long-form reading on the go.

[Open the live app](https://pdf-to-mp3.onrender.com/)

## Demo

https://github.com/jesusb25/PDF-to-MP3/assets/104487170/54a0ecac-15c7-4a62-b612-edd0d17d2bd8

A local demo recording is also available at [assets/demo.mov](assets/demo.mov).

## Features

- Upload a PDF and extract its text in the browser workflow.
- Review and edit the extracted text before conversion.
- Convert text into MP3 audio with Google Text-to-Speech.
- Download the generated audio file.
- Switch between light, dark, and system color modes.

## Tech Stack

- React + Vite + Tailwind CSS for the frontend (in `web/`)
- React Router for client-side routing (Home, Mission, Demo)
- Express.js for the backend API
- `pdfjs-dist` for PDF text extraction
- `google-tts-api` for text-to-speech audio generation
- Render for hosting (single service serving both the API and the built frontend)

## Getting Started

### Prerequisites

- Node.js 20 or newer
- npm

### Frontend (`web/`)

The user-facing app is a Vite + React project.

```sh
git clone https://github.com/jesusb25/PDF-to-MP3.git
cd PDF-to-MP3/web
npm install
npm run dev      # http://localhost:5173/PDF-to-MP3/
```

Build a production bundle into `web/dist`:

```sh
npm run build
npm run preview  # preview the built bundle locally
```

During development the Vite dev server runs the frontend; the backend must
also be running (see below) since the frontend now calls a same-origin API.

### Backend (`server/`)

The Express API lives at the repo root. In production it also serves the built
frontend from `web/dist`, so the whole app runs as one process.

```sh
npm install         # from the repo root
npm run build       # installs web deps and builds web/dist
npm start           # serves API + frontend on http://localhost:8000
```

For live-reload during development use `npm run dev` (nodemon).

## API Overview

The Express server exposes two main endpoints:

- `POST /get-text`: accepts an uploaded PDF file and returns extracted text.
- `GET /base64data?text=...`: converts text into base64-encoded MP3 audio data.

The frontend calls these endpoints on the same origin that serves it, so no
separate API host or CORS configuration is required in production.

## Project Structure

```text
.
|-- web/                     # React + Vite frontend
|   |-- src/
|   |   |-- App.jsx          # Router + layout
|   |   |-- pages/           # Home (converter), Mission, Demo
|   |   |-- components/      # Navbar, Footer, ThemeToggle
|   |   |-- hooks/           # useTheme (light/dark/auto)
|   |   `-- lib/convert.js   # PDF upload + MP3 conversion logic
|   |-- public/              # Static assets (images, demo.mov)
|   `-- vite.config.js       # base: '/' — served from root by Express
|-- server/server.js         # Express: PDF extraction, TTS, and static frontend
`-- render.yaml              # Render single-service deploy config
```

## Deployment

The entire app runs as a single Render web service defined in
[render.yaml](render.yaml). On deploy, Render runs:

- `npm install && npm run build` — installs server deps and builds the React
  frontend into `web/dist`.
- `npm start` — launches Express, which serves the API and the built frontend
  from one process (Render provides the `PORT` env var).

To set it up: on Render, create a **Blueprint** from this repo (it reads
`render.yaml`), or a **Web Service** with build command `npm install && npm run
build` and start command `npm start`. Client-side routes are handled by an
Express SPA fallback that returns `index.html` for non-API paths.

## Roadmap

- Add more natural-sounding voice options.
- Improve PDF validation and conversion error messages.
- Add support for additional languages and voice settings.

## Author

Built by Jesus Ballesteros.

[LinkedIn](https://www.linkedin.com/in/ballesterosjesus/)
