# ♟️ Google Apps Script Chess (Pro UI Edition)

A professional-grade Chess application built entirely within **Google Apps Script** (GAS), meticulously designed to mimic the premium user experience of Chess.com. This project combines a high-performance WASM-powered engine architecture with a sleek, responsive frontend.

---

## ✨ Features

- **🌐 Lightning-Fast Online Multiplayer:** Real-time play powered by Google Apps Script `CacheService` for sub-50ms synchronization, paired with optimistic UI updates for zero-lag piece movement.
- **🎨 Chess.com Design System:** 
    - **Dark Mode Aesthetic:** Built with the official Chess.com color palette (`#312e2b` / `#262421`).
    - **Tactile UI:** 3D-effect action buttons and a clean, responsive split-pane layout.
    - **Classic Board:** Green and cream palette (`#739552` / `#ebecd0`) for optimal focus.
- **🔍 Professional Game Review:**
    - **Move Classification:** Industry-standard badges for *Brilliant (!!)*, *Great (!)*, *Best (★)*, *Inaccuracy*, *Mistake*, and *Blunder*.
    - **Accuracy Rings:** Visual SVG circular progress indicators for performance benchmarking.
    - **Elo Estimation:** ACPL-based heuristic model to estimate performance rating.
- **📈 Advanced Evaluation Bar:** Live engine feedback with a professional sigmoid-based advantage visualization.
- **⚡ High-Performance Engine Pool:**
    - **Multi-threaded Analysis:** Detects CPU cores and parallelizes full-game reviews using a pool of WASM Stockfish workers.
    - **WASM Powered:** Leverages WebAssembly for near-native calculation speeds.
- **🧩 Offline Puzzle Generator:** Dynamic tactical sequence extraction running fully on the local CPU.
- **🌙 Dynamic Styling:** Perfectly isolated piece assets that remain crisp and high-contrast in all theme modes.

---

## 🏗️ Architecture

- **`Code.gs`**: The GAS backend. Manages rooms and game states via `CacheService` with a persistent Sheets fallback.
- **`EnginePool` (Multi-threaded)**: A sophisticated background manager that distributes evaluation tasks across multiple Web Workers using `navigator.hardwareConcurrency`.
- **Frontend Logic**: Implements Chess.com-style move list rendering, debounced evaluations, and smooth SVG-based visual feedback.

---

## 🚀 Deployment Instructions

1. Create a new project at [script.google.com](https://script.google.com/).
2. Copy the contents of `Code.gs` into the script editor.
3. Create new HTML files matching the names in this repository:
    - `Index.html`, `App.html`, `Stylesheet.html`, `Pieces.html`, `Engine.html`, `AI.html`, `Stockfish.html`, `PuzzleGen.html`.
4. Click **Deploy > New deployment**.
5. Select type **Web app**, execute as **Me**, and set access to **Anyone**.
6. Deploy and enjoy your personal professional-grade chess server!

---

## 🎨 Design Notes

- **Optimized Palette:** Uses standard professional hex codes for board squares and piece highlighting.
- **Responsive Layout:** Flexbox/Grid architecture that adapts from wide desktop monitors to mobile touchscreens.
- **Performance Monitor:** Integrated real-time readout of thread usage and execution times during analysis.

---

## 📝 License
Released under the MIT License. Embedded `chess.js` logic belongs to its original creator (Jeff Hlywa). `Stockfish.js` is bundled for evaluation logic.