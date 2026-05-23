# ♟️ Google Apps Script Chess

A beautifully designed, feature-rich Chess application built entirely within **Google Apps Script** (GAS). This project uses modern web technologies on the frontend (HTML/CSS/JS) and a high-performance CacheService architecture on the backend to deliver seamless online multiplayer, AI matchups, and offline puzzle generation.

---

## ✨ Features

- **🌐 Lightning-Fast Online Multiplayer:** Play in real-time with friends. The backend now uses Google Apps Script `CacheService` to deliver sub-50ms reads/writes, effectively hiding server latency with advanced optimistic UI updates on the frontend.
- **🧩 Offline Puzzle Generator:** Never run out of puzzles! We've bundled a lightweight Web Worker version of `Stockfish.js` directly into the app. It dynamically simulates games, evaluates positions, and extracts deep tactical sequences all on your local CPU.
- **🤖 Play vs Computer (Minimax AI):** Challenge an offline Minimax AI with customizable search depths and Alpha-Beta pruning.
- **🤝 Local Pass & Play:** Play against a friend on the same device.
- **🌙 Dynamic Dark Mode:** A beautifully designed dark theme tailored for chess, completely isolated from global image filters to keep pieces looking crisp and high-contrast.
- **💾 Save/Load & PGN Export:** Save your game states locally or export your matches directly to standard PGN files.

---

## 🏗️ Architecture

This app avoids complex external dependencies by cleverly bundling logic into Apps Script HTML templates:
- **`Code.gs`**: The backend server. Handles dynamic room creation and manages the state via `CacheService` with a persistent background fallback to Google Sheets.
- **`Index.html` & `App.html`**: The UI and client-side logic. Implements optimistic UI predictions—instantly snapping pieces and predicting board states while network synchronization happens asynchronously.
- **`Engine.html` & `AI.html`**: Bundles `chess.js` and a custom-built Minimax AI.
- **`Stockfish.html` & `PuzzleGen.html`**: Instantiates a background Web Worker from a local `Blob` containing `Stockfish.js`. It runs continuous evaluation loops without blocking the main UI thread.

---

## 🚀 Deployment Instructions

To deploy this project to your own Google Apps Script environment:

1. Create a new project at [script.google.com](https://script.google.com/).
2. Copy the contents of `Code.gs` into the script editor.
3. Create new HTML files in the script editor matching the exact names in this repository (e.g., `Index.html`, `App.html`, `Stylesheet.html`, `Pieces.html`, `Engine.html`, `AI.html`, `Stockfish.html`, `PuzzleGen.html`) and copy their respective contents over.
4. Click **Deploy > New deployment**.
5. Select type **Web app**.
6. Execute as: **Me**. Who has access: **Anyone** (or restrict to your Google Workspace).
7. Deploy and enjoy your personal chess server!

---

## 🎨 Design

The visual design embraces modern UI standards:
- **Optimized Palette:** Sleek slate/green squares for modern aesthetics (Dark Mode squares explicitly use `#769656` and `#eeeed2`).
- **Responsive Layout:** A pure CSS-Grid approach that scales smoothly on mobile and desktop.
- **Rich Interactions:** Drag-and-drop mechanics, animated piece shaking for illegal moves, smooth modal popups, and native HTML5 audio hooks.

---

## 📝 License
Released under the MIT License. Embedded `chess.js` logic belongs to its original creator (Jeff Hlywa). `Stockfish.js` is bundled for evaluation logic.