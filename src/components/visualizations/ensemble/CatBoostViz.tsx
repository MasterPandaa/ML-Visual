'use client';

import { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shuffle, Tag, GitBranch, Shield, Target, ArrowRight } from 'lucide-react';
import SimulationControls, { useSimulationLoop } from '../SimulationControls';

const W = 600, H = 300, P = 30;
const CLASS_COLORS = ['#818cf8', '#fb7185', '#34d399', '#fbbf24'];

// Simulated categorical + numeric dataset
interface CatDataPoint {
  id: number;
  numericX: number; // numeric feature (e.g. umur)
  numericY: number; // numeric feature (e.g. penghasilan)
  category: string; // categorical feature (e.g. kota)
  encodedCategory: number; // target-encoded value
  label: number; // 0 or 1
}

const CATEGORIES = ['Jakarta', 'Bandung', 'Surabaya', 'Yogya', 'Medan'];
const CAT_COLORS: Record<string, string> = {
  'Jakarta': '#f472b6', 'Bandung': '#818cf8', 'Surabaya': '#34d399',
  'Yogya': '#fbbf24', 'Medan': '#fb923c'
};

function generateCatData(n: number): CatDataPoint[] {
  const points: CatDataPoint[] = [];
  for (let i = 0; i < n; i++) {
    const cat = CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];
    const x = Math.random() * 100;
    const y = Math.random() * 100;
    // Label depends on category + position
    const catBonus = cat === 'Jakarta' ? 20 : cat === 'Bandung' ? -10 : cat === 'Surabaya' ? 15 : cat === 'Yogya' ? -5 : 0;
    const label = (y + catBonus > 0.5 * x + 30) ? 1 : 0;
    points.push({ id: i, numericX: x, numericY: y, category: cat, encodedCategory: 0, label });
  }
  // Target encoding
  const catCounts: Record<string, { sum: number; count: number }> = {};
  points.forEach(p => {
    if (!catCounts[p.category]) catCounts[p.category] = { sum: 0, count: 0 };
    catCounts[p.category].sum += p.label;
    catCounts[p.category].count++;
  });
  points.forEach(p => {
    p.encodedCategory = catCounts[p.category].sum / catCounts[p.category].count;
  });
  return points;
}

interface CatBoostStage {
  type: 'encoding' | 'symmetric_split' | 'ordered_boosting';
  description: string;
}

export default function CatBoostViz() {
  const [data, setData] = useState<CatDataPoint[]>(() => generateCatData(50));
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [step, setStep] = useState(0);
  const [showEncoded, setShowEncoded] = useState(false);

  const stages: CatBoostStage[] = useMemo(() => [
    { type: 'encoding', description: 'Mengubah kategori teks menjadi angka (Target Encoding)' },
    { type: 'symmetric_split', description: 'Membangun pohon simetris — pertanyaan SAMA di setiap level' },
    { type: 'ordered_boosting', description: 'Ordered Boosting — data diproses berurutan untuk cegah overfit' },
  ], []);

  const totalSteps = stages.length + 2; // 0=data, 1..3=stages, 4=result

  const nextStep = useCallback((): boolean => {
    if (step >= totalSteps - 1) { setIsPlaying(false); return false; }
    setStep(s => s + 1);
    if (step === 0) setShowEncoded(true);
    return true;
  }, [step, totalSteps]);

  const reset = useCallback(() => { setStep(0); setIsPlaying(false); setShowEncoded(false); }, []);
  const randomize = useCallback(() => {
    setData(generateCatData(50));
    setStep(0); setIsPlaying(false); setShowEncoded(false);
  }, []);

  useSimulationLoop(nextStep, speed * 0.25, isPlaying);

  const sx = (x: number) => P + (x / 100) * (W - 2 * P);
  const sy = (y: number) => H - P - (y / 100) * (H - 2 * P);

  // Category distribution
  const catDist = useMemo(() => {
    const dist: Record<string, { total: number; positive: number }> = {};
    data.forEach(p => {
      if (!dist[p.category]) dist[p.category] = { total: 0, positive: 0 };
      dist[p.category].total++;
      if (p.label === 1) dist[p.category].positive++;
    });
    return dist;
  }, [data]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-4 mb-6 bg-[var(--bg-secondary)] border border-[var(--border-color)] p-4 rounded-xl">
        <button onClick={randomize} className="btn-secondary flex items-center gap-2 text-xs py-2 px-3 shrink-0">
          <Shuffle className="w-3 h-3" /> Data Baru
        </button>
        <div className="h-6 w-px bg-[var(--border-color)] mx-2 hidden sm:block"></div>
        <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
          <Tag className="w-3 h-3 text-fuchsia-400" />
          Dataset berisi data <b className="text-white">teks (nama kota)</b> + angka — keunggulan utama CatBoost!
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Scatter plot colored by category */}
        <div className="lg:col-span-3 viz-container p-4">
          <div className="text-xs text-center text-[var(--text-muted)] mb-2">
            {step === 0 && '🏷️ Setiap titik punya label TEKS (kota) — warna = kota, bentuk lingkaran/kotak = kelas'}
            {step === 1 && '🔢 Target Encoding: "Jakarta" → 0.82, "Bandung" → 0.35 (otomatis!)'}
            {step === 2 && '🌳 Pohon Simetris: pertanyaan di setiap level SAMA untuk kiri & kanan'}
            {step === 3 && '🛡️ Ordered Boosting: data diproses berurutan agar tidak menghafal'}
            {step === totalSteps - 1 && '✅ CatBoost selesai — data teks diproses tanpa coding manual!'}
          </div>
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" style={{ maxHeight: 340 }}>
            <rect x={P} y={P} width={W - 2 * P} height={H - 2 * P} fill="rgba(10,10,26,0.5)" rx="8" />

            {/* Symmetric split lines at step 2+ */}
            {step >= 2 && (
              <>
                <motion.line x1={sx(50)} y1={sy(100)} x2={sx(50)} y2={sy(0)}
                  stroke="#a78bfa" strokeWidth={2} strokeDasharray="6,4"
                  initial={{ opacity: 0 }} animate={{ opacity: 0.7 }} />
                <motion.text x={sx(50)} y={sy(100) - 5} fill="#a78bfa" fontSize="9" textAnchor="middle"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  Umur {'>'} 50?
                </motion.text>
              </>
            )}
            {step >= 3 && (
              <>
                <motion.line x1={sx(0)} y1={sy(50)} x2={sx(100)} y2={sy(50)}
                  stroke="#f0abfc" strokeWidth={2} strokeDasharray="6,4"
                  initial={{ opacity: 0 }} animate={{ opacity: 0.7 }} />
                <motion.text x={sx(100) - 5} y={sy(50) - 5} fill="#f0abfc" fontSize="9" textAnchor="end"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  Penghasilan {'>'} 50? (SAMA di kiri & kanan!)
                </motion.text>
              </>
            )}

            {/* Data points */}
            {data.map((pt) => {
              const catColor = CAT_COLORS[pt.category] || '#666';
              const isLabel1 = pt.label === 1;
              return (
                <g key={pt.id}>
                  {isLabel1 ? (
                    <motion.circle cx={sx(pt.numericX)} cy={sy(pt.numericY)} r={5}
                      fill={showEncoded ? CLASS_COLORS[pt.label] : catColor}
                      stroke={showEncoded ? '#fff' : catColor}
                      strokeWidth={1.5} opacity={0.85}
                      animate={{ fill: showEncoded ? CLASS_COLORS[pt.label] : catColor }}
                      transition={{ duration: 0.5 }} />
                  ) : (
                    <motion.rect x={sx(pt.numericX) - 4} y={sy(pt.numericY) - 4} width={8} height={8}
                      rx={1}
                      fill={showEncoded ? CLASS_COLORS[pt.label] : catColor}
                      stroke={showEncoded ? '#fff' : catColor}
                      strokeWidth={1.5} opacity={0.85}
                      animate={{ fill: showEncoded ? CLASS_COLORS[pt.label] : catColor }}
                      transition={{ duration: 0.5 }} />
                  )}
                </g>
              );
            })}
          </svg>

          {/* Legend */}
          <div className="flex flex-wrap gap-3 mt-2 justify-center">
            {CATEGORIES.map(cat => (
              <div key={cat} className="flex items-center gap-1 text-[9px]">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: CAT_COLORS[cat] }} />
                <span className="text-slate-400">{cat}</span>
              </div>
            ))}
            <div className="w-px h-3 bg-slate-600 mx-1" />
            <div className="flex items-center gap-1 text-[9px] text-slate-400">
              <div className="w-2.5 h-2.5 rounded-full border border-white" /> Kelas 1
              <div className="w-2.5 h-2.5 rounded-sm border border-white ml-1" /> Kelas 0
            </div>
          </div>
        </div>

        {/* Right panel */}
        <div className="lg:col-span-2 flex flex-col gap-2">
          <div className="text-xs font-bold text-white uppercase tracking-wider mb-1 flex items-center gap-2">
            <Tag className="w-4 h-4 text-fuchsia-400" /> CatBoost: Ahli Data Teks
          </div>

          {/* Category Encoding Table */}
          <div className="p-3 rounded-xl border border-fuchsia-500/30 bg-fuchsia-500/5">
            <div className="flex items-center gap-2 mb-2">
              <Tag className="w-4 h-4 text-fuchsia-400" />
              <span className="text-xs font-bold text-fuchsia-300">Target Encoding Otomatis</span>
            </div>
            <div className="space-y-1">
              {CATEGORIES.map(cat => {
                const d = catDist[cat];
                if (!d) return null;
                const encoded = (d.positive / d.total);
                return (
                  <div key={cat} className="flex items-center gap-2 text-[10px]">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: CAT_COLORS[cat] }} />
                    <span className="text-slate-300 w-16">"{cat}"</span>
                    <AnimatePresence>
                      {step >= 1 && (
                        <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                          className="flex items-center gap-1">
                          <ArrowRight className="w-3 h-3 text-fuchsia-400" />
                          <span className="text-fuchsia-300 font-mono font-bold">{encoded.toFixed(2)}</span>
                          <span className="text-slate-500">({d.positive}/{d.total})</span>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
            {step < 1 && <p className="text-[8px] text-slate-500 mt-1">Tekan ▶ untuk melihat konversi teks → angka</p>}
          </div>

          {/* Symmetric Tree visual */}
          <AnimatePresence>
            {step >= 2 && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                className="p-3 rounded-xl border border-purple-500/30 bg-purple-500/5">
                <div className="flex items-center gap-2 mb-2">
                  <GitBranch className="w-4 h-4 text-purple-400" />
                  <span className="text-xs font-bold text-purple-300">Pohon Simetris (Balanced)</span>
                </div>
                <div className="flex justify-center">
                  <svg viewBox="0 0 200 80" className="w-full h-auto" style={{ maxHeight: 80 }}>
                    {/* Root */}
                    <rect x="75" y="2" width="50" height="18" rx="4" fill="#1e1b4b" stroke="#a78bfa" strokeWidth="1.5" />
                    <text x="100" y="14" fill="#a78bfa" fontSize="7" textAnchor="middle" fontWeight="bold">Umur{'>'} 50?</text>
                    {/* Level 1 - SAME question */}
                    <line x1="85" y1="20" x2="50" y2="35" stroke="#a78bfa" strokeWidth="1" />
                    <line x1="115" y1="20" x2="150" y2="35" stroke="#a78bfa" strokeWidth="1" />
                    <rect x="25" y="35" width="50" height="18" rx="4" fill="#1e1b4b" stroke="#f0abfc" strokeWidth="1.5" />
                    <text x="50" y="47" fill="#f0abfc" fontSize="6" textAnchor="middle">Gaji{'>'} 50?</text>
                    <rect x="125" y="35" width="50" height="18" rx="4" fill="#1e1b4b" stroke="#f0abfc" strokeWidth="1.5" />
                    <text x="150" y="47" fill="#f0abfc" fontSize="6" textAnchor="middle">Gaji{'>'} 50?</text>
                    {/* Highlight: SAME */}
                    <motion.rect x="20" y="32" width="160" height="24" rx="6" fill="none" stroke="#fbbf24" strokeWidth="1"
                      strokeDasharray="3,3" initial={{ opacity: 0 }} animate={{ opacity: [0.3, 0.8, 0.3] }}
                      transition={{ duration: 2, repeat: Infinity }} />
                    <text x="100" y="72" fill="#fbbf24" fontSize="7" textAnchor="middle" fontWeight="bold">↑ Pertanyaan SAMA!</text>
                  </svg>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Ordered Boosting */}
          <AnimatePresence>
            {step >= 3 && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                className="p-3 rounded-xl border border-emerald-500/30 bg-emerald-500/5">
                <div className="flex items-center gap-2 mb-1">
                  <Shield className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold text-emerald-300">Ordered Boosting (Anti-Overfit)</span>
                </div>
                <div className="flex gap-1 items-center">
                  {[1, 2, 3, 4, 5].map(i => (
                    <motion.div key={i}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: i * 0.15 }}
                      className="flex-1 h-6 rounded bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-[8px] text-emerald-300 font-mono">
                      D{i}
                    </motion.div>
                  ))}
                  <ArrowRight className="w-3 h-3 text-emerald-400 shrink-0" />
                  <div className="text-[8px] text-emerald-300 font-bold">Urut!</div>
                </div>
                <p className="text-[8px] text-slate-500 mt-1">
                  Data diproses satu per satu secara berurutan — tidak "mengintip" data masa depan
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Final result */}
          <AnimatePresence>
            {step >= totalSteps - 1 && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="p-3 rounded-xl border-2 border-emerald-500 bg-emerald-500/10 mt-1">
                <div className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-emerald-400" />
                  <span className="text-sm font-black text-white">CatBoost Selesai!</span>
                </div>
                <div className="text-[10px] text-[var(--text-muted)] mt-1">
                  Data teks berhasil diproses otomatis tanpa perlu One-Hot Encoding manual!
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
        <div className="glass-card p-4 border-l-4 border-fuchsia-500">
          <h4 className="text-sm font-bold text-fuchsia-300 mb-2">🏷️ Ahli Data Kategori (Teks)</h4>
          <p className="text-xs text-[var(--text-muted)] leading-relaxed">
            Kebanyakan model ML hanya paham angka. Jika ada data teks seperti "Jakarta" atau "Bandung", 
            kita harus mengubahnya dulu secara manual. <b>CatBoost melakukan ini otomatis</b> dengan Target Encoding — 
            ibarat menerjemahkan bahasa asing tanpa perlu kamus.
          </p>
        </div>
        <div className="glass-card p-4 border-l-4 border-purple-500">
          <h4 className="text-sm font-bold text-purple-300 mb-2">⚖️ Pohon Simetris (Adil)</h4>
          <p className="text-xs text-[var(--text-muted)] leading-relaxed">
            Perhatikan pohon di panel kanan! Di setiap level, <b>pertanyaan yang SAMA</b> diterapkan untuk cabang kiri dan kanan.
            Ibarat ujian dengan soal yang sama untuk semua peserta — <b>adil dan konsisten</b>. Ini membuat prediksi lebih stabil.
          </p>
        </div>
        <div className="glass-card p-4 border-l-4 border-emerald-500">
          <h4 className="text-sm font-bold text-emerald-300 mb-2">🛡️ Ordered Boosting</h4>
          <p className="text-xs text-[var(--text-muted)] leading-relaxed">
            Rahasia anti-overfit CatBoost! Saat menghitung encoding untuk data ke-5, 
            ia <b>hanya menggunakan data 1-4</b> (tidak mengintip data 5 ke atas). 
            Ibarat ujian berjilid — jawaban jilid 1 tidak boleh mengintip soal jilid 2.
          </p>
        </div>
      </div>
    </div>
  );
}
