# Fast Type Trainer

A privacy-first typing speed trainer built with React + Vite + TypeScript. The app is fully client-side, works offline, and stores all data locally (IndexedDB + localStorage). It includes guided progression, custom sessions, multilingual support, and a modern, minimal UI.

## Features

- **Progressive training** with level system and guided sessions
- **Custom sessions** (word count, min word length, language, timer)
- **Initial skill test** to set your level
- **Performance tracking**: WPM, accuracy, CPS, history, charts
- **Multi-language UI + content**: English, French, Hebrew (RTL)
- **Offline-first** with PWA support
- **Keyboard layout detection flow** (stored in profile)
- **Import/Export** full data as JSON
- **Profile system** stored in IndexedDB (Dexie)

## Tech Stack

- React + Vite + TypeScript
- TailwindCSS
- Zustand
- Dexie (IndexedDB wrapper)
- i18next (i18n + RTL)
- Vite PWA

## Local Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Data & Privacy

All data is stored in the browser:
- **IndexedDB**: profiles, sessions, wordlists, stats
- **localStorage**: theme, UI language, preferences

No backend or external tracking is used.

## Project Structure (high level)

- `src/components/` — UI components (onboarding, typing test, charts)
- `src/utils/` — word lists, metrics, import/export helpers
- `src/store/` — Zustand state stores
- `src/db.ts` — Dexie database setup
- `public/wordlists/` — bundled word lists per language

---

Fast Type Trainer is designed to be modular, maintainable, and scalable. Feel free to extend it with more languages, richer word lists, or new training modes.
