# Repository Guidelines

## Project Structure & Module Organization
`src/` contains the application code. Use `src/presentation/` for React screens, layout components, and hooks; `src/usecase/` for business actions and DTO/model types; `src/service/` for GraphQL and storage integrations; `src/stores/` and `src/presentation/store/` for Zustand-based state; `src/theme/` and `src/locales/` for theming and translations. Static assets and PWA files live in `src/public/`. Build output goes to `dist/` and should not be edited by hand.

## Build, Test, and Development Commands
Use `npm install` to sync dependencies. `npm start` runs `webpack-dev-server`; set `APP_PORT` in `.env` if you need a different port. `npm run build` creates a production bundle in `dist/`. Docker-based flows are wrapped in `make start`, `make startall`, `make down`, and `make install`. Example: `make startall` rebuilds the image and starts the `gold_front` container on port `8083`.

## Coding Style & Naming Conventions
This repo uses TypeScript with `strict` mode enabled. Follow the existing 2-space indentation and semicolon-based style in `.ts`, `.tsx`, and `webpack.config.js`. Keep React components in PascalCase (`LayoutProtectedExt.tsx`), hooks in camelCase (`useAccounts.ts`), and use case files in the `feature.action.usecase.ts` pattern. Prefer configured path aliases such as `@presentation/*` and `@usecase/*` over long relative imports.

## Testing Guidelines
There is no committed test suite or `npm test` script yet. For now, validate changes with `npm run build` and a manual smoke test through `npm start` or Docker, especially around routing, GraphQL calls, and i18n strings. When adding tests, place them next to the feature or under a dedicated `src/**/__tests__/` folder and use `*.test.ts` or `*.test.tsx`.

## Commit & Pull Request Guidelines
Recent history mixes short refactor commits with one descriptive `feat:` commit. Prefer concise, imperative messages such as `feat: add cashflow chart filters` or `refactor: simplify operation form state`. Keep pull requests focused, describe user-visible changes, link the relevant issue, and include screenshots for UI work. Call out any `.env`, API contract, or Docker impact in the PR body.

## Configuration Tips
Copy `.env.template` to `.env` and set `APP_MODE`, `APP_PORT`, and backend endpoints before local development. Do not commit real tokens or environment-specific secrets.
