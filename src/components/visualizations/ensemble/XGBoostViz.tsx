'use client';

import { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shuffle, Zap, Shield, ArrowRight, Target } from 'lucide-react';
import SimulationControls, { useSimulationLoop } from '../SimulationControls';
import { generateClassificationData, LabeledPoint2D } from '@/lib/datasets';

const W = 600, H = 300, P = 30;
const CLASS_COLORS = ['#818cf8', '#fb7185', '#34d399', '#fbbf24'];

interface XGBStage {
  axis: 'x' | 'y';
  threshold: number;
  leftLabel: number;
  rightLabel: number;
  gainBefore: number;
  gainAfter: number;
  regularization: number;
}

function buildXGBSequence(data: LabeledPoint2D[], numStages: number, lambda: number) {
  const stages: XGBStage[] = [];
  const scores: number[][] = data.map(() => [0, 0]);
  const lr = 0.3; // learning rate (shrinkage)

  for (let s = 0; s < numStages; s++) {
    const errorBefore = data.filter((pt, i) => {
      const pred = scores[i][0] > scores[i][1] ? 0 : 1;
      return pred !== pt.label;
    }).length / data.length;

    let bestStage: XGBStage | null = null;
    let bestGain = -Infinity;

    for (let attempt = 0; attempt < 30; attempt++) {
      const axis = Math.random() > 0.5 ? 'x' : 'y';
      const vals = data.map(p => axis === 'x' ? p.x : p.y);
      const min = Math.min(...vals), max = Math.max(...vals);
      const threshold = min + Math.random() * (max - min);

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

      // XGBoost gain calculation (simplified)
      const tempScores = scores.map((sc, i) => {
        const pred = (axis === 'x' ? data[i].x : data[i].y) <= threshold ? leftLabel : rightLabel;
        return [sc[0] + (pred === 0 ? lr : 0), sc[1] + (pred === 1 ? lr : 0)];
      });
      const correct = data.filter((pt, i) => {
        const p = tempScores[i][0] > tempScores[i][1] ? 0 : 1;
        return p === pt.label;
      }).length;

      // Gain minus regularization penalty
      const rawGain = correct / data.length;
      const penalty = lambda * 0.01; // regularization
      const netGain = rawGain - penalty;

      if (netGain > bestGain) {
        bestGain = netGain;
        bestStage = {
          axis, threshold, leftLabel, rightLabel,
          gainBefore: 1 - errorBefore,
          gainAfter: rawGain,
          regularization: penalty
        };
      }
    }

    if (!bestStage) break;
    stages.push(bestStage);

    data.forEach((pt, i) => {
      const pred = (bestStage!.axis === 'x' ? pt.x : pt.y) <= bestStage!.threshold ? bestStage!.leftLabel : bestStage!.rightLabel;
      scores[i][pred] += lr;
    });
  }

  return { stages, finalScores: scores };
}

const NUM_STAGES = 5;

export default function XGBoostViz() {
  const [data, setData] = useState<LabeledPoint2D[]>(() => generateClassificationData(60, 'xor'));
  const [dataType, setDataType] = useState<'xor' | 'linear' | 'circle'>('xor');
  const [lambda, setLambda] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [step, setStep] = useState(0);

  const { stages, finalScores } = useMemo(() => buildXGBSequence(data, NUM_STAGES, lambda), [data, lambda]);
  const totalSteps = stages.length + 2;

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

  useSimulationLoop(nextStep, speed * 0.3, isPlaying);

  const sx = (x: number) => P + (x / 100) * (W - 2 * P);
  const sy = (y: number) => H - P - (y / 100) * (H - 2 * P);

  const activeStage = step >= 1 && step <= stages.length ? step - 1 : -1;

  const finalPredictions = useMemo(() => {
    if (step < totalSteps - 1) return null;
    return data.map((_, i) => finalScores[i][0] > finalScores[i][1] ? 0 : 1);
  }, [step, totalSteps, data, finalScores]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-4 mb-6 bg-[var(--bg-secondary)] border border-[var(--border-color)] p-4 rounded-xl">
        <button onClick={randomize} className="btn-secondary flex items-center gap-2 text-xs py-2 px-3 shrink-0">
          <Shuffle className="w-3 h-3" /> Data Baru
        </button>
        <div className="h-6 w-px bg-[var(--border-color)] mx-2 hidden sm:block"></div>
        <select value={dataType} onChange={e => { const t = e.target.value as any; setDataType(t); setData(generateClassificationData(60, t)); setStep(0); }}
          className="px-3 py-1.5 rounded-lg border border-[var(--border-color)] bg-[var(--bg-card)] text-[var(--text-primary)] text-xs">
          <option value="xor">Pola Silang (XOR)</option>
          <option value="circle">Pola Melingkar</option>
          <option value="linear">Pola Linear</option>
        </select>
        <div className="h-6 w-px bg-[var(--border-color)] mx-2 hidden sm:block"></div>
        <div className="flex items-center gap-2">
          <Shield className="w-3 h-3 text-indigo-400" />
          <span className="text-xs text-[var(--text-secondary)]">Rem Penalti (λ): <strong className="text-indigo-400">{lambda}</strong></span>
          <input type="range" min={0} max={5} step={0.5} value={lambda}
            onChange={e => { setLambda(parseFloat(e.target.value)); setStep(0); }}
            className="w-20 accent-indigo-500" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-3 viz-container p-4">
          <div className="text-xs text-center text-[var(--text-muted)] mb-2">
            {step === 0 && '⚡ XGBoost = Gradient Boosting + Regularisasi (rem) + Kecepatan tinggi'}
            {activeStage >= 0 && `🔧 Sesi ${activeStage + 1}: Koreksi dengan "rem penalti" λ=${lambda} — mencegah model terlalu menghafal`}
            {step === totalSteps - 1 && '🎯 Prediksi akhir — regularisasi menjaga model tetap generalis!'}
          </div>
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" style={{ maxHeight: 340 }}>
            <rect x={P} y={P} width={W - 2 * P} height={H - 2 * P} fill="rgba(10,10,26,0.5)" rx="8" />

            {/* All decision boundaries */}
            {stages.map((s, i) => {
              if (step < i + 1) return null;
              const isActive = activeStage === i;
              const color = isActive ? '#fbbf24' : `hsl(${180 + i * 40}, 70%, 60%)`;
              if (s.axis === 'x') {
                return <motion.line key={`split-${i}`} x1={sx(s.threshold)} y1={sy(100)} x2={sx(s.threshold)} y2={sy(0)}
                  stroke={color} strokeWidth={isActive ? 2.5 : 1.5} strokeDasharray={isActive ? "6,4" : "3,3"}
                  initial={{ opacity: 0 }} animate={{ opacity: isActive ? 1 : 0.3 }} />;
              } else {
                return <motion.line key={`split-${i}`} x1={sx(0)} y1={sy(s.threshold)} x2={sx(100)} y2={sy(s.threshold)}
                  stroke={color} strokeWidth={isActive ? 2.5 : 1.5} strokeDasharray={isActive ? "6,4" : "3,3"}
                  initial={{ opacity: 0 }} animate={{ opacity: isActive ? 1 : 0.3 }} />;
              }
            })}

            {data.map((pt, i) => {
              const finalPred = finalPredictions ? finalPredictions[i] : null;
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

        <div className="lg:col-span-2 flex flex-col gap-2">
          <div className="text-xs font-bold text-white uppercase tracking-wider mb-1 flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400" /> XGBoost: Boosting + Rem
          </div>

          {/* Regularization visual */}
          <div className="p-3 rounded-xl border border-indigo-500/30 bg-indigo-500/5">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-4 h-4 text-indigo-400" />
              <span className="text-xs font-bold text-indigo-300">Kekuatan Rem Penalti (λ = {lambda})</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[9px] text-slate-400">Bebas</span>
              <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden relative">
                <motion.div className="h-full bg-gradient-to-r from-rose-500 via-amber-500 to-emerald-500 rounded-full"
                  animate={{ width: `${(lambda / 5) * 100}%` }} transition={{ duration: 0.3 }} />
              </div>
              <span className="text-[9px] text-slate-400">Ketat</span>
            </div>
            <p className="text-[9px] text-slate-500 mt-1">
              λ kecil = model bebas menghafal data (risiko overfit). λ besar = model dipaksa sederhana (lebih aman).
            </p>
          </div>

          {stages.map((stage, i) => {
            const isActive = activeStage === i;
            const isPast = step > i + 1;
            const isVisible = step >= i + 1;
            return (
              <motion.div key={i}
                initial={{ opacity: 0.3 }}
                animate={{ opacity: isVisible ? 1 : 0.3, scale: isActive ? 1.02 : 1 }}
                className={`p-2 rounded-lg border transition-all text-[10px] ${
                  isActive ? 'border-amber-500 bg-amber-500/10' : isPast ? 'border-emerald-500/20 bg-[var(--bg-card)]' : 'border-[var(--border-color)] bg-[var(--bg-card)]'
                }`}>
                <div className="flex items-center gap-2">
                  <span className={`font-bold ${isActive ? 'text-amber-300' : isPast ? 'text-emerald-300' : 'text-slate-500'}`}>
                    Sesi {i + 1}
                  </span>
                  {isActive && <ArrowRight className="w-3 h-3 text-amber-400 animate-pulse" />}
                  {isPast && <span className="text-emerald-400 ml-auto">✓</span>}
                  {isVisible && (
                    <span className="text-[9px] text-slate-400 ml-auto">
                      Gain: {(stage.gainAfter * 100).toFixed(0)}% - Penalti: {(stage.regularization * 100).toFixed(1)}%
                    </span>
                  )}
                </div>
              </motion.div>
            );
          })}

          <AnimatePresence>
            {step >= totalSteps - 1 && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="p-3 rounded-xl border-2 border-emerald-500 bg-emerald-500/10 mt-1">
                <div className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-emerald-400" />
                  <span className="text-sm font-black text-white">Hasil XGBoost</span>
                </div>
                <div className="text-[10px] text-[var(--text-muted)] mt-1">
                  {finalPredictions && (() => {
                    const correct = data.filter((pt, i) => finalPredictions[i] === pt.label).length;
                    return `Akurasi: ${(correct / data.length * 100).toFixed(1)}% — Cepat, akurat, dan tahan overfit!`;
                  })()}
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
        <div className="glass-card p-4 border-l-4 border-amber-500">
          <h4 className="text-sm font-bold text-amber-300 mb-2">📉 Gradient Boosting++</h4>
          <p className="text-xs text-[var(--text-muted)] leading-relaxed">
            XGBoost = Gradient Boosting yang <b>lebih pintar</b>. Ia menggunakan <b>gradient</b> (arah koreksi) DAN <b>hessian</b> (seberapa besar koreksi) — 
            ibarat GPS yang tidak hanya tahu arah, tapi juga <b>seberapa jauh harus belok</b>.
          </p>
        </div>
        <div className="glass-card p-4 border-l-4 border-indigo-500">
          <h4 className="text-sm font-bold text-indigo-300 mb-2">🛡️ Regularisasi (Rem Darurat)</h4>
          <p className="text-xs text-[var(--text-muted)] leading-relaxed">
            Coba geser slider λ! Semakin besar λ, model semakin <b>hati-hati</b> dan tidak mudah menghafal data latih.
            Ibarat <b>rem darurat</b> yang mencegah mobil (model) ngebut berlebihan hingga keluar jalur.
          </p>
        </div>
        <div className="glass-card p-4 border-l-4 border-emerald-500">
          <h4 className="text-sm font-bold text-emerald-300 mb-2">⚡ Sangat Cepat & Efisien</h4>
          <p className="text-xs text-[var(--text-muted)] leading-relaxed">
            XGBoost memproses data secara paralel dan menggunakan teknik <b>cache-aware</b> sehingga sangat cepat bahkan untuk jutaan data.
            Inilah alasan model ini jadi <b>juara di banyak kompetisi data science</b>.
          </p>
        </div>
      </div>
    </div>
  );
}
