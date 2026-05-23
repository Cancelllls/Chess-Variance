# ♟️ Google Apps Script Chess

A beautifully designed, feature-rich Chess application built entirely within **Google Apps Script** (GAS). This project uses modern web technologies on the frontend (HTML/CSS/JS) and a high-performance CacheService architecture on the backend to deliver seamless online multiplayer, AI matchups, and deep post-game analysis.

---

## ✨ Features

- **🌐 Lightning-Fast Online Multiplayer:** Play in real-time with friends. The backend uses Google Apps Script `CacheService` to deliver sub-50ms reads/writes, effectively hiding server latency with advanced optimistic UI updates on the frontend.
- **🔍 Advanced Post-Game Analysis:** 
    - **Move Classification:** Automatically categorizes every move as *Best*, *Excellent*, *Good*, *Inaccuracy*, *Mistake*, or *Blunder*.
    - **Elo Estimation:** Provides a performance-based Elo estimate for both players using an Average Centipawn Loss (ACPL) heuristic.
    - **Cyberpunk Annotations:** Visual board feedback with neon overlays—Best moves glow cyan, while Blunders trigger a red "glitch-shake" animation.
- **📈 Live Evaluation Bar:** A Chess.com-style vertical bar powered by a sigmoid-based mathematical model, providing real-time engine evaluation (centipawns and mate threats).
- **🧩 Offline Puzzle Generator:** Never run out of puzzles! We've bundled a lightweight Web Worker version of `Stockfish.js` directly into the app. It dynamically simulates games and extracts deep tactical sequences on your local CPU.
- **🤖 Play vs Computer (Minimax AI):** Challenge an offline Minimax AI with customizable search depths and Alpha-Beta pruning.
- **🌙 Dynamic Dark Mode:** A beautifully designed dark theme tailored for chess, isolated from global image filters to keep pieces looking crisp and high-contrast.
- **💾 Save/Load & PGN Export:** Save your game states locally or export your matches directly to standard PGN files.

---

## 🏗️ Architecture

This app avoids complex external dependencies by cleverly bundling logic into Apps Script HTML templates:
- **`Code.gs`**: The backend server. Handles dynamic room creation and manages the state via `CacheService` with a persistent background fallback to Google Sheets.
- **`EngineWorker` (Web Worker)**: A sophisticated background processor that manages Stockfish.js. It handles:
    - **Live Eval:** Asynchronous depth-10 evaluation for the UI bar.
    - **Batch Analysis:** Iterative full-game processing for post-game reports.
    - **Puzzle Generation:** Continuous tactical sequence extraction.
- **Frontend Logic**: Implements optimistic UI predictions—instantly snapping pieces and predicting board states while network synchronization happens asynchronously.

---

## 🚀 Deployment Instructions

To deploy this project to your own Google Apps Script environment:

1. Create a new project at [script.google.com](https://script.google.com/).
2. Copy the contents of `Code.gs` into the script editor.
3. Create new HTML files in the script editor matching the names in this repository:
    - `Index.html`, `App.html`, `Stylesheet.html`, `Pieces.html`, `Engine.html`, `AI.html`, `Stockfish.html`, `PuzzleGen.html`.
4. Click **Deploy > New deployment**.
5. Select type **Web app**, execute as **Me**, and set access to **Anyone**.
6. Deploy and enjoy your personal chess server!

---

## 🎨 Design

The visual design embraces modern UI standards:
- **Bento-Box Reporting:** A sleek, brutalist grid for post-game statistics and Elo estimation.
- **Optimized Palette:** Sleek slate/green squares (Dark Mode explicitly uses `#769656` and `#eeeed2`).
- **Responsive Layout:** A pure CSS-Grid approach that scales smoothly on mobile and desktop.
- **Rich Interactions:** Drag-and-drop mechanics, animated piece shaking, and cyberpunk glitch effects for blunders.

---

## 📝 License
Released under the MIT License. Embedded `chess.js` logic belongs to its original creator (Jeff Hlywa). `Stockfish.js` is bundled for evaluation logic.