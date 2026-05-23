# Sprout Brainstorm Assistant for Eazo

This is an Eazo Creator Next.js app that hosts the Sprout tree-shaped brainstorming prototype.

## Local Development

Install dependencies:

```bash
bun install
```

Start the development server:

```bash
bun dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project Layout

- `src/app/page.tsx` renders the Eazo app shell and loads the brainstorm workspace.
- `public/brainstorm/` contains the original static React prototype assets.
- `src/app/layout.tsx` defines app metadata and the root document shell.

## Eazo Environment

Copy `.env.example` to `.env` and set `EAZO_PRIVATE_KEY` if the app uses authenticated Eazo user APIs:

```bash
cp .env.example .env
```

The current prototype UI runs without server-side auth configuration.
