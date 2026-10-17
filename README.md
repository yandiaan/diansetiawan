# Dian Setiawan portfolio

Portfolio built with Astro, TypeScript, and scoped CSS.

## Development

Use Node.js 22.12 or newer. Install dependencies with `npm install`.

| Command | Purpose |
| --- | --- |
| `npm run dev -- --background` | Start the background development server |
| `npm run astro -- dev status` | Check server status |
| `npm run astro -- dev logs` | Read server logs |
| `npm run astro -- dev stop` | Stop the server |
| `npm run build` | Build the static site into dist |
| `npm run preview` | Preview the production build |
| `node --experimental-strip-types --test tests/*.test.mjs` | Run regression tests |

## Editing the portfolio

Profile details, roles, navigation, and enquiry options live in `src/data/portfolio.ts`. Page composition lives in `src/pages/index.astro`. Components retain their scoped styles; browser behavior lives in typed initializers under `src/scripts/`.

See [architecture](docs/architecture.md) for component boundaries, cleanup behavior, and checks. Image attribution is recorded in [asset credits](docs/asset-credits.md).
