# tab-mama

<img src="public/icons/icon-128.png" width="96" alt="tab-mama icon"/>

[![CI](https://github.com/smith-30/tab-mama/actions/workflows/ci.yml/badge.svg)](https://github.com/smith-30/tab-mama/actions/workflows/ci.yml)
[![prek](https://img.shields.io/endpoint?url=https://raw.githubusercontent.com/j178/prek/master/docs/assets/badge-v0.json)](https://github.com/j178/prek)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![OpenSSF Scorecard](https://api.securityscorecards.dev/projects/github.com/smith-30/tab-mama/badge)](https://securityscorecards.dev/viewer/?uri=github.com/smith-30/tab-mama)

[日本語](README.ja.md)

A Chrome extension (Manifest V3) that automatically manages your tabs.

## Features

- **Idle close** — Automatically closes tabs that haven't been active for a configured duration (default: 60 min)
- **Duplicate close** — When multiple tabs share the same URL, closes the older ones (open for 10+ min) and keeps the latest
- **Domain sort** — Sorts tabs alphabetically by hostname every 5 minutes; within the same domain, older tabs come first

Pinned tabs and the currently active tab are always excluded.

## Settings

Configurable from the popup. Values are persisted in `chrome.storage.local` and survive restarts.

| Setting | Default | Range |
|---|---|---|
| Tab limit (excluding pinned) | 10 | 1–99 |
| Idle threshold | 60 min | 10–480 min (10 min steps) |

Idle close and duplicate close are skipped when the unpinned tab count is at or below the limit.

## Development

### Setup

```bash
pnpm install
```

### Commands

| Command | Description |
|---|---|
| `pnpm test` | Run unit tests (vitest) |
| `pnpm test:watch` | Run tests in watch mode |
| `pnpm lint` | Lint with oxlint |
| `pnpm lint:fix` | Auto-fix lint issues |
| `pnpm format` | Format with oxfmt |
| `pnpm format:check` | Check formatting only |
| `pnpm build` | Production build to `dist/` |
| `pnpm dev` | Development build (HMR) |

### Loading into Chrome

1. Run `pnpm build`
2. Open `chrome://extensions`
3. Enable **Developer mode** (top right)
4. Click **Load unpacked** and select the `dist/` directory

## Architecture

```
src/
├── config.ts           # Default threshold constants
├── background/
│   └── index.ts        # Service Worker — wires alarms and event listeners
├── lib/                # Pure logic with no Chrome API dependency
│   ├── idle.ts         # Computes tab IDs to close by idle
│   ├── dedup.ts        # Computes tab IDs to close by deduplication
│   ├── sort.ts         # Computes move plan for domain sorting
│   └── types.ts        # Shared type definitions
├── storage/
│   └── tabMeta.ts      # chrome.storage.local wrapper (tab metadata / enabled flag / settings)
├── chrome/
│   └── tabs.ts         # Thin wrapper around chrome.tabs and chrome.alarms
└── popup/
    ├── index.html
    ├── main.tsx
    └── App.tsx         # Power toggle / tab count / settings UI
tests/
├── idle.test.ts
├── dedup.test.ts
└── sort.test.ts
```

### Code Quality

| Tool | Role |
|---|---|
| **oxlint** | Lints TypeScript / React / unicorn rule sets |
| **oxfmt** | Prettier-compatible formatter (`singleQuote` / `trailingComma: all` / `sortImports`) |
| **secretlint** | Checks for leaked secrets before each commit |
| **prek** | Rust-based pre-commit hook runner |

On every commit: `oxfmt --check` → `oxlint` → `secretlint` → `vitest`.

### Handling MV3 Constraints

Service Workers are killed when idle, so long-running `setTimeout` timers are not viable. Instead:

- Tab metadata (`openedAt` / `lastActiveAt` / `url`) is persisted in `chrome.storage.local`
- `chrome.alarms` wakes the worker periodically to scan and process tabs (alarms survive SW termination)
- User settings (tab limit, idle threshold) are also stored in `chrome.storage.local` and read on each alarm
