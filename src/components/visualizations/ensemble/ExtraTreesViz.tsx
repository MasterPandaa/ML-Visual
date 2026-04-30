'use client';

import { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shuffle, Dice6, TreePine, Vote, Users, Zap } from 'lucide-react';
import SimulationControls, { useSimulationLoop } from '../SimulationControls';
import { generateClassificationData, LabeledPoint2D } from '@/lib/datasets';

const W = 600, H = 300, P = 30;
const CLASS_COLORS = ['#818cf8', '#fb7185', '#34d399', '#fbbf24'];

interface ExtraStump {
  featureAxis: 'x' | 'y';
  threshold: number;
  leftLabel: number;
  rightLabel: number;
  accuracy: number;
  isRandom: boolean; // always true for ExtraTrees
}

function buildExtraStump(data: LabeledPoint2D[]): ExtraStump {
  // ExtraTrees: COMPLETELY RANDOM threshold, not best split
  const axis = Math.random() > 0.5 ? 'x' : 'y';
  const vals = data.map(p => axis === 'x' ? p.x : p.y);
  const min = Math.min(...vals), max = Math.max(...vals);
  // Random threshold — NOT optimized!
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
  const correct = data.filter(p => {
    const pred = (axis === 'x' ? p.x : p.y) <= threshold ? leftLabel : rightLabel;
    return pred === p.label;
  }).length;

  return { featureAxis: axis, threshold, leftLabel, rightLabel, accuracy: correct / data.length, isRandom: true };
}

const NUM_TREES = 7;

export default function ExtraTreesViz() {
  const [data, setData] = useState<LabeledPoint2D[]>(() => generateClassificationData(80, 'xor'));
  const [dataType, setDataType] = useState<'xor' | 'linear' | 'circle'>('xor');
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [step, setStep] = useState(0);

  // Build trees — ExtraTrees uses ALL data (no bootstrap) + random splits
  const treeData = useMemo(() => {
    const trees: { stump: ExtraStump }[] = [];
    for (let t = 0; t < NUM_TREES; t++) {
      trees.push({ stump: buildExtraStump(data) }); // ALL data, random split
    }
    return trees;
  }, [data]);

  const totalSteps = NUM_TREES + 2;

  const nextStep = useCallback((): boolean => {
    if (step >= totalSteps - 1) { setIsPlaying(false); return false; }
    setStep(s => s + 1);
    return true;
  }, [step, totalSteps]);

  const reset = useCallback(() => { setStep(0); setIsPlaying(false); }, []);
  const randomize = useCallback(() => {
    setData(generateClassificationData(80, dataType));
    setStep(0); setIsPlaying(false);
  }, [dataType]);

  useSimulationLoop(nextStep, speed * 0.4, isPlaying);

  const sx = (x: number) => P + (x / 100) * (W - 2 * P);
  const sy = (y: number) => H - P - (y / 100) * (H - 2 * P);

  const activeTreeIdx = step >= 1 && step <= NUM_TREES ? step - 1 : -1;

  const finalPredictions = useMemo(() => {
    if (step < totalSteps - 1) return null;
    return data.map(pt => {
      const votes = treeData.map(t => {
        return (t.stump.featureAxis === 'x' ? pt.x : pt.y) <= t.stump.threshold ? t.stump.leftLabel : t.stump.rightLabel;
      });
      const counts: Record<number, number> = {};
      votes.forEach(v => { counts[v] = (counts[v] || 0) + 1; });
      return parseInt(Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0]);
    });
  }, [step, totalSteps, data, treeData]);

  // Compare with RF-style accuracy (for educational comparison)
  const avgTreeAccuracy = useMemo(() => {
    return treeData.reduce((sum, t) => sum + t.stump.accuracy, 0) / treeData.length;
  }, [treeData]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-4 mb-6 bg-[var(--bg-secondary)] border border-[var(--border-color)] p-4 rounded-xl">
        <button onClick={randomize} className="btn-secondary flex items-center gap-2 text-xs py-2 px-3 shrink-0">
          <Shuffle className="w-3 h-3" /> Data Baru
        </button>
        <div className="h-6 w-px bg-[var(--border-color)] mx-2 hidden sm:block"></div>
        <select value={dataType} onChange={e => { const t = e.target.value as any; setDataType(t); setData(generateClassificationData(80, t)); setStep(0); }}
          className="px-3 py-1.5 rounded-lg border border-[var(--border-color)] bg-[var(--bg-card)] text-[var(--text-primary)] text-xs">
          <option value="xor">Pola Silang (XOR)</option>
          <option value="circle">Pola Melingkar</option>
          <option value="linear">Pola Linear</option>
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Scatter Plot */}
        <div className="lg:col-span-3 viz-container p-4">
          <div className="text-xs text-center text-[var(--text-muted)] mb-2">
            {step === 0 && '🎲 ExtraTrees: semua pohon pakai SELURUH data + batas pemisahan ACAK'}
            {activeTreeIdx >= 0 && `🎯 Pohon ${activeTreeIdx + 1}: Batas ACAK di ${treeData[activeTreeIdx].stump.featureAxis.toUpperCase()} = ${treeData[activeTreeIdx].stump.threshold.toFixed(1)} (Akurasi: ${(treeData[activeTreeIdx].stump.accuracy * 100).toFixed(0)}%)`}
            {step === totalSteps - 1 && '🗳️ Voting — keacakan justru membuat gabungan lebih kuat!'}
          </div>
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" style={{ maxHeight: 340 }}>
            <rect x={P} y={P} width={W - 2 * P} height={H - 2 * P} fill="rgba(10,10,26,0.5)" rx="8" />

            {/* Show ALL past decision boundaries (faded) + active one (bright) */}
            {treeData.map((tree, i) => {
              if (step < i + 1) return null;
              const isActive = activeTreeIdx === i;
              const s = tree.stump;
              const color = isActive ? '#fbbf24' : `hsl(${(i * 51) % 360}, 70%, 60%)`;
              if (s.featureAxis === 'x') {
                return <motion.line key={`split-${i}`} x1={sx(s.threshold)} y1={sy(100)} x2={sx(s.threshold)} y2={sy(0)}
                  stroke={color} strokeWidth={isActive ? 2.5 : 1.5} strokeDasharray={isActive ? "6,4" : "3,3"}
                  initial={{ opacity: 0 }} animate={{ opacity: isActive ? 1 : (step >= totalSteps - 1 ? 0.4 : 0.2) }} />;
              } else {
                return <motion.line key={`split-${i}`} x1={sx(0)} y1={sy(s.threshold)} x2={sx(100)} y2={sy(s.threshold)}
                  stroke={color} strokeWidth={isActive ? 2.5 : 1.5} strokeDasharray={isActive ? "6,4" : "3,3"}
                  initial={{ opacity: 0 }} animate={{ opacity: isActive ? 1 : (step >= totalSteps - 1 ? 0.4 : 0.2) }} />;
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

        {/* Trees Panel */}
        <div className="lg:col-span-2 flex flex-col gap-2">
          <div className="text-xs font-bold text-white uppercase tracking-wider mb-1 flex items-center gap-2">
            <Dice6 className="w-4 h-4 text-amber-400" /> {NUM_TREES} Pohon Acak Total
          </div>

          {/* Key difference from RF */}
          <div className="p-3 rounded-xl border border-amber-500/30 bg-amber-500/5">
            <div className="text-xs font-bold text-amber-300 mb-1">⚡ Perbedaan dari Random Forest:</div>
            <div className="grid grid-cols-2 gap-2 text-[9px]">
              <div className="p-1.5 rounded bg-indigo-500/10 border border-indigo-500/20">
                <div className="font-bold text-indigo-300">Random Forest</div>
                <div className="text-slate-400">Data: <b>Sebagian</b> (bootstrap)</div>
                <div className="text-slate-400">Split: <b>Optimal</b></div>
              </div>
              <div className="p-1.5 rounded bg-amber-500/10 border border-amber-500/20">
                <div className="font-bold text-amber-300">Extra Trees ⚡</div>
                <div className="text-slate-400">Data: <b>Semua</b></div>
                <div className="text-slate-400">Split: <b>100% Acak!</b></div>
              </div>
            </div>
          </div>

          {treeData.map((tree, i) => {
            const isActive = activeTreeIdx === i;
            const isPast = step > i + 1;
            const isVisible = step >= i + 1;
            return (
              <motion.div key={i}
                initial={{ opacity: 0.3 }}
                animate={{ opacity: isVisible ? 1 : 0.3, scale: isActive ? 1.02 : 1 }}
                className={`p-2 rounded-lg border transition-all text-[10px] ${
                  isActive ? 'border-amber-500 bg-amber-500/10' : isPast ? 'border-emerald-500/20 bg-[var(--bg-card)]' : 'border-[var(--border-color)] bg-[var(--bg-card)]'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Dice6 className={`w-3 h-3 ${isActive ? 'text-amber-400' : isPast ? 'text-emerald-400' : 'text-slate-600'}`} />
                  <span className={`font-bold ${isActive ? 'text-amber-300' : isPast ? 'text-emerald-300' : 'text-slate-500'}`}>
                    Pohon {i + 1}
                  </span>
                  {isActive && <span className="text-amber-400 ml-auto animate-pulse text-[9px]">🎲 Acak!</span>}
                  {isPast && <span className="text-emerald-400 ml-auto">✓ {(tree.stump.accuracy * 100).toFixed(0)}%</span>}
                  {isVisible && (
                    <span className="text-[9px] text-slate-400 ml-auto">
                      {tree.stump.featureAxis.toUpperCase()}={tree.stump.threshold.toFixed(0)}
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
                  <Vote className="w-5 h-5 text-emerald-400" />
                  <span className="text-sm font-black text-white">Voting Selesai!</span>
                </div>
                <div className="text-[10px] text-[var(--text-muted)] mt-1 space-y-0.5">
                  <div>Rata-rata akurasi per pohon: <span className="text-amber-300">{(avgTreeAccuracy * 100).toFixed(1)}%</span></div>
                  {finalPredictions && (() => {
                    const correct = data.filter((pt, i) => finalPredictions[i] === pt.label).length;
                    return <div>Akurasi gabungan: <span className="text-emerald-300 font-bold">{(correct / data.length * 100).toFixed(1)}%</span> 🚀</div>;
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
          <h4 className="text-sm font-bold text-amber-300 mb-2">🎲 Extremely Randomized = Sangat Acak</h4>
          <p className="text-xs text-[var(--text-muted)] leading-relaxed">
            Random Forest sudah acak, tapi Extra Trees <b>lebih acak lagi</b>! Garis batas (threshold) dipilih secara <b>100% acak</b>, 
            tidak mencari posisi terbaik. Ibarat juri yang menilai <b>secara spontan</b> tanpa berpikir panjang — 
            anehnya, justru lebih cepat dan sering lebih akurat!
          </p>
        </div>
        <div className="glass-card p-4 border-l-4 border-indigo-500">
          <h4 className="text-sm font-bold text-indigo-300 mb-2">📊 Seluruh Data (Tanpa Bootstrap)</h4>
          <p className="text-xs text-[var(--text-muted)] leading-relaxed">
            Tidak seperti Random Forest yang hanya memberi <b>sebagian data</b> ke setiap pohon, 
            Extra Trees memberikan <b>seluruh data</b> ke semua pohon. Yang berbeda hanyalah <b>cara membelah</b> — 
            sepenuhnya acak, bukan optimal.
          </p>
        </div>
        <div className="glass-card p-4 border-l-4 border-emerald-500">
          <h4 className="text-sm font-bold text-emerald-300 mb-2">⚡ Super Cepat + Anti-Noise</h4>
          <p className="text-xs text-[var(--text-muted)] leading-relaxed">
            Karena tidak perlu menghitung split terbaik, <b>training sangat cepat</b>. 
            Bonus: keacakan ekstrem membuat model <b>kebal terhadap noise</b> (data aneh/kotor) — 
            karena noise acak tidak mungkin konsisten di semua pohon.
          </p>
        </div>
      </div>
    </div>
  );
}
