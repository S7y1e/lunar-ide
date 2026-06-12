# Lunar IDE

My own IDE for Luau — built with Tauri, React, and Monaco Editor.

A personal project for an IDE that meets my needs for working with Roblox Studio.
It will always be free and open source.

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
