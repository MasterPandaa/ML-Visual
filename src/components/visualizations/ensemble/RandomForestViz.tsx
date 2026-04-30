'use client';

import { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shuffle, TreePine, Vote, Users } from 'lucide-react';
import SimulationControls, { useSimulationLoop } from '../SimulationControls';
import { generateClassificationData, LabeledPoint2D } from '@/lib/datasets';

const W = 600, H = 300, P = 30;
const CLASS_COLORS = ['#818cf8', '#fb7185', '#34d399', '#fbbf24'];

// Simple stump decision tree
interface Stump { featureAxis: 'x' | 'y'; threshold: number; leftLabel: number; rightLabel: number; accuracy: number; }

function buildStump(data: LabeledPoint2D[]): Stump {
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
  const correct = data.filter(p => {
    const pred = (axis === 'x' ? p.x : p.y) <= threshold ? leftLabel : rightLabel;
    return pred === p.label;
  }).length;

  return { featureAxis: axis, threshold, leftLabel, rightLabel, accuracy: correct / data.length };
}

function predictStump(stump: Stump, p: { x: number; y: number }) {
  return (stump.featureAxis === 'x' ? p.x : p.y) <= stump.threshold ? stump.leftLabel : stump.rightLabel;
}

const NUM_TREES = 5;

export default function RandomForestViz() {
  const [data, setData] = useState<LabeledPoint2D[]>(() => generateClassificationData(80, 'xor'));
  const [dataType, setDataType] = useState<'xor' | 'linear' | 'circle'>('xor');
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [step, setStep] = useState(0);

  // Build trees from bootstrap samples
  const treeData = useMemo(() => {
    const trees: { stump: Stump; sampleIndices: number[] }[] = [];
    for (let t = 0; t < NUM_TREES; t++) {
      // Bootstrap sampling
      const indices: number[] = [];
      const sample: LabeledPoint2D[] = [];
      for (let i = 0; i < data.length; i++) {
        const idx = Math.floor(Math.random() * data.length);
        indices.push(idx);
        sample.push(data[idx]);
      }
      trees.push({ stump: buildStump(sample), sampleIndices: [...new Set(indices)] });
    }
    return trees;
  }, [data]);

  // Total steps: 0=data, 1..NUM_TREES=each tree predicts, NUM_TREES+1=vote
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

  // Current active tree index (0-based)
  const activeTreeIdx = step >= 1 && step <= NUM_TREES ? step - 1 : -1;

  // Final voting
  const finalPredictions = useMemo(() => {
    if (step < totalSteps - 1) return null;
    // For each point, each tree votes
    return data.map(pt => {
      const votes = treeData.map(t => predictStump(t.stump, pt));
      const counts: Record<number, number> = {};
      votes.forEach(v => { counts[v] = (counts[v] || 0) + 1; });
      const predicted = parseInt(Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0]);
      return predicted;
    });
  }, [step, totalSteps, data, treeData]);

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
          <option value="linear">Pola Linear</option>
          <option value="circle">Pola Melingkar</option>
        </select>
      </div>

      {/* Main Scatter + Trees Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Scatter Plot */}
        <div className="lg:col-span-3 viz-container p-4">
          <div className="text-xs text-center text-[var(--text-muted)] mb-2">
            {step === 0 && '📊 Data awal — 80 titik dengan 2 kelas warna'}
            {activeTreeIdx >= 0 && `🌳 Pohon ${activeTreeIdx + 1}: membelah data di garis ${treeData[activeTreeIdx].stump.featureAxis.toUpperCase()} = ${treeData[activeTreeIdx].stump.threshold.toFixed(1)} (Akurasi: ${(treeData[activeTreeIdx].stump.accuracy * 100).toFixed(0)}%)`}
            {step === totalSteps - 1 && '🗳️ Voting mayoritas dari semua pohon — warna = prediksi gabungan'}
          </div>
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" style={{ maxHeight: 340 }}>
            <rect x={P} y={P} width={W - 2 * P} height={H - 2 * P} fill="rgba(10,10,26,0.5)" rx="8" />

            {/* Decision boundary line for active tree */}
            <AnimatePresence>
              {activeTreeIdx >= 0 && (() => {
                const s = treeData[activeTreeIdx].stump;
                if (s.featureAxis === 'x') {
                  return <motion.line key={`split-${activeTreeIdx}`} x1={sx(s.threshold)} y1={sy(100)} x2={sx(s.threshold)} y2={sy(0)}
                    stroke="#fbbf24" strokeWidth={2.5} strokeDasharray="6,4"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />;
                } else {
                  return <motion.line key={`split-${activeTreeIdx}`} x1={sx(0)} y1={sy(s.threshold)} x2={sx(100)} y2={sy(s.threshold)}
                    stroke="#fbbf24" strokeWidth={2.5} strokeDasharray="6,4"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />;
                }
              })()}
            </AnimatePresence>

            {/* Region labels for active tree */}
            {activeTreeIdx >= 0 && (() => {
              const s = treeData[activeTreeIdx].stump;
              if (s.featureAxis === 'x') {
                return <>
                  <rect x={P} y={P} width={sx(s.threshold) - P} height={H - 2 * P} fill={`${CLASS_COLORS[s.leftLabel]}15`} rx="4" />
                  <rect x={sx(s.threshold)} y={P} width={W - P - sx(s.threshold)} height={H - 2 * P} fill={`${CLASS_COLORS[s.rightLabel]}15`} rx="4" />
                </>;
              } else {
                return <>
                  <rect x={P} y={sy(s.threshold)} width={W - 2 * P} height={sy(0) - sy(s.threshold)} fill={`${CLASS_COLORS[s.leftLabel]}15`} rx="4" />
                  <rect x={P} y={P} width={W - 2 * P} height={sy(s.threshold) - P} fill={`${CLASS_COLORS[s.rightLabel]}15`} rx="4" />
                </>;
              }
            })()}

            {/* Data points */}
            {data.map((pt, i) => {
              const isBootstrapped = activeTreeIdx >= 0 && treeData[activeTreeIdx].sampleIndices.includes(i);
              const finalPred = finalPredictions ? finalPredictions[i] : null;
              const fillColor = finalPred !== null ? CLASS_COLORS[finalPred] : CLASS_COLORS[pt.label];
              const isWrong = finalPred !== null && finalPred !== pt.label;

              return (
                <motion.circle key={i} cx={sx(pt.x)} cy={sy(pt.y)}
                  r={isBootstrapped ? 5 : (activeTreeIdx >= 0 ? 3 : 4)}
                  fill={fillColor}
                  stroke={isWrong ? '#ef4444' : (isBootstrapped ? '#fff' : `${CLASS_COLORS[pt.label]}50`)}
                  strokeWidth={isWrong ? 2 : (isBootstrapped ? 1.5 : 0.5)}
                  opacity={activeTreeIdx >= 0 ? (isBootstrapped ? 1 : 0.15) : 0.85}
                  animate={{ r: isBootstrapped ? 5 : (activeTreeIdx >= 0 ? 3 : 4) }}
                  transition={{ duration: 0.3 }}
                />
              );
            })}
          </svg>
        </div>

        {/* Trees Panel */}
        <div className="lg:col-span-2 flex flex-col gap-2">
          <div className="text-xs font-bold text-white uppercase tracking-wider mb-1 flex items-center gap-2">
            <Users className="w-4 h-4 text-indigo-400" /> {NUM_TREES} Pohon Keputusan (Paralel)
          </div>
          {treeData.map((tree, i) => {
            const isActive = activeTreeIdx === i;
            const isPast = step > i + 1;
            const isVisible = step >= i + 1;
            return (
              <motion.div key={i}
                initial={{ opacity: 0.3 }}
                animate={{
                  opacity: isVisible ? 1 : 0.3,
                  scale: isActive ? 1.02 : 1,
                  borderColor: isActive ? '#818cf8' : (isPast ? '#10b981' : 'var(--border-color)')
                }}
                className={`p-3 rounded-xl border-2 transition-all ${isActive ? 'bg-indigo-500/10 shadow-[0_0_15px_rgba(99,102,241,0.15)]' : 'bg-[var(--bg-card)]'}`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <TreePine className={`w-4 h-4 ${isActive ? 'text-indigo-400' : (isPast ? 'text-emerald-400' : 'text-slate-600')}`} />
                  <span className={`text-xs font-bold ${isActive ? 'text-indigo-300' : (isPast ? 'text-emerald-300' : 'text-slate-500')}`}>
                    Pohon {i + 1}
                  </span>
                  {isPast && <span className="text-[10px] text-emerald-400 ml-auto">✓ Selesai</span>}
                  {isActive && <span className="text-[10px] text-amber-400 ml-auto animate-pulse">● Aktif</span>}
                </div>
                {isVisible && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                    className="text-[10px] text-[var(--text-muted)] leading-relaxed space-y-0.5">
                    <div>Fitur: <span className="text-white font-mono">{tree.stump.featureAxis.toUpperCase()}</span> | Batas: <span className="text-amber-300 font-mono">{tree.stump.threshold.toFixed(1)}</span></div>
                    <div>Sampel: <span className="text-indigo-300">{tree.sampleIndices.length}/{data.length}</span> titik (Bootstrap)</div>
                    <div className="flex items-center gap-1">
                      Akurasi: 
                      <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                        <motion.div className="h-full bg-emerald-400 rounded-full" initial={{ width: 0 }}
                          animate={{ width: `${tree.stump.accuracy * 100}%` }} transition={{ duration: 0.5 }} />
                      </div>
                      <span className="text-emerald-400 font-mono">{(tree.stump.accuracy * 100).toFixed(0)}%</span>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            );
          })}

          {/* Final vote result */}
          <AnimatePresence>
            {step >= totalSteps - 1 && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="p-3 rounded-xl border-2 border-emerald-500 bg-emerald-500/10 mt-1">
                <div className="flex items-center gap-2">
                  <Vote className="w-5 h-5 text-emerald-400" />
                  <span className="text-sm font-black text-white">Voting Mayoritas Selesai!</span>
                </div>
                <div className="text-[10px] text-[var(--text-muted)] mt-1">
                  {finalPredictions && (() => {
                    const correct = data.filter((pt, i) => finalPredictions[i] === pt.label).length;
                    return `Akurasi gabungan: ${(correct / data.length * 100).toFixed(1)}% (${correct}/${data.length} benar)`;
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
        extraInfo={step === totalSteps - 1 ? '✅ Semua Pohon Sudah Voting' : undefined}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        <div className="glass-card p-4 border-l-4 border-emerald-500">
          <h4 className="text-sm font-bold text-emerald-300 mb-2">🎲 Bootstrap (Sampling Acak)</h4>
          <p className="text-xs text-[var(--text-muted)] leading-relaxed">
            Ibarat mengadakan <b>rapat dengan beberapa tim</b>. Setiap tim (pohon) hanya membaca <b>sebagian berkas</b> yang berbeda-beda. 
            Titik yang bersinar terang = berkas yang dibaca oleh tim aktif. Titik redup = berkas yang tidak dibaca tim ini.
          </p>
        </div>
        <div className="glass-card p-4 border-l-4 border-indigo-500">
          <h4 className="text-sm font-bold text-indigo-300 mb-2">🌳 Banyak Pohon = Banyak Pendapat</h4>
          <p className="text-xs text-[var(--text-muted)] leading-relaxed">
            Setiap pohon membuat <b>garis batas keputusan sendiri</b> (garis kuning putus-putus). Karena tiap pohon membaca berkas berbeda, 
            masing-masing punya pandangan unik — <b>ada yang akurat di area tertentu, tapi salah di area lain</b>.
          </p>
        </div>
        <div className="glass-card p-4 border-l-4 border-amber-500">
          <h4 className="text-sm font-bold text-amber-300 mb-2">🗳️ Keputusan Final = Suara Terbanyak</h4>
          <p className="text-xs text-[var(--text-muted)] leading-relaxed">
            Di akhir, semua pohon <b>voting</b> untuk setiap titik. Warna berubah sesuai prediksi mayoritas.
            Titik dengan <b>lingkaran merah</b> berarti prediksi gabungan masih salah — 
            tapi biasanya <b>akurasi gabungan lebih tinggi</b> dari satu pohon saja!
          </p>
        </div>
      </div>
    </div>
  );
}
