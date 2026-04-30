'use client';

import { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shuffle, Vote, TreePine, Brain, Cpu, Calculator, Target } from 'lucide-react';
import SimulationControls, { useSimulationLoop } from '../SimulationControls';
import { generateClassificationData, LabeledPoint2D } from '@/lib/datasets';

const W = 600, H = 250, P = 30;
const CLASS_COLORS = ['#818cf8', '#fb7185', '#34d399', '#fbbf24'];

interface VotingModel {
  name: string;
  icon: 'tree' | 'brain' | 'cpu';
  color: string;
  borderColor: string;
  axis: 'x' | 'y';
  threshold: number;
  leftLabel: number;
  rightLabel: number;
  accuracy: number;
  confidence: number[]; // per-point confidence for soft voting [0..1]
}

function buildVotingModels(data: LabeledPoint2D[]): VotingModel[] {
  const configs = [
    { name: 'Decision Tree', icon: 'tree' as const, color: 'text-emerald-400', borderColor: 'border-emerald-500/50' },
    { name: 'Neural Net', icon: 'brain' as const, color: 'text-purple-400', borderColor: 'border-purple-500/50' },
    { name: 'SVM', icon: 'cpu' as const, color: 'text-amber-400', borderColor: 'border-amber-500/50' },
  ];

  return configs.map((config, idx) => {
    const axis = idx === 0 ? 'x' : idx === 1 ? 'y' : (Math.random() > 0.5 ? 'x' : 'y');
    const vals = data.map(p => axis === 'x' ? p.x : p.y);
    const min = Math.min(...vals), max = Math.max(...vals);
    const threshold = min + (0.3 + idx * 0.15 + Math.random() * 0.1) * (max - min);

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

    // Confidence: higher near threshold = lower confidence
    const confidence = data.map(p => {
      const val = axis === 'x' ? p.x : p.y;
      const dist = Math.abs(val - threshold) / (max - min);
      return Math.min(0.95, 0.5 + dist); // 0.5 to 0.95
    });

    return { ...config, axis, threshold, leftLabel, rightLabel, accuracy: correct / data.length, confidence };
  });
}

export default function VotingClassifierViz() {
  const [data, setData] = useState<LabeledPoint2D[]>(() => generateClassificationData(60, 'xor'));
  const [dataType, setDataType] = useState<'xor' | 'linear' | 'circle'>('xor');
  const [votingType, setVotingType] = useState<'hard' | 'soft'>('hard');
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [step, setStep] = useState(0);

  const models = useMemo(() => buildVotingModels(data), [data]);
  const totalSteps = 5; // 0=data, 1..3=model predictions, 4=vote result

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

  // Compute predictions
  const hardPredictions = useMemo(() => {
    return data.map(pt => {
      const votes = models.map(m => (m.axis === 'x' ? pt.x : pt.y) <= m.threshold ? m.leftLabel : m.rightLabel);
      const counts: Record<number, number> = {};
      votes.forEach(v => { counts[v] = (counts[v] || 0) + 1; });
      return parseInt(Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0]);
    });
  }, [data, models]);

  const softPredictions = useMemo(() => {
    return data.map((pt, i) => {
      const scores: Record<number, number> = {};
      models.forEach(m => {
        const pred = (m.axis === 'x' ? pt.x : pt.y) <= m.threshold ? m.leftLabel : m.rightLabel;
        const conf = m.confidence[i];
        scores[pred] = (scores[pred] || 0) + conf;
      });
      return parseInt(Object.entries(scores).sort((a, b) => b[1] - a[1])[0][0]);
    });
  }, [data, models]);

  const predictions = votingType === 'hard' ? hardPredictions : softPredictions;

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
          <option value="xor">Pola Silang (XOR)</option>
          <option value="circle">Pola Melingkar</option>
          <option value="linear">Pola Linear</option>
        </select>
        <div className="h-6 w-px bg-[var(--border-color)] mx-2 hidden sm:block"></div>
        <div className="flex items-center gap-2">
          <button onClick={() => { setVotingType('hard'); setStep(s => Math.min(s, 3)); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${votingType === 'hard' ? 'bg-indigo-500 text-white shadow-lg' : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}>
            🗳️ Hard Voting
          </button>
          <button onClick={() => { setVotingType('soft'); setStep(s => Math.min(s, 3)); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${votingType === 'soft' ? 'bg-pink-500 text-white shadow-lg' : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}>
            📊 Soft Voting
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Scatter plot */}
        <div className="lg:col-span-3 viz-container p-4">
          <div className="text-xs text-center text-[var(--text-muted)] mb-2">
            {step === 0 && `📊 3 model BERBEDA jenis akan voting — mode: ${votingType === 'hard' ? 'Hard (suara terbanyak)' : 'Soft (rata-rata keyakinan)'}`}
            {activeModelIdx >= 0 && `🧠 ${models[activeModelIdx].name}: membelah di ${models[activeModelIdx].axis.toUpperCase()} = ${models[activeModelIdx].threshold.toFixed(1)}`}
            {step === 4 && `🗳️ ${votingType === 'hard' ? 'Suara terbanyak menang!' : 'Model yang lebih yakin punya pengaruh lebih besar!'}`}
          </div>
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" style={{ maxHeight: 300 }}>
            <rect x={P} y={P} width={W - 2 * P} height={H - 2 * P} fill="rgba(10,10,26,0.5)" rx="8" />

            {/* Model decision boundaries */}
            {models.map((model, i) => {
              if (step < i + 1) return null;
              const isActive = activeModelIdx === i;
              const colors = ['#10b981', '#a855f7', '#f59e0b'];
              const color = colors[i];
              if (model.axis === 'x') {
                return <motion.line key={`split-${i}`} x1={sx(model.threshold)} y1={sy(100)} x2={sx(model.threshold)} y2={sy(0)}
                  stroke={color} strokeWidth={isActive ? 2.5 : 1.5} strokeDasharray={isActive ? "6,4" : "3,3"}
                  initial={{ opacity: 0 }} animate={{ opacity: isActive ? 0.8 : (step >= 4 ? 0.3 : 0.2) }} />;
              } else {
                return <motion.line key={`split-${i}`} x1={sx(0)} y1={sy(model.threshold)} x2={sx(100)} y2={sy(model.threshold)}
                  stroke={color} strokeWidth={isActive ? 2.5 : 1.5} strokeDasharray={isActive ? "6,4" : "3,3"}
                  initial={{ opacity: 0 }} animate={{ opacity: isActive ? 0.8 : (step >= 4 ? 0.3 : 0.2) }} />;
              }
            })}

            {data.map((pt, i) => {
              const showFinal = step >= 4;
              const pred = showFinal ? predictions[i] : null;
              const fillColor = pred !== null ? CLASS_COLORS[pred] : CLASS_COLORS[pt.label];
              const isWrong = pred !== null && pred !== pt.label;
              return (
                <motion.circle key={i} cx={sx(pt.x)} cy={sy(pt.y)} r={4}
                  fill={fillColor}
                  stroke={isWrong ? '#ef4444' : `${CLASS_COLORS[pt.label]}50`}
                  strokeWidth={isWrong ? 2 : 0.5} opacity={0.85} />
              );
            })}
          </svg>
        </div>

        {/* Voting panel */}
        <div className="lg:col-span-2 flex flex-col gap-2">
          <div className="text-xs font-bold text-white uppercase tracking-wider mb-1 flex items-center gap-2">
            <Vote className="w-4 h-4 text-indigo-400" /> Voting: 3 Model Berbeda
          </div>

          {/* Mode explanation */}
          <div className={`p-3 rounded-xl border ${votingType === 'hard' ? 'border-indigo-500/30 bg-indigo-500/5' : 'border-pink-500/30 bg-pink-500/5'}`}>
            <div className="flex items-center gap-2 mb-1">
              {votingType === 'hard' ? <Vote className="w-4 h-4 text-indigo-400" /> : <Calculator className="w-4 h-4 text-pink-400" />}
              <span className={`text-xs font-bold ${votingType === 'hard' ? 'text-indigo-300' : 'text-pink-300'}`}>
                {votingType === 'hard' ? 'Hard Voting: Satu Suara Per Model' : 'Soft Voting: Rata-rata Keyakinan'}
              </span>
            </div>
            <p className="text-[9px] text-slate-400">
              {votingType === 'hard'
                ? 'Setiap model memilih SATU jawaban. Jawaban yang dipilih mayoritas menang. Ibarat pemilu — 1 orang = 1 suara.'
                : 'Setiap model memberi PERSENTASE keyakinan. Jawaban dengan rata-rata keyakinan tertinggi menang. Model yang lebih yakin punya pengaruh lebih besar!'}
            </p>
          </div>

          {/* Model cards */}
          {models.map((model, i) => {
            const Icon = IconMap[model.icon];
            const isActive = activeModelIdx === i;
            const isPast = step > i + 1;
            const isVisible = step >= i + 1;

            // Sample point prediction for demo
            const samplePred = (model.axis === 'x' ? data[0]?.x ?? 50 : data[0]?.y ?? 50) <= model.threshold ? model.leftLabel : model.rightLabel;
            const sampleConf = model.confidence[0] ?? 0.7;

            return (
              <motion.div key={i}
                initial={{ opacity: 0.3 }}
                animate={{ opacity: isVisible ? 1 : 0.3, scale: isActive ? 1.02 : 1 }}
                className={`p-2.5 rounded-xl border-2 transition-all ${
                  isActive ? `${model.borderColor} bg-white/5` : isPast ? 'border-emerald-500/20 bg-[var(--bg-card)]' : 'border-[var(--border-color)] bg-[var(--bg-card)]'
                }`}>
                <div className="flex items-center gap-2">
                  <Icon className={`w-4 h-4 ${isActive ? model.color : isPast ? 'text-emerald-400' : 'text-slate-600'}`} />
                  <span className={`text-xs font-bold ${isActive ? 'text-white' : isPast ? 'text-emerald-300' : 'text-slate-500'}`}>
                    {model.name}
                  </span>
                  {isPast && <span className="text-emerald-400 ml-auto text-[10px]">✓ {(model.accuracy * 100).toFixed(0)}%</span>}
                </div>
                {isVisible && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                    className="mt-1 text-[10px] text-slate-400">
                    {votingType === 'hard' ? (
                      <div>Prediksi: <span className={`font-bold ${model.color}`}>Kelas {samplePred}</span></div>
                    ) : (
                      <div>Keyakinan: <span className={`font-bold ${model.color}`}>{(sampleConf * 100).toFixed(0)}%</span> → Kelas {samplePred}</div>
                    )}
                  </motion.div>
                )}
              </motion.div>
            );
          })}

          {/* Final result */}
          <AnimatePresence>
            {step >= 4 && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className={`p-3 rounded-xl border-2 ${votingType === 'hard' ? 'border-indigo-500 bg-indigo-500/10' : 'border-pink-500 bg-pink-500/10'}`}>
                <div className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-emerald-400" />
                  <span className="text-sm font-black text-white">
                    {votingType === 'hard' ? 'Hard' : 'Soft'} Voting Selesai!
                  </span>
                </div>
                <div className="text-[10px] text-[var(--text-muted)] mt-1 space-y-0.5">
                  {(() => {
                    const correct = data.filter((pt, i) => predictions[i] === pt.label).length;
                    return (
                      <>
                        <div>Akurasi gabungan: <span className="text-emerald-300 font-bold">{(correct / data.length * 100).toFixed(1)}%</span></div>
                        <div className="text-slate-500">Coba ganti mode voting untuk melihat perbedaan hasil!</div>
                      </>
                    );
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
        <div className="glass-card p-4 border-l-4 border-indigo-500">
          <h4 className="text-sm font-bold text-indigo-300 mb-2">🗳️ Hard Voting = Pemilu</h4>
          <p className="text-xs text-[var(--text-muted)] leading-relaxed">
            Ibarat <b>3 juri lomba memasak</b> memilih pemenang. Jika 2 dari 3 juri memilih "Kucing", 
            maka hasilnya "Kucing" — <b>tidak peduli seberapa yakin</b> juri yang kalah suara. 
            Sederhana, adil, dan mudah dipahami!
          </p>
        </div>
        <div className="glass-card p-4 border-l-4 border-pink-500">
          <h4 className="text-sm font-bold text-pink-300 mb-2">📊 Soft Voting = Rata-rata Keyakinan</h4>
          <p className="text-xs text-[var(--text-muted)] leading-relaxed">
            Ibarat juri yang bisa bilang <b>"Saya 90% yakin ini Kucing"</b> vs <b>"Saya 51% yakin ini Anjing"</b>. 
            Jawaban dihitung berdasarkan rata-rata keyakinan, sehingga <b>model yang lebih yakin punya pengaruh lebih besar</b>.
            Biasanya lebih akurat dari Hard Voting!
          </p>
        </div>
        <div className="glass-card p-4 border-l-4 border-emerald-500">
          <h4 className="text-sm font-bold text-emerald-300 mb-2">🔀 Model BERBEDA Jenis</h4>
          <p className="text-xs text-[var(--text-muted)] leading-relaxed">
            Kekuatan Voting Classifier terletak pada penggunaan model <b>yang berbeda jenis</b> — bukan banyak model yang sama!
            Decision Tree bagus di satu area, SVM di area lain, Neural Net di area lainnya. 
            Gabungan <b>keahlian berbeda</b> menghasilkan prediksi yang lebih kuat.
          </p>
        </div>
      </div>
    </div>
  );
}
