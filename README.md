# ♟️ Chess Pro: Serverless Google Apps Script Chess Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Google Apps Script](https://img.shields.io/badge/Google%20Apps%20Script-4285F4?style=flat&logo=google-apps-script&logoColor=white)](https://developers.google.com/apps-script)
[![Chess.com Style](https://img.shields.io/badge/Style-Chess.com-00B200?style=flat)](https://chess.com)

A high-performance, full-featured chess platform built entirely within the Google Apps Script ecosystem. Experience a "Chess.com-style" interface with real-time multiplayer, advanced AI opponents, and deep game analysis—all running serverless.

---

## 🚀 Key Features

### 🎮 Gameplay & Multiplayer
- **Lightning-Fast Multiplayer:** Real-time synchronization using Google's `CacheService` and `LockService`, with version-aware polling for minimal latency.
- **Optimistic UI:** Smooth piece movement and immediate feedback with hardware-accelerated **FLIP animations**.
- **Advanced Mechanics:** Support for premove queueing, legal move hints, and right-click tactical visualizations (arrows/circles).
- **Time Controls:** Flexible blitz, rapid, and classical durations, including casual "Unlimited" mode.

### 🤖 AI & Deep Analysis
- **Integrated Engine:** Client-side deep analysis powered by Stockfish WASM.
- **AI Bot Roster:** Challenge 8 distinct personalities with varying ELO ratings:
    - **Jimmy (400)**, **Martin (800)**, **Sarah (1000)**, **Nelson (1300)**, **Marcus (1600)**, **Antonio (1800)**, **Alpha (2200)**, and **Magnus (3200)**.
- **Professional Review:** Industry-standard move classification (Brilliant, Great, Best, etc.) with precise centipawn accuracy.
- **Evaluation Bar:** Real-time engine feedback with sigmoid-based visualization.

### 🧩 Training & HUD
- **Tactical Puzzles:** Curated datasets of real-world tactics with progressive difficulty and descriptive objectives.
- **Material Tracker:** High-fidelity SVG indicators for captured pieces and live score imbalance.
- **Interactive Settings:** Fully customizable experience—toggle board themes, piece styles, sounds, coordinates, and more.

---

## 🛠️ Technical Architecture

### Backend (Google Apps Script)
- **High-Speed Database:** Utilizes `CacheService` for transient state management with optimized key mapping.
- **Concurrency Control:** `LockService` ensures atomic move processing and prevents race conditions.
- **Optimized Polling:** Implements version-based fast paths to reduce server-side execution time and improve responsiveness.

### Frontend (HTML5/JS/CSS3)
- **Modern UI:** Responsive dark-mode interface with a focus on UX, built using vanilla CSS.
- **Engine Performance:** Runs Stockfish in a multi-threaded worker pool to prevent UI blocking.
- **Audio & Haptics:** Immersive sound effects via Web Audio API and tactile vibration feedback for mobile devices.

---

## 📂 Project Structure

| File | Description |
| :--- | :--- |
| `Code.gs` | Server-side logic for multiplayer, room management, and cache operations. |
| `App.html` | Core game logic, state management, and UI controller. |
| `Index.html` | Main entry point, layout template, and menu systems. |
| `Stockfish.html` | Stockfish WASM engine wrapper and worker initialization. |
| `AI.html` | AI personality mapping and engine depth configurations. |
| `PuzzleGen.html` | Logic for puzzle dataset management and tactical training. |
| `Stylesheet.html` | Comprehensive CSS definitions, themes, and animations. |
| `Pieces.html` | High-quality SVG definitions for all chess piece sets. |

---

## 📦 Deployment Instructions

### Method 1: Google Apps Script Web Editor
1. Go to [script.google.com](https://script.google.com/) and create a new project.
2. Copy the contents of `Code.gs` into the script editor.
3. Create new HTML files for each `.html` file in this repository (e.g., `Index.html`, `App.html`, etc.) and paste the corresponding code.
4. Click **Deploy > New deployment**.
5. Select **Web app**, set "Execute as" to **Me**, and "Who has access" to **Anyone**.
6. Copy the web app URL and start playing!

---

## 👨‍💻 Author

- **Author:** [Cancelllls](https://github.com/Cancelllls)
- **Website:** [cancellls.com](https://cancellls.com)
- **License:** MIT

---

*Note: This application requires an active internet connection for multiplayer synchronization. Offline Puzzles and AI modes run locally on your device's CPU via Web Workers.*
