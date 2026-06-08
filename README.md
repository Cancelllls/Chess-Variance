# Serverless Google Apps Script Chess (Chess.com Clone)

A high-performance, real-time multiplayer chess application built entirely on **Google Apps Script** (GAS) and HTML/JS. This project delivers a professional, "Chess.com-style" experience with advanced features typically reserved for major platforms, all running serverless in the Google ecosystem.

---

## ✨ New & Advanced Features

- **🌐 Lightning-Fast Multiplayer:** Real-time play powered by GAS `CacheService` and `LockService`. Achieves high-speed synchronization by bypassing traditional Google Sheets latency.
- **🎨 Pro UI/UX (Chess.com Style):** A pixel-perfect dark mode interface featuring a redesigned sidebar-integrated menu, tactile 3D buttons, and the classic green/cream board aesthetic.
- **🤖 Advanced Bot Roster:** Challenge 8 distinct AI personalities with varying skill levels and ELO ratings:
    - **Jimmy (400)**, **Martin (800)**, **Sarah (1000)**, **Nelson (1300)**, **Marcus (1600)**, **Antonio (1800)**, **Alpha (2200)**, and **Magnus (3200)**.
    - Each bot features a polished, minimalist SVG avatar and dedicated engine depth mapping.
- **🧩 Progressive Tactical Puzzles:** Train with a curated dataset of real-world tactics that scale in difficulty as you improve.
    - **Levels 1-3:** Starts with Mate-in-1s and progresses to complex 3+ move sequences.
    - **Descriptive Objectives:** (e.g., "Checkmate in 1") displayed in the HUD.
    - **Manual Progression:** Move through puzzles at your own pace with the "Next Puzzle" button.
- **🔍 Professional Review & Deep Analysis:** 
    - **Ultra-Accurate Evaluation:** Refined centipawn loss (CPL) math for precise move grading.
    - **Move Classification:** Industry-standard badges for *Brilliant (!!)*, *Great (!)*, *Best (★)*, *Excellent*, *Good*, *Inaccuracy*, *Mistake*, and *Blunder*.
    - **Accuracy Rings:** SVG circular indicators for performance benchmarking.
- **🤺 Smooth Piece Animations:** Robust **FLIP (First, Last, Invert, Play)** implementation ensures pieces glide smoothly across the board, even from the Black perspective (flipped board).
- **📉 Dynamic Evaluation Bar:** Real-time engine feedback with sigmoid-based visualization for professional advantage tracking.
- **💎 Material Advantage Tracker:** Displays captured pieces using high-fidelity miniature SVGs and calculates live material imbalance (e.g., +3).
- **⏱️ Flexible Time Controls:** Choose between several Blitz, Rapid, and Classical durations, or play a casual game with **Unlimited Time**.
- **♟️ Elite Chess Mechanics:** 
    - **Premove Queueing:** Plan moves during your opponent's turn.
    - **Legal Move Hints:** High-contrast dots and circles for valid destinations/captures.
    - **Bidirectional Takebacks:** Request and approve undos in real-time.
    - **Right-Click Visualization:** High-speed drawing of L-shaped Knight arrows and tactical circles.
- **🔊 High-Fidelity Feedback:** 
    - **Audio:** Move, capture, check, and game-over sounds synthesized locally via the Web Audio API.
    - **Haptics:** Hardware vibration feedback on mobile devices for tactile gameplay.

---

## 🏗️ Architecture

- **Backend (`Code.gs`)**: Uses `CacheService` as a high-speed database and `LockService` for atomicity. Synchronizes full PGN history to ensure state consistency during reviews.
- **Frontend (`App.html`)**: Implements **Optimistic UI updates**, local countdown timers, and hardware-accelerated piece animations.
- **Engine (`Stockfish WASM`)**: Runs in a multi-threaded worker pool to provide deep analysis without blocking the UI.

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

- **Author:** Cancellls
- **Website:** [cancellls.com](https://cancellls.com)
- **License:** MIT

---

*Note: This application requires an active internet connection for multiplayer synchronization. Offline Puzzles and AI modes run locally on your device's CPU via Web Workers.*
