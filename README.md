# WeMeditateWeb

A modern meditation website delivering content at lightning speed from the edge.

## What is this?

WeMeditateWeb serves meditation content through a fast, accessible interface. Content comes from our headless CMS and is delivered globally through Cloudflare's edge network.

**Built with:** React, TypeScript, Tailwind CSS, and Cloudflare Workers

## Getting Started

### You'll need:
- Node.js 18+
- pnpm (`npm install -g pnpm`)

### Setup

1. **Install dependencies**
   ```bash
   pnpm install
   ```

2. **Configure environment**
   ```bash
   pnpm env:setup
   ```

   Then edit `.env.local` with your API keys (see `.env.example` for what you need).

3. **Start developing**
   ```bash
   pnpm dev
   ```

   Visit [http://localhost:5173](http://localhost:5173)

## Common Commands

```bash
pnpm dev              # Start development server
pnpm build            # Build for production
pnpm deploy           # Deploy to Cloudflare

pnpm ladle            # Open component library
pnpm lint             # Check code quality
```

## Project Structure

```
pages/          # App pages and routes
components/     # Reusable UI components
  atoms/        # Basic elements (buttons, inputs)
  molecules/    # Simple groups (form fields, cards)
  organisms/    # Complex sections (header, footer)
layouts/        # Page layouts
server/         # Backend logic and caching
```

## Key Features

- **Fast Global Delivery** - Runs on Cloudflare's edge network
- **Smart Caching** - Intelligent content caching reduces load times
- **Multi-Language** - Automatic locale handling for international content
- **Live Preview** - See content changes in real-time from the CMS
- **Component Library** - Isolated component development with Ladle

## Documentation

- **[CLAUDE.md](CLAUDE.md)** - Complete project guide
- **[DESIGN_SYSTEM.md](DESIGN_SYSTEM.md)** - Design patterns and components
- **[STORYBOOK.md](STORYBOOK.md)** - Component documentation guide

## Deployment

Deploy to Cloudflare Workers:

```bash
pnpm deploy
```

Make sure to configure environment variables in the Cloudflare dashboard first.

## Need Help?

- **Type errors?** Run `pnpm typecheck`
- **Port in use?** Run `lsof -ti:5173 | xargs kill`
- **Cache issues?** See [server/CACHING.md](server/CACHING.md)

## Contributing

We follow the Atomic Design methodology and maintain strict accessibility standards. Read [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md) before creating components.

