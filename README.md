# PDF to Podcast

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

- HTML, CSS, Bootstrap, and JavaScript for the frontend
- Express.js for the backend API
- `pdfjs-dist` for PDF text extraction
- `google-tts-api` for text-to-speech audio generation
- Render for the hosted backend API
- GitHub Pages for the hosted frontend

## Getting Started

### Prerequisites

- Node.js 18.16.0 or another compatible Node 18 release
- npm

### Installation

Clone the repository:

```sh
git clone https://github.com/jesusb25/PDF-to-MP3.git
cd PDF-to-MP3
```

Install dependencies:

```sh
npm install
```

Start the local server:

```sh
npm start
```

The server serves the static app at:

```text
http://localhost:8000
```

## API Overview

The Express server exposes two main endpoints:

- `POST /get-text`: accepts an uploaded PDF file and returns extracted text.
- `GET /base64data?text=...`: converts text into base64-encoded MP3 audio data.

The current frontend is configured to call the hosted Render API at `https://pdf-to-mp3.onrender.com`.

## Project Structure

```text
.
|-- index.html          # Main app interface
|-- index.js            # Frontend PDF upload and MP3 download logic
|-- server/server.js    # Express API for PDF extraction and TTS conversion
|-- demo.html           # Demo page
|-- mission.html        # Project mission page
|-- css/                # Page styles
|-- images/             # UI assets
`-- assets/demo.mov     # Demo recording
```

## Roadmap

- Add more natural-sounding voice options.
- Improve PDF validation and conversion error messages.
- Add support for additional languages and voice settings.

## Author

Built by Jesus Ballesteros.

[LinkedIn](https://www.linkedin.com/in/ballesterosjesus/)
