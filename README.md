# Lunar IDE

My own IDE for Luau — built with Tauri, React, and Monaco Editor.

A personal project for an IDE that meets my needs for working with Roblox Studio.
It will always be free and open source.

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

# Download language server binaries
npm run download-binaries
