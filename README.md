# Narrate

Turn PDF documents into downloadable MP3 audio so you can listen to long-form reading on the go.

[Open the live app](https://jesusb25.github.io/PDF-to-MP3/)

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
- Render for the hosted backend API
- GitHub Pages (via GitHub Actions) for the hosted frontend

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

The frontend calls the hosted Render API by default (see `web/src/lib/convert.js`),
so no local backend is required to try it.

### Backend (`server/`)

The Express API lives at the repo root and is deployed to Render.

```sh
npm install   # from the repo root
npm start     # runs server/server.js via nodemon
```

## API Overview

The Express server exposes two main endpoints:

- `POST /get-text`: accepts an uploaded PDF file and returns extracted text.
- `GET /base64data?text=...`: converts text into base64-encoded MP3 audio data.

The current frontend is configured to call the hosted Render API at `https://pdf-to-mp3.onrender.com`.

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
|   |-- public/              # Static assets (images, demo.mov, 404.html)
|   `-- vite.config.js       # base: '/PDF-to-MP3/' for GitHub Pages
|-- server/server.js         # Express API for PDF extraction and TTS
`-- .github/workflows/       # GitHub Actions: build web/ and deploy to Pages
```

## Deployment

The frontend deploys automatically to GitHub Pages via
[.github/workflows/deploy.yml](.github/workflows/deploy.yml). On every push to
`main`, the workflow installs dependencies in `web/`, runs `npm run build`, and
publishes `web/dist`. Pages must be set to **Source: GitHub Actions**
(Settings → Pages).

Because the app is served from the `/PDF-to-MP3/` subpath, Vite's `base` is set
accordingly and a `public/404.html` fallback restores deep links for client-side
routing.

## Roadmap

- Add more natural-sounding voice options.
- Improve PDF validation and conversion error messages.
- Add support for additional languages and voice settings.

## Author

Built by Jesus Ballesteros.

[LinkedIn](https://www.linkedin.com/in/ballesterosjesus/)
