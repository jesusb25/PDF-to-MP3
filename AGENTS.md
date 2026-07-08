# AGENTS.md - PDF-to-MP3 Project Agents

This file defines specialized agents for the PDF-to-MP3 project to streamline development workflow.

## Available Agents

### 1. PDF Processing Agent
**Purpose**: Handle PDF parsing, text extraction, and document validation

**Use when**:
- Working with PDF extraction logic
- Debugging pdfjs-dist integration
- Optimizing text extraction from PDFs
- Handling PDF upload validation
- Dealing with multi-page PDF processing

**Files**: `index.js`, `server/server.js`

---

### 2. Audio & TTS Agent
**Purpose**: Manage text-to-speech conversion and audio generation

**Use when**:
- Implementing or debugging Google TTS API calls
- Optimizing voice quality or language settings
- Adding support for multiple voices
- Handling audio file streaming
- Converting audio formats or adjusting playback settings

**Files**: `server/server.js`, backend audio processing
**Dependencies**: `google-tts-api`, `node-gtts`

---

### 3. Backend API Agent
**Purpose**: Develop and maintain Express.js REST API endpoints

**Use when**:
- Creating new API routes
- Debugging server errors
- Implementing file upload handling
- Managing CORS and middleware
- Optimizing server performance
- Adding error handling and validation

**Files**: `server/server.js`
**Framework**: Express.js, Express-fileupload

---

### 4. Frontend UI Agent
**Purpose**: Build and maintain user interface components

**Use when**:
- Creating or modifying HTML pages (index.html, demo.html, mission.html)
- Styling with Bootstrap and CSS
- Implementing client-side JavaScript interactions
- Adding theme switching or responsive design
- Improving user experience

**Files**: `index.html`, `demo.html`, `mission.html`, `css/`, `index.js`
**Framework**: Bootstrap, HTML, CSS

---

### 5. Integration & Testing Agent
**Purpose**: Ensure cross-layer functionality and test workflows

**Use when**:
- Testing PDF upload → text extraction → TTS pipeline
- Debugging end-to-end functionality
- Implementing error handling and validation
- Testing API responses and client-side handling
- Verifying performance and reliability

**Files**: All project files
**Scope**: Integration testing, debugging workflows

---

### 6. DevOps & Deployment Agent
**Purpose**: Manage server setup, deployment, and environment configuration

**Use when**:
- Configuring environment variables
- Setting up production deployment (render.com)
- Managing Node.js version compatibility
- Installing and updating dependencies
- Configuring dev server (nodemon)

**Files**: `package.json`, `server/server.js`
**Commands**: `npm install`, `npm start`, deployment scripts

---

## How to Use

Invoke an agent by mentioning it in your request:
- "Use the PDF Processing Agent to optimize text extraction"
- "Have the Audio & TTS Agent add support for multiple voices"
- "Ask the Frontend UI Agent to add dark mode"

Each agent has specialized knowledge of its domain and will provide focused, efficient solutions.
