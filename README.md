# Serverless Google Apps Script Chess

A professional-grade, high-performance, real-time multiplayer chess application built entirely on **Google Apps Script** (GAS) and HTML/JS. This project leverages serverless architectures to deliver a responsive, production-ready experience with advanced features typically reserved for major platforms.

---

## ✨ Advanced Features

- **🌐 Lightning-Fast Multiplayer:** Real-time play powered by GAS `CacheService` and `LockService`. Achieves sub-50ms synchronization to bypass traditional Google Sheets latency.
- **🎨 Pro UI/UX (Chess.com Style):** A pixel-perfect dark mode interface featuring tactile 3D buttons, a responsive split-pane layout, and the classic green/cream board aesthetic.
- **⏱️ Flexible Time Controls:** Choose between several Blitz, Rapid, and Classical durations, or play a casual game with **Unlimited Time** (indicated by the infinity symbol).
- **🏆 Persistent Office Leaderboard:** A persistent ELO rating system stored in Google Sheets. Compete with colleagues and track wins, losses, and draws.
- **👁️ Spectator Mode:** Join any active room as a spectator to watch games live. Supports an unlimited number of viewers per room.
- **🔊 High-Fidelity Feedback:** 
    - **Audio:** Move, capture, check, and game-over sounds synthesized locally via the Web Audio API.
    - **Haptics:** Hardware vibration feedback on mobile devices for tactile gameplay (vibrates on moves and captures).
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
- **♟️ Advanced Gameplay:** 
    - **Premove Queueing:** Plan moves during your opponent's turn.
    - **Bidirectional Takebacks:** Undo moves with opponent approval.
    - **Resign & Draw:** Explicit end-game controls with mutual handshake logic.
    - **Right-Click Visualization:** High-speed drawing of Arrows & Circles for tactical planning.
    - **Smooth Animations:** Hardware-accelerated CSS transitions for fluid piece movement.

---

## 🏗️ Architecture

- **Backend (`Code.gs`)**: Uses `CacheService` as a high-speed database and `LockService` for atomicity. Standardized JSON error handling ensures stability.
- **Persistent Data**: Google Sheets stores the "Players" leaderboard (Elo, W/L/D) and "ChessGames" history.
- **Frontend (`App.html`)**: Implements **Optimistic UI updates**, local countdown timers, and hardware-accelerated piece animations.
- **Engine (`Stockfish WASM`)**: Runs in a multi-threaded worker pool to provide deep analysis and real-time evaluation without blocking the UI.

---

## 🚀 Deployment Instructions

### Method 1: Google Apps Script Web Editor
1. Go to [script.google.com](https://script.google.com/) and create a new project.
2. Copy the contents of `Code.gs` into the `Code.gs` file in the editor.
3. Create new HTML files for each `.html` file in this repository (e.g., `Index.html`, `App.html`, `Stylesheet.html`, etc.) and paste the corresponding code.
4. Click **Deploy > New deployment**.
5. Select **Web app**, set "Execute as" to **Me**, and "Who has access" to **Anyone**.
6. Copy the web app URL and start playing!

---

## 👨‍💻 Author

- **Author:** Abdalrahman
- **Website:** [cancellls.com](https://cancellls.com)
- **License:** MIT

---

*Note: This application requires an active internet connection for multiplayer synchronization. Offline Puzzles and AI modes run locally on your device's CPU via Web Workers. Hardware haptics require a supported mobile device.*