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
| **pnpm 11** | Fast, disk-efficient package manager |

## Project Structure

```
src/
├── main/
│   ├── index.ts          Electron entry, BrowserWindow
│   └── database.ts       SQLite init, IPC handlers
├── preload/
│   └── index.ts          contextBridge → window.api
└── renderer/
    ├── index.html
    └── src/
        ├── main.tsx          React entry
        ├── routeTree.ts      TanStack Router config
        ├── types.ts          Shared types + Window API
        ├── routes/
        │   ├── tasks.lazy.tsx        /tasks page
        │   ├── tasks-new.lazy.tsx    /tasks/new page
        │   ├── tasks-edit.lazy.tsx   /tasks/$id/edit page
        │   ├── task-detail.lazy.tsx  /tasks/$id page
        │   ├── today.lazy.tsx        /tasks/today page
        │   └── time-entries.lazy.tsx /time-entries page
        ├── store/
        │   └── tasks.ts         Zustand store
        └── components/
            └── TaskForm.tsx     Add-task form
```

## Commands

| Command | Description |
|---|---|
| `pnpm dev` | Start dev server with HMR |
| `pnpm build` | Build for production |
| `pnpm preview` | Preview production build |
| `pnpm install` | Install deps + rebuild native modules |
| `pnpm approve-builds` | Approve native module builds |

## Architecture

- **Main process** — Node.js, has access to `better-sqlite3` and Electron APIs.
  Exposes IPC handlers: `get-tasks`, `add-task`, `delete-task`.
- **Preload** — Bridge between main and renderer. Exposes `window.api` via `contextBridge`.
- **Renderer** — React app in a sandboxed Chromium window. No Node.js access.
  Communicates with main process exclusively through `window.api`.
- **SQLite** — Database file stored in Electron's `userData` directory.

## Guidlines
- Use mcp uservers you have to observe documentation or browse web
