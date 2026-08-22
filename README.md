# ShineMate × Правильные технологии

Client-facing product presentation and catalogue for ShineMate detailing equipment in Russia.

**Live:** https://matras0v.github.io/shinemate/

## Stack

React 18 + TypeScript + Vite + Tailwind CSS + Framer Motion. No backend — the catalogue and lead form run entirely client-side; the form falls back to a `mailto:` draft.

## Run locally

```bash
npm install
npm run dev       # http://localhost:5173
```

## Build

```bash
npm run build      # production build → dist/
npm run preview    # serve the built output locally
```

## Deploy

Push to `main` — GitHub Actions (`.github/workflows/deploy.yml`) builds the project and publishes `dist/` to GitHub Pages automatically. The site is served under `/shinemate/`, configured via Vite's `base` option.
