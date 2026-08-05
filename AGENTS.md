# Electron App

## Stack

| Technology | Purpose |
|---|---|
| **Electron 43** | Desktop app framework (Chromium + Node.js) |
| **electron-vite 5** | Build tool — Vite for main/preload/renderer, HMR in dev |
| **React 19** | UI library (renderer process) |
| **TypeScript 7** | Typed JavaScript throughout |
| **Mantine 9** | UI component library (React) |
| **Zustand 5** | Lightweight state management |
| **TanStack Router 1** | Type-safe client-side routing |
| **better-sqlite3 12** | Synchronous SQLite3 driver (main process) |
| **drizzle-orm 0.45** | SQLite ORM — schema + migrations |
| **@electron/rebuild 4** | Rebuilds native modules after install |
| **pnpm 11** | Fast, disk-efficient package manager |

## Commands

| Command | Description |
|---|---|
| `pnpm dev` | Start dev server with HMR |
| `pnpm build` | Build for production |
| `pnpm preview` | Preview production build |
| `pnpm install` | Install deps + rebuild native modules (postinstall) |
| `pnpm approve-builds` | Approve native module builds |
| `pnpm db:generate` | Generate drizzle migration from schema |
| `pnpm db:push` | Apply schema without generating a migration |
| `pnpm dist:linux` | Build + package Linux distributable |

## Architecture

- **Main process** — Node.js, has access to `better-sqlite3` and Electron APIs.
  Exposes IPC handlers: tasks (`get/update/delete-task`), projects CRUD, statuses
  (CRUD + reorder + set default), timer (`get-active/start/stop`, single active
  session), time entries (list/summary/delete), my day toggles, autostart,
  notifications. Tray icon shows live timer in tooltip.
- **Preload** — Bridge between main and renderer. Exposes `window.api` via `contextBridge`.
- **Renderer** — React app in a sandboxed Chromium window. No Node.js access.
  Communicates with main process exclusively through `window.api`.
- **SQLite** — Database file stored in Electron's `userData` directory. Schema and
  migrations live in `src/main/db/` and `drizzle/` (drizzle-kit). Migrations are
  committed together with the schema change that introduces them.

## Guidelines
- Use mcp uservers you have to observe documentation or browse web
- Commit messages follow the convention in `docs/commits.md`
