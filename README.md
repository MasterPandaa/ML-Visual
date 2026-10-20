# ML-Visual — Interactive Machine Learning & Deep Learning Visualizer

[![Next.js](https://img.shields.io/badge/Next.js-16%20(App%20Router)-black?style=flat&logo=next.js&logoColor=white)](#)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat&logo=react&logoColor=black)](#)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat&logo=typescript&logoColor=white)](#)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?style=flat&logo=tailwind-css&logoColor=white)](#)
[![D3.js](https://img.shields.io/badge/Data_Viz-D3.js%20v7-F9A03C?style=flat&logo=d3.js&logoColor=white)](#)
[![Motion](https://img.shields.io/badge/Animation-Framer_Motion-FF0055?style=flat)](#)
[![State](https://img.shields.io/badge/State-Zustand-764ABC?style=flat)](#)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

An interactive in-browser laboratory for dissecting, simulating, and visualizing **Machine Learning**, **Deep Learning**, and **Reinforcement Learning** algorithms in real time.

Built on **Next.js (App Router)**, **React 19**, **TypeScript**, **D3.js v7**, and **Tailwind CSS v4**, ML-Visual maps mathematical optimization dynamics into responsive, step-by-step vector graphics rendered entirely on the client side.

---

## Overview

Abstract machine learning mechanics—such as gradient descent convergence, hyperplane margins, synaptic weight updates, and decision boundary partitions—are often difficult to inspect through raw metrics alone. ML-Visual provides an interactive runtime environment to observe how algorithmic models adapt to synthetic and user-supplied data:

- **Client-Side Matrix Computations**: Real-time forward-pass simulations, optimization steps, and loss computations execute locally in the browser with zero server latency.
- **Interactive Hyperparameter Modulation**: Sliders for learning rates, regularization parameters ($\lambda$), polynomial degrees, epoch limits, and activation functions trigger instantaneous visual feedback.
- **Side-by-Side Model Benchmarking (`/compare`)**: Direct comparative evaluation of two distinct models trained concurrently on identical datasets to assess convergence rate and boundary complexity.
- **Custom Dataset Ingestion**: Generate standard synthetic distributions (Two Moons, Circles, Blobs) or import custom CSV files via PapaParse.

---

## Supported Algorithm Paradigms

| Paradigm | Supported Algorithms | Visual Representation |
| :--- | :--- | :--- |
| **Regression** | Linear, Polynomial, Ridge ($L_2$), Lasso ($L_1$), ElasticNet, Huber, Quantile | Fitted curves, residual error vectors, gradient loss surfaces |
| **Classification** | Logistic Regression, Decision Tree, KNN, SVM (Linear/RBF), Naive Bayes, LDA, QDA | 2D Decision boundaries, support vectors, margin boundaries |
| **Ensemble Methods** | Random Forest, Extra Trees, AdaBoost, Gradient Boosting, XGBoost, Stacking | Voting planes, sequential residual reduction, feature rankings |
| **Unsupervised Learning** | K-Means, DBSCAN, Hierarchical Clustering, GMM, PCA, t-SNE, UMAP | Centroid migrations, density reachability, dendrograms, 2D projections |
| **Deep Learning** | Multilayer Perceptron (MLP), Convolutional Neural Network (CNN) | Layer node activations, synaptic connections, convolutional filters |
| **Reinforcement Learning** | Q-Learning, Grid World Navigation | Q-table heatmaps, exploration vs exploitation policy trajectories |

---

## Architecture & Ecosystem

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                            ML-VISUAL ECOSYSTEM                              │
├──────────────────────┬──────────────────────┬───────────────────────────────┤
│   Interactive Lab    │   Model Comparator   │        Dataset Sandbox        │
│ Parameter sliders,   │ Side-by-side model   │ Synthetic benchmarks: Moons,  │
│ step execution, and  │ evaluation on shared │ Circles, Blobs, Gaussian, or  │
│ loss convergence.    │ data (/compare).     │ custom uploaded CSV files.    │
└──────────────────────┴──────────────────────┴───────────────────────────────┘
```

1. **Simulation Engine**: Step controls (Play, Pause, Step-by-Epoch, Speed Modulation) driving iterative mathematical solvers.
2. **Dynamic D3.js Renderers**: Isolated SVG canvas components handling coordinate projections, axes, and contours.
3. **Reactive Global State**: Zustand stores managing model configurations, dataset parameters, and running states.

---

## Getting Started

### Prerequisites

- Node.js >= 18.x
- NPM, PNPM, or Yarn

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/MasterPandaa/ML-Visual.git
   cd ML-Visual
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the development server**:
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` in your browser.

4. **Build for production**:
   ```bash
   npm run build
   npm start
   ```

---

## License

This project is licensed under the [MIT License](LICENSE).
