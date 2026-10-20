<p align="center">
  <img src="https://raw.githubusercontent.com/MasterPandaa/MasterPandaa/main/assets/banners/ML-Visual.svg" alt="ML Algorithm Visualizer Banner" width="100%">
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Framework-Next.js_15_|_React_19-000000?style=flat-square&logo=next.js" alt="Next.js">
  <img src="https://img.shields.io/badge/Visuals-D3.js_v7-F9A03C?style=flat-square&logo=d3.js" alt="D3.js">
  <img src="https://img.shields.io/badge/Language-TypeScript_5-3178C6?style=flat-square&logo=typescript" alt="TypeScript">
  <img src="https://img.shields.io/badge/Execution-100%25_Client--Side-10B981?style=flat-square" alt="Client Side">
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-gray?style=flat-square" alt="License"></a>
</p>

## Overview

Understanding the mathematical intuition behind machine learning models is notoriously challenging through static equations alone. ML-Visual is an interactive web-based simulator built with **Next.js 15**, **React 19**, and **D3.js (v7)** that lets developers and students inspect algorithm training dynamics in real time.

All calculations run entirely in the browser using client-side TypeScript, enabling interactive parameter scrubbing, hyperparameter tuning, and instant 2D decision boundary visualization at 60 FPS without server roundtrips.

---

## Core Capabilities

- **Interactive Decision Boundaries**: Live mathematical rendering of linear classification, polynomial boundaries, and support vector hyperplanes.
- **Real-Time Hyperparameter Tuning**: Adjust learning rate, regularization coefficients, and epoch counts with instant visual feedback.
- **Idempotent D3.js Architecture**: Prevents duplicate DOM re-renders by enforcing clean SVG update and exit selections.
- **Synthesized Toy Datasets**: Generate linearly separable, noisy circular, and multi-class spiral coordinate points on demand.
- **Step-by-Step Training Stepper**: Pause, step forward, or rewind epoch updates to observe weight convergence step by step.

---

## Quickstart

1. Clone the repository:
   ```bash
   git clone https://github.com/MasterPandaa/ML-Visual.git
   cd ML-Visual
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Launch development server:
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` in your browser.

---

## License

This project is licensed under the [MIT License](LICENSE).
