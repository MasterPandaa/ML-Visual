'use client';

import { useState, useMemo, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { initNetwork, forwardPass, LayerState, ForwardPassState } from '@/lib/algorithms/neuralNetworkForward';
import SimulationControls, { useSimulationLoop } from '../SimulationControls';
import { Shuffle } from 'lucide-react';

const W = 650, H = 400;

const LAYER_COLORS = ['#818cf8', '#c084fc', '#fb7185', '#34d399', '#fbbf24'];

export default function NeuralNetworkViz() {
  const [hiddenLayers, setHiddenLayers] = useState([4, 3]);
  const [activation, setActivation] = useState<'sigmoid'|'relu'|'tanh'>('sigmoid');
  const [input, setInput] = useState([0.5, 0.8]);
  const [network, setNetwork] = useState<LayerState[]>(() =>
    initNetwork({ inputSize: 2, hiddenSizes: [4, 3], outputSize: 1, activation: 'sigmoid' })
  );
  const [forwardState, setForwardState] = useState<ForwardPassState | null>(null);
  const [activeLayer, setActiveLayer] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const stepRef = useRef(0);

  const allSizes = useMemo(() => [input.length, ...hiddenLayers, 1], [input.length, hiddenLayers]);
  const maxNeurons = Math.max(...allSizes);

  const resetNetwork = useCallback(() => {
    const net = initNetwork({ inputSize: 2, hiddenSizes: hiddenLayers, outputSize: 1, activation });
    setNetwork(net);
    setForwardState(null);
    setActiveLayer(-1);
    stepRef.current = 0;
    setIsPlaying(false);
  }, [hiddenLayers, activation]);

  const runForward = useCallback(() => {
    const result = forwardPass(input, network, activation);
    setForwardState(result);
    setActiveLayer(result.layers.length - 1);
  }, [input, network, activation]);

  const stepForward = useCallback((): boolean => {
    if (stepRef.current >= network.length) {
      setIsPlaying(false);
      return false;
    }
    const partialLayers = network.slice(0, stepRef.current + 1);
    const result = forwardPass(input, partialLayers, activation);
    setForwardState(result);
    setActiveLayer(stepRef.current);
    stepRef.current++;
    return stepRef.current < network.length;
  }, [input, network, activation]);

  useSimulationLoop(stepForward, speed * 0.3, isPlaying);

  // Positioning
  const layerX = (li: number) => 80 + (li / (allSizes.length - 1)) * (W - 160);
  const neuronY = (li: number, ni: number) => {
    const count = allSizes[li];
    const spacing = Math.min(50, (H - 80) / (count + 1));
    const startY = (H - (count - 1) * spacing) / 2;
    return startY + ni * spacing;
  };

  const getNeuronValue = (layerIdx: number, neuronIdx: number): number | null => {
    if (layerIdx === 0) return input[neuronIdx] ?? null;
    if (!forwardState || layerIdx - 1 >= forwardState.layers.length) return null;
    return forwardState.layers[layerIdx - 1]?.activations[neuronIdx] ?? null;
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <button onClick={resetNetwork} className="btn-secondary flex items-center gap-2 text-xs py-2 px-3">
          <Shuffle className="w-3 h-3" /> New Weights
        </button>
        <button onClick={runForward} className="btn-primary text-xs py-2 px-3">
          Full Forward Pass
        </button>
        <select value={activation} onChange={e => { setActivation(e.target.value as 'sigmoid'|'relu'|'tanh'); resetNetwork(); }}
          className="px-3 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] text-[var(--text-primary)] text-xs">
          <option value="sigmoid">Sigmoid</option>
          <option value="relu">ReLU</option>
          <option value="tanh">Tanh</option>
        </select>
        <div className="flex items-center gap-2">
          <span className="text-xs text-[var(--text-muted)]">Input:</span>
          {input.map((v, i) => (
            <input key={i} type="range" min={0} max={1} step={0.1} value={v}
              onChange={e => { const n = [...input]; n[i] = parseFloat(e.target.value); setInput(n); }}
              className="w-16" />
          ))}
        </div>
      </div>

      <div className="viz-container p-4">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" style={{ maxHeight: 420 }}>
          {/* Connections */}
          {allSizes.map((_, li) => {
            if (li === 0) return null;
            return Array.from({ length: allSizes[li] }).map((_, ni) =>
              Array.from({ length: allSizes[li - 1] }).map((_, pi) => {
                const isActive = forwardState && li - 1 <= activeLayer;
                const weight = li <= network.length ? (network[li - 1]?.weights[ni]?.[pi] ?? 0) : 0;
                const opacity = isActive ? Math.min(Math.abs(weight) * 0.5 + 0.1, 0.8) : 0.08;
                const color = weight > 0 ? '#818cf8' : '#fb7185';
                return (
                  <motion.line key={`${li}-${ni}-${pi}`}
                    x1={layerX(li - 1)} y1={neuronY(li - 1, pi)}
                    x2={layerX(li)} y2={neuronY(li, ni)}
                    stroke={isActive ? color : '#2a2a5a'}
                    strokeWidth={isActive ? Math.abs(weight) * 1.5 + 0.5 : 0.5}
                    opacity={opacity}
                    animate={{ opacity }}
                    transition={{ duration: 0.3 }}
                  />
                );
              })
            );
          })}

          {/* Neurons */}
          {allSizes.map((count, li) =>
            Array.from({ length: count }).map((_, ni) => {
              const val = getNeuronValue(li, ni);
              const isActive = li === 0 || (forwardState && li - 1 <= activeLayer);
              const intensity = val !== null ? Math.abs(val) : 0;
              const color = LAYER_COLORS[li % LAYER_COLORS.length];
              return (
                <g key={`n-${li}-${ni}`}>
                  {isActive && (
                    <motion.circle cx={layerX(li)} cy={neuronY(li, ni)} r={18}
                      fill={`${color}20`}
                      animate={{ r: [18, 22, 18], opacity: [0.3, 0.5, 0.3] }}
                      transition={{ duration: 2, repeat: Infinity }} />
                  )}
                  <motion.circle cx={layerX(li)} cy={neuronY(li, ni)} r={14}
                    fill={isActive ? color : '#1e1e4a'}
                    stroke={isActive ? 'white' : '#2a2a5a'}
                    strokeWidth={1.5}
                    opacity={isActive ? 0.6 + intensity * 0.4 : 0.3}
                    animate={{ opacity: isActive ? 0.6 + intensity * 0.4 : 0.3 }}
                    transition={{ duration: 0.5 }} />
                  {val !== null && isActive && (
                    <text x={layerX(li)} y={neuronY(li, ni) + 4}
                      fill="white" fontSize="8" textAnchor="middle" fontFamily="monospace" fontWeight="bold">
                      {val.toFixed(2)}
                    </text>
                  )}
                </g>
              );
            })
          )}

          {/* Layer labels */}
          {allSizes.map((_, li) => {
            const label = li === 0 ? 'Input' : li === allSizes.length - 1 ? 'Output' : `Hidden ${li}`;
            return (
              <text key={`label-${li}`} x={layerX(li)} y={H - 10}
                fill="var(--text-muted)" fontSize="10" textAnchor="middle" fontFamily="Inter">{label}</text>
            );
          })}
        </svg>
      </div>

      <SimulationControls
        onPlay={() => { stepRef.current = 0; setIsPlaying(true); }}
        onPause={() => setIsPlaying(false)}
        onReset={resetNetwork}
        onStep={stepForward}
        isPlaying={isPlaying}
        speed={speed}
        onSpeedChange={setSpeed}
        iteration={activeLayer + 1}
        maxIteration={network.length}
        extraInfo={forwardState ? `Output: ${forwardState.output[0]?.toFixed(4)}` : undefined}
      />

      <div className="grid grid-cols-3 gap-3">
        <div className="glass-card p-3 text-center">
          <div className="text-xs text-[var(--text-muted)] mb-1">Layers</div>
          <div className="text-sm font-mono font-semibold text-white">{allSizes.length}</div>
        </div>
        <div className="glass-card p-3 text-center">
          <div className="text-xs text-[var(--text-muted)] mb-1">Activation</div>
          <div className="text-sm font-mono font-semibold text-indigo-300">{activation}</div>
        </div>
        <div className="glass-card p-3 text-center">
          <div className="text-xs text-[var(--text-muted)] mb-1">Output</div>
          <div className="text-sm font-mono font-semibold text-amber-400">
            {forwardState ? forwardState.output[0]?.toFixed(4) : '—'}
          </div>
        </div>
      </div>
    </div>
  );
}
