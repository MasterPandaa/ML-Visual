# 🤖 ML-Visual - Interactive Machine Learning & Deep Learning Visualizer

[![Next.js](https://img.shields.io/badge/Next.js-16%20(App%20Router)-black?style=flat&logo=next.js&logoColor=white)](#)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat&logo=react&logoColor=black)](#)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat&logo=typescript&logoColor=white)](#)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?style=flat&logo=tailwind-css&logoColor=white)](#)
[![D3.js](https://img.shields.io/badge/Data_Viz-D3.js%20v7-F9A03C?style=flat&logo=d3.js&logoColor=white)](#)
[![Motion](https://img.shields.io/badge/Animation-Framer_Motion-FF0055?style=flat)](#)
[![State](https://img.shields.io/badge/State-Zustand-764ABC?style=flat)](#)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

**ML-Visual** adalah laboratorium visual interaktif berbasis web untuk mempelajari, mengamati, dan membedah mekanisme kerja algoritma **Machine Learning**, **Deep Learning**, dan **Reinforcement Learning** secara real-time langsung di peramban (*browser*).

Dibangun dengan arsitektur modern **Next.js (App Router)**, **React 19**, **TypeScript**, **D3.js**, dan **Tailwind CSS 4**, aplikasi ini mentransformasi konsep matematika dan algoritma kecerdasan buatan yang abstrak menjadi simulasi visual dinamis yang intuitif dan mudah dipahami.

---

## 🌟 Mengapa Menggunakan ML-Visual?

- 🧠 **Membuka "Black Box" Machine Learning**: Mengamati bagaimana *decision boundary* terbentuk, bagaimana bobot neural network diperbarui, dan bagaimana klaster data dipisahkan langkah-demi-langkah.
- 🎛️ **Live Hyperparameter Tuning**: Ubah *learning rate*, jumlah *epoch*, *regularization parameter* ($\lambda$), jumlah pohon (*trees*), hingga fungsi aktivasi secara instan dengan respons kalkulasi langsung tanpa jeda server.
- 📊 **30+ Algoritma dalam 6 Paradigma**: Mencakup spektrum luas dari regresi linear sederhana hingga arsitektur Deep Learning modern dan algoritma Reinforcement Learning.
- ⚖️ **Fitur Komparasi Head-to-Head (`/compare`)**: Bandingkan dua atau lebih model secara berdampingan pada dataset yang sama untuk melihat perbandingan akurasi, waktu inferensi, dan kompleksitas batas keputusan.
- ⚡ **100% Client-Side Computation**: Seluruh kalkulasi algoritma, simulasi matriks, dan *forward propagation* dieksekusi secara lokal di mesin klien dengan performa tinggi.

---

## 🚀 Katalog Algoritma Terpadu

ML-Visual mengelompokkan model ke dalam 6 kategori utama dengan visualisasi D3.js khusus:

| Paradigma | Algoritma yang Didukung | Jenis Visualisasi Utama |
|---|---|---|
| **📈 Regresi (*Regression*)** | Linear, Polynomial, Ridge ($L_2$), Lasso ($L_1$), ElasticNet, Huber, Quantile, Bayesian | Fitted curves, residual errors, gradient descent paths, loss surfaces |
| **🎯 Klasifikasi (*Classification*)** | Logistic Regression, Decision Tree, K-Nearest Neighbors (KNN), SVM (Linear/RBF), Naive Bayes, LDA, QDA | 2D Decision boundaries, margin vectors, probability contours, tree branching |
| **🌲 Ensemble Methods** | Random Forest, Extra Trees, AdaBoost, Gradient Boosting, XGBoost, LightGBM, CatBoost, Stacking, Voting | Multi-tree voter voting planes, sequential residual reduction, feature importance |
| **🔍 Unsupervised Learning** | K-Means, DBSCAN, Hierarchical Clustering, GMM, PCA, t-SNE, UMAP, Isolation Forest, One-Class SVM, Autoencoder | Centroid migrations, density reachability, dendrograms, dimensionality reduction projections |
| **🧠 Deep Learning** | Artificial Neural Network (MLP Feedforward), Convolutional Neural Network (CNN) | Multi-layer node activations, weight synaptic connections, kernel filter feature maps |
| **🎮 Reinforcement Learning** | Q-Learning, Grid World Exploration | State-action Q-table heatmaps, exploration vs exploitation policy paths ($\epsilon$-greedy) |

---

## 💻 Fitur Platform Unggulan

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                            ML-VISUAL ECOSYSTEM                              │
├──────────────────────┬──────────────────────┬───────────────────────────────┤
│ 🎮 Interactive Lab   │ 📊 Model Comparator  │ 📂 Dataset Sandbox            │
│ Slider parameter,    │ Perbandingan 2 model │ Dataset sintetis: Moons,      │
│ step-by-step render, │ berdampingan         │ Circles, Blobs, Linier,       │
│ visualisasi gradien. │ (/compare).          │ Gaussian, & Custom CSV.       │
└──────────────────────┴──────────────────────┴───────────────────────────────┘
```

1. **Interactive Simulation Controls**:
   - Kendali simulasi penuh: **Play ▶**, **Pause ⏸**, **Step ⏭ (Langkah per Epoch/Iterasi)**, **Speed Slider**, dan **Reset 🔄**.
2. **Dynamic Dataset Generator**:
   - Pilih berbagai distribusi data benchmark: *Linear*, *Polynomial*, *Two Moons*, *Concentric Circles*, *Anisotropic Blobs*, *Multiclass Gaussian*, atau impor dataset CSV kustom via PapaParse.
3. **Model Comparator Engine (`/compare`)**:
   - Evaluasi performa model secara real-time (MSE, $R^2$ Score, Accuracy, Precision, Recall, F1-Score).
4. **Smooth Responsive UI**:
   - Desain futuristik dengan tema gelap (*dark theme*) elegan, responsif di desktop maupun tablet, diperkaya transisi halus berbasis **Framer Motion**.

---

## 🛠️ Tata Cara Instalasi & Menjalankan

### 1. Prasyarat Sistem
- **Node.js** >= 18.17.0 (disarankan Node.js 20 LTS)
- **NPM**, **PNPM**, atau **Yarn**
- **Git**

---

### 2. Langkah Instalasi

```bash
# 1. Clone repositori
git clone https://github.com/MasterPandaa/ML-Visual.git
cd ML-Visual

# 2. Install dependensi
npm install
```

---

### 3. Menjalankan Server Development

```bash
npm run dev
```

Buka peramban dan kunjungi: **`http://localhost:3000`**

---

### 4. Build untuk Lingkungan Produksi

```bash
# Build paket produksi
npm run build

# Jalankan server produksi lokal
npm run start
```

---

## 📖 Panduan Penggunaan (*Workflow Explorer*)

```text
┌─────────────────────┐     ┌─────────────────────┐     ┌─────────────────────┐
│ 1. Pilih Algoritma  │ ──> │ 2. Pilih / Generate │ ──> │ 3. Sesuaikan        │
│    dari Katalog     │     │    Dataset Uji      │     │    Hyperparameter   │
└─────────────────────┘     └─────────────────────┘     └─────────────────────┘
                                                                   │
                                                                   ▼
┌─────────────────────┐     ┌─────────────────────┐     ┌─────────────────────┐
│ 6. Bandingkan di    │ <── │ 5. Amati Boundary & │ <── │ 4. Tekan Play / Step│
│    Halaman /compare │     │    Metrik Evaluasi  │     │    Simulasi         │
└─────────────────────┘     └─────────────────────┘     └─────────────────────┘
```

1. **Pilih Model**: Dari navigasi utama, jelajahi kategori (Regresi, Klasifikasi, Ensemble, Unsupervised, Deep Learning, atau RL).
2. **Atur Dataset**: Pada panel samping, pilih bentuk sebaran data (*distribution shape*), jumlah titik (*sample size*), dan tingkat *noise*.
3. **Konfigurasi Parameter**: Sesuaikan slider parameter (misal: *Degree* polinomial, *C/Gamma* pada SVM, *K* pada KNN/K-Means, *Learning Rate*).
4. **Jalankan Simulasi**:
   - Tekan **Play** untuk melihat animasi konvergensi model secara mulus.
   - Gunakan **Step** untuk menganalisis setiap pembaruan bobot atau pemisahan partisi (*split*) satu demi satu.
5. **Analisis Komparatif**: Buka tab **Compare** untuk menguji ketahanan model terhadap *overfitting* / *underfitting*.

---

## 📦 Struktur Direktori Proyek

```text
ML-Visual/
├── public/
│   └── data/                       # Dataset kurikulum & referensi CSV
├── src/
│   ├── app/                        # Next.js App Router
│   │   ├── compare/                # Halaman komparasi model berdampingan
│   │   ├── models/                 # Dynamic route detail & visualizer algoritma
│   │   │   └── [slug]/
│   │   ├── playground/             # Sandbox eksperimen bebas
│   │   ├── layout.tsx              # Root layout aplikasi
│   │   └── page.tsx                # Landing page interaktif
│   ├── components/
│   │   ├── home/                   # Komponen hero, stats, & kategori
│   │   ├── layout/                 # Navbar & Footer navigasi
│   │   ├── model-cards/            # Grid katalog & filter pencarian
│   │   └── visualizations/         # Engine render visual D3.js per kategori
│   │       ├── klasifikasi/        # SVM, KNN, DecisionTree, Logistic, dll.
│   │       ├── regresi/            # Linear, Ridge, Lasso, Polynomial, dll.
│   │       ├── ensemble/           # RandomForest, XGBoost, AdaBoost, dll.
│   │       ├── unsupervised/       # KMeans, DBSCAN, PCA, TSNE, GMM, dll.
│   │       ├── deeplearning/       # NeuralNetwork & CNN feature maps
│   │       └── reinforcement/      # Q-Learning Grid World
│   ├── lib/
│   │   ├── algorithms/             # Implementasi kalkulasi matematika murni TypeScript
│   │   ├── datasets.ts             # Algoritma generator titik data sintetis
│   │   ├── csvParser.ts            # Parser data tabular PapaParse
│   │   └── store.ts                # Manajemen state global (Zustand)
│   └── types/                      # TypeScript interface & type definitions
├── package.json                    # Dependensi Next.js 16, React 19, D3, dll.
├── tailwind.config.js              # Styling Tailwind CSS v4
├── tsconfig.json                   # Konfigurasi TypeScript
└── README.md                       # Dokumentasi komprehensif sistem
```

---

## 🔒 Privasi, Keamanan & Performa

- **Zero Server Overhead**: Tidak ada data dataset atau input pengguna yang dikirim ke server eksternal; seluruh simulasi berjalan di *V8 JavaScript Engine* pada peramban Anda.
- **Optimized Rendering**: Algoritma komputasi berat memanfaatkan *requestAnimationFrame* dan *SVG/Canvas virtualization* guna menjamin frame rate stabil (60 FPS).
- **No Analytics / Telemetry**: 100% bebas dari pelacak pihak ketiga.

---

## 📄 Lisensi & Kontribusi

Proyek ini didistribusikan di bawah lisensi [MIT](LICENSE). Bebas digunakan untuk keperluan edukasi, riset, maupun presentasi akademis.

Kontribusi, penambahan visualisasi algoritma baru, dan saran perbaikan sangat disambut melalui [GitHub Issues](https://github.com/MasterPandaa/ML-Visual/issues) atau *Pull Request*.
