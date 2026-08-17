# Contributing to Overtone

First off, thank you for considering contributing to **Overtone**! 🎉 It's people like you that make Overtone an awesome local-first music experience for everyone.

Following these guidelines helps to communicate that you respect the time of the developers managing and developing this open source project. In return, they should reciprocate that respect in addressing your issue, assessing changes, and helping you finalize your pull requests.

---

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How Can I Contribute?](#how-can-i-contribute)
  - [Reporting Bugs](#reporting-bugs)
  - [Suggesting Enhancements](#suggesting-enhancements)
  - [Pull Requests](#pull-requests)
- [Development Setup](#development-setup)
- [Project Architecture](#project-architecture)
- [Coding Guidelines](#coding-guidelines)
- [Commit Conventions](#commit-conventions)

---

## Code of Conduct

This project and everyone participating in it is governed by the [Overtone Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code. Please report unacceptable behavior to the project maintainers.

---

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check existing issues as you might find that you don't need to create a new one. When you are creating a bug report, please include as many details as possible:

1. **Use a clear and descriptive title**.
2. **Describe the exact steps which reproduce the problem**.
3. **Provide specific examples to demonstrate the steps** (e.g., audio file format, folder structure).
4. **Describe the behavior you observed after following the steps** and explain what behavior you expected to see.
5. **Include operating system details and logs** (accessible via DevTools in development).

### Suggesting Enhancements

Feature suggestions are tracked as GitHub issues. When creating a feature request:

1. **Use a clear and descriptive title**.
2. **Provide a detailed description of the proposed feature or improvement**.
3. **Explain why this enhancement would be useful** to most Overtone users.
4. **Include screenshots, mockups, or UI references** if applicable.

---

## Development Setup

### Prerequisites

- **Node.js**: `v20.x` or higher
- **npm**: `v10.x` or higher
- **Git**: Latest version

### Local Setup Steps

1. **Fork and clone the repository:**
   ```bash
   git clone https://github.com/<your-username>/overtune.git
   cd overtune
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the local development environment:**
   ```bash
   npm run dev
   ```
   *This concurrently spins up the Next.js renderer on `http://localhost:3000` and boots the Electron main process.*

4. **Run linters and typechecks:**
   ```bash
   npm run lint
   npm run typecheck
   ```

5. **Build installer bundle locally:**
   ```bash
   npm run build:installer
   ```

---

## Project Architecture

```
overtune/
├── main/                       # Electron Main Process (Node.js runtime)
│   ├── db.ts                   # SQLite schema, queries, favorites, playlist CRUD & M3U
│   ├── scanner.ts              # ID3 scanner, folder watcher (chokidar) & artwork cache
│   ├── preload.ts              # Secure IPC ContextBridge API definition
│   └── main.ts                 # Window management, custom local:// protocol & IPC handlers
│
├── src/                        # Next.js Frontend (React 19, TypeScript, Tailwind CSS)
│   ├── app/
│   │   ├── layout.tsx          # Root Next.js layout & metadata
│   │   └── page.tsx            # Master orchestrator for layouts & views
│   ├── components/             # Modular UI Components (Themes, Player, Views, Modals)
│   ├── store/
│   │   └── usePlayerStore.ts   # Zustand central store for playback & UI state
│   ├── types/                  # TypeScript definitions (music.ts, global.d.ts)
│   └── lib/                    # Helper utilities (time formatting, local:// URLs)
│
├── scripts/
│   ├── build-installer.js      # Automated 6-step .exe installer build pipeline
│   └── generate-icons.js       # Multi-resolution ICO and asset generator
└── release/                    # Output directory for packaged .exe installers
```

---

## Coding Guidelines

- **TypeScript Strictness**: Always write strongly-typed TypeScript code. Avoid using `any`; define explicit interfaces in `src/types/`.
- **Component Design**: Build modular, reusable components. Do not declare sub-components inside the render function of another component.
- **Electron Security**:
  - Never enable `nodeIntegration: true` in renderer webPreferences.
  - Expose only explicitly typed IPC methods through `main/preload.ts` via `contextBridge.exposeInMainWorld('api', ...)`.
- **Styling**: Use Tailwind CSS utility classes and ensure seamless theme support (both `Light` and `Dark` modes).
- **Performance**: Keep synchronous database queries minimal, use indexed SQLite queries in WAL mode, and stream audio chunks via `local://` protocol with HTTP 206 Partial Content headers.

---

## Commit Conventions

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

- `feat:` A new feature
- `fix:` A bug fix
- `docs:` Documentation only changes
- `style:` Changes that do not affect the meaning of the code (white-space, formatting, etc.)
- `refactor:` A code change that neither fixes a bug nor adds a feature
- `perf:` A code change that improves performance
- `test:` Adding missing tests or correcting existing tests
- `chore:` Changes to the build process or auxiliary tools

*Example:*
```bash
git commit -m "feat(audio): add support for m3u8 playlist parsing"
```

---

## Pull Request Process

1. Create a descriptive branch: `git checkout -b feature/your-feature-name` or `git checkout -b fix/issue-description`.
2. Ensure your code passes all lint checks (`npm run lint`) and TypeScript checks (`npm run typecheck`).
3. Commit your changes following the commit guidelines.
4. Push your branch to your fork: `git push origin feature/your-feature-name`.
5. Open a Pull Request against the `main` branch of `gitnaseem745/overtune`.
6. Fill out the [Pull Request Template](.github/PULL_REQUEST_TEMPLATE.md) completely.
7. Be responsive to feedback and review comments from the maintainers.

Thank you for contributing to Overtone! 🎵
