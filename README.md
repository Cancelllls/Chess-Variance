# Serverless Google Apps Script Chess

A high-performance, real-time multiplayer chess application built entirely on **Google Apps Script** (GAS) and HTML/JS. This project demonstrates how to leverage serverless architectures to create a responsive, production-grade web application with complex state synchronization.

---

## ✨ Advanced Features

- **🌐 Lightning-Fast Multiplayer:** Real-time play powered by Google Apps Script `CacheService` and `LockService`. Achieves sub-50ms synchronization to bypass traditional Google Sheets latency.
- **🎨 Pro UI/UX (Chess.com Style):** A pixel-perfect dark mode interface featuring tactile 3D buttons, a responsive split-pane layout, and the classic green/cream board aesthetic.
- **⚡ High-Performance Engine Pool:** A multi-threaded background analysis system using a pool of **WASM Stockfish** workers. Detects your CPU core count to parallelize full-game reviews.
- **🔍 Professional Review Suite:** 
    - **Move Classification:** Industry-standard badges for *Brilliant (!!)*, *Great (!)*, *Best (★)*, and *Blunders*.
    - **Accuracy Rings:** SVG circular indicators for performance benchmarking.
    - **Elo Estimation:** ACPL-based heuristic model to estimate performance ratings.
- **📈 Dynamic Evaluation Bar:** Real-time engine feedback using a sigmoid-based visualization for smoother advantage transitions.
- **🛡️ Robust System Resilience:** 
    - **Exponential Backoff:** Intelligent polling logic that retries failed connections with increasing delays.
    - **Hard Sync:** Automated state reconciliation that fixes desynchronization without page refreshes.
    - **Connection Monitoring:** Live status indicators (Green/Yellow/Red) with an auto-locking board during instability.
- **♟️ Advanced Gameplay:** Supports **Premove Queueing**, **Bidirectional Takebacks** (with handshake logic), and **Right-Click Visualization** (Arrows & Circles).

---

## 🏗️ Architecture

- **Backend (`Code.gs`)**: Uses `CacheService` as a high-speed, serverless real-time database. All state mutations are protected by `LockService` to prevent race conditions during simultaneous moves or takeback requests. Standardized JSON error handling ensures the client never receives raw HTML error pages.
- **Frontend (`App.html`)**: Implements **Optimistic UI updates** (Client-side Prediction). Moves are rendered instantly on the local `chess.js` instance before being synchronized asynchronously with the server.
- **Worker Pool (`PuzzleGen.html`)**: Manages a singleton pool of Stockfish.js workers, utilizing **WebAssembly** for near-native calculation speeds for both live evaluation and batch game processing.

---

## 🚀 Deployment Instructions

### Method 1: Google Apps Script Web Editor
1. Go to [script.google.com](https://script.google.com/) and create a new project.
2. Copy the contents of `Code.gs` into the `Code.gs` file in the editor.
3. Create new HTML files for each `.html` file in this repository (e.g., `Index.html`, `App.html`, `Stylesheet.html`, etc.) and paste the corresponding code.
4. Click **Deploy > New deployment**.
5. Select **Web app**, set "Execute as" to **Me**, and "Who has access" to **Anyone**.
6. Copy the web app URL and start playing!

### Method 2: Clasp (CLI)
1. Install `clasp`: `npm install -g @google/clasp`.
2. Login: `clasp login`.
3. Clone/Create project: `clasp create --title "GAS Chess" --type webapp`.
4. Push files: `clasp push`.

---

## 👨‍💻 Author

- **Author:** Abdalrahman
- **Website:** [cancellls.com](https://cancellls.com)
- **License:** MIT

---

*Note: This application requires an active internet connection for multiplayer synchronization. Offline Puzzles and AI modes run locally on your device's CPU via Web Workers.*