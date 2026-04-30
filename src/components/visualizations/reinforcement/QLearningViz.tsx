'use client';

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { initGridWorld, qLearningStep, QTableState } from '@/lib/algorithms/qlearning';
import SimulationControls, { useSimulationLoop } from '../SimulationControls';

const CELL = 60;
const GRID_SIZE = 5;
const ARROWS = ['↑', '→', '↓', '←'];

export default function QLearningViz() {
  const [state, setState] = useState<QTableState>(() => initGridWorld(GRID_SIZE));
  const [epsilon, setEpsilon] = useState(0.3);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [showQValues, setShowQValues] = useState(true);

  const step = useCallback((): boolean => {
    setState(prev => qLearningStep(prev, GRID_SIZE, epsilon));
    return true;
  }, [epsilon]);

  const reset = useCallback(() => {
    setState(initGridWorld(GRID_SIZE));
    setIsPlaying(false);
  }, []);

  useSimulationLoop(step, speed * 2, isPlaying);

  const maxQ = Math.max(1, ...state.qTable.flat(2).map(Math.abs));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs text-[var(--text-muted)]">ε (exploration) =</span>
          <input type="range" min={0.05} max={1} step={0.05} value={epsilon}
            onChange={e => setEpsilon(parseFloat(e.target.value))} className="w-24" />
          <span className="text-xs font-mono text-white">{epsilon.toFixed(2)}</span>
        </div>
        <label className="flex items-center gap-2 text-xs text-[var(--text-muted)] cursor-pointer">
          <input type="checkbox" checked={showQValues} onChange={e => setShowQValues(e.target.checked)} className="accent-indigo-500" />
          Q-Values
        </label>
      </div>

      <div className="viz-container p-4 flex justify-center">
        <svg viewBox={`0 0 ${GRID_SIZE * CELL + 20} ${GRID_SIZE * CELL + 20}`} className="w-full h-auto" style={{ maxWidth: 400, maxHeight: 400 }}>
          {Array.from({ length: GRID_SIZE }).map((_, r) =>
            Array.from({ length: GRID_SIZE }).map((_, c) => {
              const x = c * CELL + 10;
              const y = r * CELL + 10;
              const isAgent = state.agentPos.row === r && state.agentPos.col === c;
              const isGoal = state.goalPos.row === r && state.goalPos.col === c;
              const isTrap = state.traps.some(t => t.row === r && t.col === c);
              const qValues = state.qTable[r][c];
              const bestQ = Math.max(...qValues);
              const bestAction = qValues.indexOf(bestQ);

              let bg = 'rgba(22,22,54,0.8)';
              if (isGoal) bg = 'rgba(16,185,129,0.2)';
              if (isTrap) bg = 'rgba(239,68,68,0.2)';
              if (isAgent) bg = 'rgba(99,102,241,0.25)';

              return (
                <g key={`${r}-${c}`}>
                  <rect x={x} y={y} width={CELL} height={CELL} fill={bg} stroke="var(--border-color)" strokeWidth={1} rx={4} />

                  {/* Q-value arrows */}
                  {showQValues && qValues.map((q, a) => {
                    const intensity = Math.abs(q) / maxQ;
                    const positions = [
                      { tx: x + CELL/2, ty: y + 10 },
                      { tx: x + CELL - 8, ty: y + CELL/2 + 3 },
                      { tx: x + CELL/2, ty: y + CELL - 5 },
                      { tx: x + 8, ty: y + CELL/2 + 3 },
                    ];
                    return (
                      <text key={a} x={positions[a].tx} y={positions[a].ty}
                        fill={q > 0 ? `rgba(16,185,129,${0.3 + intensity * 0.7})` : `rgba(239,68,68,${0.3 + intensity * 0.7})`}
                        fontSize="7" textAnchor="middle" fontFamily="monospace">
                        {q.toFixed(1)}
                      </text>
                    );
                  })}

                  {/* Best action arrow */}
                  {!isGoal && !isTrap && bestQ !== 0 && (
                    <text x={x + CELL/2} y={y + CELL/2 + 5} fill="rgba(168,85,247,0.6)" fontSize="16" textAnchor="middle" fontWeight="bold">
                      {ARROWS[bestAction]}
                    </text>
                  )}

                  {/* Entities */}
                  {isGoal && <text x={x + CELL/2} y={y + CELL/2 + 8} fontSize="20" textAnchor="middle">🏁</text>}
                  {isTrap && <text x={x + CELL/2} y={y + CELL/2 + 8} fontSize="20" textAnchor="middle">💣</text>}
                  {isAgent && (
                    <motion.text x={x + CELL/2} y={y + CELL/2 + 8} fontSize="20" textAnchor="middle"
                      animate={{ x: x + CELL/2, y: y + CELL/2 + 8 }} transition={{ type: 'spring', stiffness: 200 }}>
                      🤖
                    </motion.text>
                  )}
                </g>
              );
            })
          )}
        </svg>
      </div>

      <SimulationControls onPlay={() => setIsPlaying(true)} onPause={() => setIsPlaying(false)}
        onReset={reset} onStep={step} isPlaying={isPlaying} speed={speed} onSpeedChange={setSpeed}
        iteration={state.step} extraInfo={`Episode: ${state.episode} | Reward: ${state.totalReward.toFixed(1)}`} />

      <div className="grid grid-cols-3 gap-3">
        <div className="glass-card p-3 text-center">
          <div className="text-xs text-[var(--text-muted)] mb-1">Episode</div>
          <div className="text-sm font-mono font-semibold text-white">{state.episode}</div>
        </div>
        <div className="glass-card p-3 text-center">
          <div className="text-xs text-[var(--text-muted)] mb-1">Total Reward</div>
          <div className="text-sm font-mono font-semibold text-amber-400">{state.totalReward.toFixed(2)}</div>
        </div>
        <div className="glass-card p-3 text-center">
          <div className="text-xs text-[var(--text-muted)] mb-1">Epsilon</div>
          <div className="text-sm font-mono font-semibold text-purple-400">{epsilon.toFixed(2)}</div>
        </div>
      </div>
    </div>
  );
}
