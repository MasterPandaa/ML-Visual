'use client';

import { useState } from 'react';
import { Settings2, BookOpen, ChevronRight } from 'lucide-react';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';

// Dynamic imports for visualizations
const LinearRegressionViz = dynamic(() => import('@/components/visualizations/regresi/LinearRegressionViz'), { ssr: false });
const KMeansViz = dynamic(() => import('@/components/visualizations/unsupervised/KMeansViz'), { ssr: false });
const NeuralNetworkViz = dynamic(() => import('@/components/visualizations/deeplearning/NeuralNetworkViz'), { ssr: false });
const KNNViz = dynamic(() => import('@/components/visualizations/klasifikasi/KNNViz'), { ssr: false });
const DecisionTreeViz = dynamic(() => import('@/components/visualizations/klasifikasi/DecisionTreeViz'), { ssr: false });
const QLearningViz = dynamic(() => import('@/components/visualizations/reinforcement/QLearningViz'), { ssr: false });

const PLAYGROUND_MODELS = [
  { id: 'linear-regression', name: 'Linear Regression', category: 'Regresi', Component: LinearRegressionViz },
  { id: 'k-means-clustering', name: 'K-Means Clustering', category: 'Unsupervised', Component: KMeansViz },
  { id: 'k-nearest-neighbors-knn', name: 'K-Nearest Neighbors', category: 'Klasifikasi', Component: KNNViz },
  { id: 'random-forest', name: 'Decision Tree (Random Forest)', category: 'Klasifikasi', Component: DecisionTreeViz },
  { id: 'multi-layer-perceptron-mlp', name: 'Neural Network (MLP)', category: 'Deep Learning', Component: NeuralNetworkViz },
  { id: 'q-learning', name: 'Q-Learning', category: 'Reinforcement Learning', Component: QLearningViz },
];

export default function PlaygroundPage() {
  const [activeModelId, setActiveModelId] = useState(PLAYGROUND_MODELS[0].id);

  const activeModel = PLAYGROUND_MODELS.find(m => m.id === activeModelId);
  const VizComponent = activeModel?.Component;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
          <Settings2 className="w-8 h-8 text-indigo-400" />
          <span className="gradient-text">Global</span> Playground
        </h1>
        <p className="text-[var(--text-secondary)]">
          Pilih model dan bereksperimen dengan berbagai parameter secara bebas
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar: Model Selection */}
        <div className="w-full lg:w-64 flex flex-col gap-2">
          {PLAYGROUND_MODELS.map((model) => (
            <button
              key={model.id}
              onClick={() => setActiveModelId(model.id)}
              className={`flex items-center justify-between p-3 rounded-xl transition-all ${
                activeModelId === model.id
                  ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/25'
                  : 'bg-[var(--bg-card)] text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)] hover:text-white'
              }`}
            >
              <div className="text-left">
                <div className="font-medium text-sm">{model.name}</div>
                <div className={`text-[10px] ${activeModelId === model.id ? 'text-indigo-200' : 'text-[var(--text-muted)]'}`}>
                  {model.category}
                </div>
              </div>
              <ChevronRight className={`w-4 h-4 ${activeModelId === model.id ? 'opacity-100' : 'opacity-0'}`} />
            </button>
          ))}

          <div className="mt-auto pt-6">
            <div className="glass-card p-4 bg-amber-500/10 border-amber-500/20">
              <h3 className="text-xs font-semibold text-amber-400 mb-2 flex items-center gap-2">
                <BookOpen className="w-3 h-3" /> Tips Playground
              </h3>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                Gunakan tombol Play/Pause untuk animasi. Ubah parameter untuk melihat bagaimana model beradaptasi.
              </p>
            </div>
          </div>
        </div>

        {/* Main Viz Area */}
        <div className="flex-1">
          <motion.div
            key={activeModelId}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="glass-card p-6 min-h-[600px] flex flex-col"
          >
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-[var(--border-color)]">
              <div>
                <h2 className="text-xl font-bold text-white">{activeModel?.name}</h2>
                <span className="text-sm text-indigo-400">{activeModel?.category}</span>
              </div>
            </div>

            <div className="flex-1">
              {VizComponent ? <VizComponent /> : null}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
