# WeMeditateWeb

Welcome! This repo powers the WeMeditate web experience. It is a fast, accessible meditation site built with React, TypeScript, Vike, Tailwind CSS, and Cloudflare Workers.

## Quick start

### Prerequisites
- Node.js `22.17.0` (see `.node-version`)
- pnpm (`npm install -g pnpm`)

### Setup
1. Install dependencies:
   ```bash
   pnpm install
   ```

2. Create your local environment file:
   ```bash
   pnpm env:setup
   ```

3. Fill in `.env.local` using `.env.example` as a reference.

### Run locally
```bash
pnpm dev
```
Then open `http://localhost:5173`.

## Key commands

| Command | Purpose |
| --- | --- |
| `pnpm dev` | Start the local dev server. |
| `pnpm build` | Build the production client and server bundles. |
| `pnpm preview` | Preview the production build locally. |
| `pnpm prod` | Build and run the production server locally with Wrangler. |
| `pnpm deploy` | Build and deploy to Cloudflare. |
| `pnpm lint` | Run ESLint across the codebase. |
| `pnpm test` | Run tests in watch mode. |
| `pnpm test:run` | Run tests once (CI style). |
| `pnpm test:ui` | Open the Vitest UI runner. |
| `pnpm ladle` | Run the component library locally. |
| `pnpm ladle:build` | Build the component library for static hosting. |
| `pnpm env:setup` | Copy `.env.example` to `.env.local`. |
| `pnpm types:cms` | Refresh CMS types from the external Payload repo (requires network). |

## Project structure

```
pages/          # Vike pages and routes
components/     # Reusable UI components
layouts/        # Layout wrappers
hooks/          # Shared React hooks
server/         # Backend logic, caching, CMS integration
public/         # Static assets
```

## Working agreements
- Review `DEVELOPMENT_STANDARDS.md` before making changes.
- Follow the component rules in `DESIGN_SYSTEM.md`.
- Use `STORYBOOK.md` for component library guidance.

## Help & docs
- `CLAUDE.md` provides the full project guide.
- `MCP_USAGE.md` documents MCP usage.
- `STORYBOOK.md` explains the component documentation flow.

## Common issues
- If local config changes are not taking effect, delete `.env.local` and rerun `pnpm env:setup`.
- If `pnpm deploy` fails, confirm your Cloudflare credentials and environment variables are configured.
