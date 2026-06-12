# Lunar IDE

My own IDE for Luau — built with Tauri, React, and Monaco Editor.

A personal project for an IDE that meets my needs for working with Roblox Studio.
It will always be free and source-available.

## Features

- **Luau editor** powered by Monaco, with [luau-lsp](https://github.com/JohnnyMorganz/luau-lsp)
  for autocomplete, diagnostics, and hover info
- **File explorer** with tabs, context menu, rename/create/delete
- **Command palette** and fuzzy file search
- **Integrated terminal** (xterm.js + native PTY)
- **Sync to Roblox Studio** via bundled [Rojo](https://github.com/rojo-rbx/rojo)
  or [Argon](https://github.com/argon-rbx/argon) servers
- **Toolchain manager** powered by [Rokit](https://github.com/rojo-rbx/rokit) —
  install tools like StyLua, Selene, Wally, Lune, and more
- **Themes** — Nord (default) and Dracula
- **Cross-platform** — Windows, macOS, and Linux

## Tech Stack

- **Frontend:** React 19 + TypeScript + Vite
- **Editor:** Monaco Editor
- **Backend:** Tauri 2 (Rust)
- **Language Server:** luau-lsp

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (or [Bun](https://bun.sh/))
- [Rust](https://www.rust-lang.org/tools/install)
- Tauri system dependencies — see the [Tauri prerequisites guide](https://tauri.app/start/prerequisites/)

### Installation

```bash
# Install dependencies
npm install

# Download bundled tool binaries (luau-lsp, rojo, argon, rokit)
npm run download-binaries
```

> `download-binaries` uses [Bun](https://bun.sh/) to fetch the latest releases
> for every supported platform into `src-tauri/binaries/`.

### Development

```bash
npm run tauri dev
```

### Build

```bash
npm run tauri build
```

## Acknowledgements

Lunar bundles and builds on top of these open source projects:

- [Tauri](https://github.com/tauri-apps/tauri) — MIT / Apache-2.0
- [React](https://github.com/facebook/react) — MIT
- [Monaco Editor](https://github.com/microsoft/monaco-editor) — MIT
- [luau-lsp](https://github.com/JohnnyMorganz/luau-lsp) — MIT
- [Luau](https://github.com/luau-lang/luau) — MIT
- [Rojo](https://github.com/rojo-rbx/rojo) — MPL-2.0
- [Argon](https://github.com/argon-rbx/argon) — Apache-2.0
- [Rokit](https://github.com/rojo-rbx/rokit) — MPL-2.0
- [Vite](https://github.com/vitejs/vite) — MIT
- [xterm.js](https://github.com/xtermjs/xterm.js) — MIT
- [react-resizable-panels](https://github.com/bvaughn/react-resizable-panels) — MIT

### Icons & Fonts

- [charmed-icons](https://github.com/littensy/charmed-icons) by Littensy — MIT (file-tree icons)
- [react-icons](https://github.com/react-icons/react-icons) — MIT
- [Inter](https://github.com/rsms/inter) — SIL Open Font License 1.1
- [JetBrains Mono](https://github.com/JetBrains/JetBrainsMono) — SIL Open Font License 1.1

## License

[PolyForm Noncommercial 1.0.0](LICENSE) — free to use, modify, and share for any
**noncommercial** purpose. Selling Lunar, or any product built on it, is not permitted.
