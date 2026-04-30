'use client';

import { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shuffle, Brain, Cpu, TreePine, Layers, Target, ArrowDown } from 'lucide-react';
import SimulationControls, { useSimulationLoop } from '../SimulationControls';
import { generateClassificationData, LabeledPoint2D } from '@/lib/datasets';

const W = 600, H = 250, P = 30;
const CLASS_COLORS = ['#818cf8', '#fb7185', '#34d399', '#fbbf24'];

interface BaseModel {
  name: string;
  icon: 'tree' | 'brain' | 'cpu';
  color: string;
  borderColor: string;
  axis: 'x' | 'y';
  threshold: number;
  leftLabel: number;
  rightLabel: number;
  accuracy: number;
}

function buildBaseModels(data: LabeledPoint2D[]): BaseModel[] {
  const configs = [
    { name: 'Decision Tree', icon: 'tree' as const, color: 'text-emerald-400', borderColor: 'border-emerald-500/50' },
    { name: 'KNN (Jarak)', icon: 'brain' as const, color: 'text-purple-400', borderColor: 'border-purple-500/50' },
    { name: 'SVM (Garis)', icon: 'cpu' as const, color: 'text-amber-400', borderColor: 'border-amber-500/50' },
  ];

  return configs.map((config, idx) => {
    // Each model uses different strategy for splitting
    const axis = idx === 0 ? 'x' : idx === 1 ? 'y' : (Math.random() > 0.5 ? 'x' : 'y');
    const vals = data.map(p => axis === 'x' ? p.x : p.y);
    const min = Math.min(...vals), max = Math.max(...vals);
    
    // Different bias for each model
    const threshold = min + (0.3 + idx * 0.2) * (max - min);

    const left = data.filter(p => (axis === 'x' ? p.x : p.y) <= threshold);
    const right = data.filter(p => (axis === 'x' ? p.x : p.y) > threshold);

    const getMode = (pts: LabeledPoint2D[]) => {
      if (pts.length === 0) return 0;
      const counts: Record<number, number> = {};
      pts.forEach(p => { counts[p.label] = (counts[p.label] || 0) + 1; });
      return parseInt(Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0]);
    };

    const leftLabel = getMode(left);
    const rightLabel = getMode(right);
    const correct = data.filter(p => {
      const pred = (axis === 'x' ? p.x : p.y) <= threshold ? leftLabel : rightLabel;
      return pred === p.label;
    }).length;

    return { ...config, axis, threshold, leftLabel, rightLabel, accuracy: correct / data.length };
  });
}

export default function StackingViz() {
  const [data, setData] = useState<LabeledPoint2D[]>(() => generateClassificationData(60, 'circle'));
  const [dataType, setDataType] = useState<'xor' | 'linear' | 'circle'>('circle');
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [step, setStep] = useState(0);

  const baseModels = useMemo(() => buildBaseModels(data), [data]);

  // Steps: 0=data, 1=base model 1, 2=base model 2, 3=base model 3, 4=meta features, 5=meta prediction
  const totalSteps = 6;

  const nextStep = useCallback((): boolean => {
    if (step >= totalSteps - 1) { setIsPlaying(false); return false; }
    setStep(s => s + 1);
    return true;
  }, [step, totalSteps]);

  const reset = useCallback(() => { setStep(0); setIsPlaying(false); }, []);
  const randomize = useCallback(() => {
    setData(generateClassificationData(60, dataType));
    setStep(0); setIsPlaying(false);
  }, [dataType]);

  useSimulationLoop(nextStep, speed * 0.25, isPlaying);

  const sx = (x: number) => P + (x / 100) * (W - 2 * P);
  const sy = (y: number) => H - P - (y / 100) * (H - 2 * P);

  const activeModelIdx = step >= 1 && step <= 3 ? step - 1 : -1;

  // Meta-model: majority vote of base models (simplified stacking)
  const metaPredictions = useMemo(() => {
    return data.map(pt => {
      const preds = baseModels.map(m => {
        return (m.axis === 'x' ? pt.x : pt.y) <= m.threshold ? m.leftLabel : m.rightLabel;
      });
      // Meta-model learns from base predictions (simplified as weighted vote)
      const counts: Record<number, number> = {};
      preds.forEach((v, i) => {
        // Weight by accuracy
        counts[v] = (counts[v] || 0) + baseModels[i].accuracy;
      });
      return parseInt(Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0]);
    });
  }, [data, baseModels]);

  const IconMap = { tree: TreePine, brain: Brain, cpu: Cpu };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-4 mb-6 bg-[var(--bg-secondary)] border border-[var(--border-color)] p-4 rounded-xl">
        <button onClick={randomize} className="btn-secondary flex items-center gap-2 text-xs py-2 px-3 shrink-0">
          <Shuffle className="w-3 h-3" /> Data Baru
        </button>
        <div className="h-6 w-px bg-[var(--border-color)] mx-2 hidden sm:block"></div>
        <select value={dataType} onChange={e => { const t = e.target.value as any; setDataType(t); setData(generateClassificationData(60, t)); setStep(0); }}
          className="px-3 py-1.5 rounded-lg border border-[var(--border-color)] bg-[var(--bg-card)] text-[var(--text-primary)] text-xs">
          <option value="circle">Pola Melingkar</option>
          <option value="xor">Pola Silang (XOR)</option>
          <option value="linear">Pola Linear</option>
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Scatter plot */}
        <div className="lg:col-span-3 viz-container p-4">
          <div className="text-xs text-center text-[var(--text-muted)] mb-2">
            {step === 0 && '📊 Data awal — 3 model BERBEDA akan masing-masing memprediksi'}
            {activeModelIdx >= 0 && `🧠 ${baseModels[activeModelIdx].name}: Akurasi ${(baseModels[activeModelIdx].accuracy * 100).toFixed(0)}%`}
            {step === 4 && '📋 Prediksi setiap model jadi "fitur baru" untuk Meta-Model'}
            {step === 5 && '🏆 Meta-Model menggabungkan prediksi secara CERDAS — bukan sekadar voting!'}
          </div>
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" style={{ maxHeight: 300 }}>
            <rect x={P} y={P} width={W - 2 * P} height={H - 2 * P} fill="rgba(10,10,26,0.5)" rx="8" />

            {/* Active model's decision boundary */}
            {baseModels.map((model, i) => {
              if (step < i + 1) return null;
              const isActive = activeModelIdx === i;
              const colors = ['#10b981', '#a855f7', '#f59e0b'];
              const color = colors[i];
              if (model.axis === 'x') {
                return <motion.line key={`split-${i}`} x1={sx(model.threshold)} y1={sy(100)} x2={sx(model.threshold)} y2={sy(0)}
                  stroke={color} strokeWidth={isActive ? 2.5 : 1.5} strokeDasharray={isActive ? "6,4" : "3,3"}
                  initial={{ opacity: 0 }} animate={{ opacity: isActive ? 0.8 : 0.25 }} />;
              } else {
                return <motion.line key={`split-${i}`} x1={sx(0)} y1={sy(model.threshold)} x2={sx(100)} y2={sy(model.threshold)}
                  stroke={color} strokeWidth={isActive ? 2.5 : 1.5} strokeDasharray={isActive ? "6,4" : "3,3"}
                  initial={{ opacity: 0 }} animate={{ opacity: isActive ? 0.8 : 0.25 }} />;
              }
            })}

            {/* Data points */}
            {data.map((pt, i) => {
              const showFinal = step >= 5;
              const finalPred = showFinal ? metaPredictions[i] : null;
              const fillColor = finalPred !== null ? CLASS_COLORS[finalPred] : CLASS_COLORS[pt.label];
              const isWrong = finalPred !== null && finalPred !== pt.label;
              return (
                <motion.circle key={i} cx={sx(pt.x)} cy={sy(pt.y)} r={4}
                  fill={fillColor}
                  stroke={isWrong ? '#ef4444' : `${CLASS_COLORS[pt.label]}50`}
                  strokeWidth={isWrong ? 2 : 0.5} opacity={0.85} />
              );
            })}
          </svg>
        </div>

        {/* Stacking Architecture */}
        <div className="lg:col-span-2 flex flex-col gap-2">
          <div className="text-xs font-bold text-white uppercase tracking-wider mb-1 flex items-center gap-2">
            <Layers className="w-4 h-4 text-pink-400" /> Arsitektur 2 Level
          </div>

          {/* Level 0: Base Models */}
          <div className="p-2 rounded-xl border border-slate-600 bg-slate-800/50">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 text-center">Level 0 — Base Models (Paralel)</div>
            <div className="grid grid-cols-3 gap-2">
              {baseModels.map((model, i) => {
                const Icon = IconMap[model.icon];
                const isActive = activeModelIdx === i;
                const isPast = step > i + 1;
                const isVisible = step >= i + 1;
                return (
                  <motion.div key={i}
                    initial={{ opacity: 0.3 }}
                    animate={{ opacity: isVisible ? 1 : 0.3, scale: isActive ? 1.05 : 1 }}
                    className={`p-2 rounded-lg border text-center transition-all ${
                      isActive ? `${model.borderColor} bg-white/5 shadow-lg` : isPast ? 'border-emerald-500/20 bg-[var(--bg-card)]' : 'border-[var(--border-color)] bg-[var(--bg-card)]'
                    }`}>
                    <Icon className={`w-5 h-5 mx-auto mb-1 ${isActive ? model.color : isPast ? 'text-emerald-400' : 'text-slate-600'}`} />
                    <div className="text-[9px] font-bold text-white">{model.name}</div>
                    {isVisible && <div className="text-[8px] text-slate-400 mt-0.5">{(model.accuracy * 100).toFixed(0)}%</div>}
                    {isPast && <div className="text-[8px] text-emerald-400">✓</div>}
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Arrow: predictions become features */}
          <AnimatePresence>
            {step >= 4 && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                className="flex flex-col items-center py-1">
                <ArrowDown className="w-5 h-5 text-pink-400" />
                <div className="text-[9px] text-pink-300 font-bold">Prediksi → Fitur Baru</div>
                <div className="flex gap-2 mt-1">
                  {baseModels.map((m, i) => (
                    <motion.div key={i} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: i * 0.1 }}
                      className="px-2 py-1 rounded bg-pink-500/10 border border-pink-500/20 text-[8px] text-pink-300 font-mono">
                      [{m.name.split(' ')[0]}]: {m.leftLabel}/{m.rightLabel}
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Level 1: Meta-Model */}
          <AnimatePresence>
            {step >= 4 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                className={`p-3 rounded-xl border-2 transition-all ${
                  step >= 5 ? 'border-pink-500 bg-pink-500/10 shadow-[0_0_20px_rgba(236,72,153,0.15)]' : 'border-pink-500/30 bg-pink-500/5'
                }`}>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 text-center">Level 1 — Meta-Model (Manajer)</div>
                <div className="flex items-center justify-center gap-2">
                  <Brain className={`w-6 h-6 ${step >= 5 ? 'text-pink-400' : 'text-slate-500'}`} />
                  <div>
                    <div className="text-xs font-bold text-white">Logistic Regression</div>
                    <div className="text-[9px] text-slate-400">Belajar "model mana yang paling bisa dipercaya"</div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Final result */}
          <AnimatePresence>
            {step >= 5 && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="p-3 rounded-xl border-2 border-emerald-500 bg-emerald-500/10">
                <div className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-emerald-400" />
                  <span className="text-sm font-black text-white">Stacking Selesai!</span>
                </div>
                <div className="text-[10px] text-[var(--text-muted)] mt-1 space-y-0.5">
                  {baseModels.map((m, i) => (
                    <div key={i}>{m.name}: <span className="text-slate-300">{(m.accuracy * 100).toFixed(0)}%</span></div>
                  ))}
                  <div className="font-bold text-emerald-300 pt-1 border-t border-emerald-500/30">
                    Meta-Model: {(() => {
                      const correct = data.filter((pt, i) => metaPredictions[i] === pt.label).length;
                      return `${(correct / data.length * 100).toFixed(1)}%`;
                    })()} 🏆
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <SimulationControls
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onReset={reset}
        onStep={nextStep}
        isPlaying={isPlaying}
        speed={speed}
        onSpeedChange={setSpeed}
        iteration={step}
        maxIteration={totalSteps - 1}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        <div className="glass-card p-4 border-l-4 border-indigo-500">
          <h4 className="text-sm font-bold text-indigo-300 mb-2">🧱 Level 0: Tim Ahli</h4>
          <p className="text-xs text-[var(--text-muted)] leading-relaxed">
            Ibarat <b>konsultasi medis</b> — Anda mendatangi 3 dokter spesialis berbeda (Decision Tree, KNN, SVM). 
            Masing-masing memberikan diagnosis berdasarkan keahliannya. Perhatikan garis batas yang berbeda-beda di scatter plot!
          </p>
        </div>
        <div className="glass-card p-4 border-l-4 border-pink-500">
          <h4 className="text-sm font-bold text-pink-300 mb-2">🏗️ Level 1: Manajer Cerdas</h4>
          <p className="text-xs text-[var(--text-muted)] leading-relaxed">
            Meta-Model adalah <b>manajer yang belajar memilih</b> dokter mana yang paling bisa dipercaya untuk kasus tertentu. 
            Berbeda dengan Voting biasa, Stacking <b>melatih model baru</b> dari prediksi — jadi ia tahu 
            "untuk area ini, percayakan ke dokter A; untuk area itu, ke dokter B."
          </p>
        </div>
        <div className="glass-card p-4 border-l-4 border-emerald-500">
          <h4 className="text-sm font-bold text-emerald-300 mb-2">🏆 Kenapa Bisa Lebih Akurat?</h4>
          <p className="text-xs text-[var(--text-muted)] leading-relaxed">
            Lihat akurasi di akhir! Meta-Model biasanya <b>lebih akurat dari semua base model</b> secara individual, 
            karena ia belajar <b>kapan harus percaya siapa</b>. Kelemahannya: prosesnya lebih lambat karena harus melatih 2 level model.
          </p>
        </div>
      </div>
    </div>
  );
}
