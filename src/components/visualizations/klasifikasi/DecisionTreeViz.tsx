'use client';

import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { generateClassificationData, relabelPoints, LabeledPoint2D } from '@/lib/datasets';
import { buildTree, TreeNode } from '@/lib/algorithms/decisionTree';
import SimulationControls, { useSimulationLoop } from '../SimulationControls';
import { Shuffle, ZoomIn, ZoomOut, Maximize } from 'lucide-react';

const W = 800, H = 500, P = 40;
const CLASS_COLORS = ['#818cf8', '#fb7185', '#34d399', '#fbbf24'];

export default function DecisionTreeViz() {
  const [maxDepth, setMaxDepth] = useState(3);
  const [data, setData] = useState<LabeledPoint2D[]>(() => generateClassificationData(100, 'xor'));
  const [tree, setTree] = useState<TreeNode | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [visibleCount, setVisibleCount] = useState(0);
  const visibleCountRef = useRef(0);
  
  // Pan and Zoom states
  const [zoomScale, setZoomScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  
  const dataType = useRef<'xor' | 'linear' | 'circle'>('xor');

  const randomize = useCallback(() => {
    setData(generateClassificationData(100, dataType.current));
  }, []);

  const changeType = useCallback((newType: 'xor' | 'linear' | 'circle') => {
    dataType.current = newType;
    setData(prev => relabelPoints(prev, newType));
  }, []);

  const initTree = useCallback(() => {
    const newTree = buildTree(data, maxDepth, 2);
    setTree(newTree);
    setVisibleCount(1); // Root visible
    visibleCountRef.current = 1;
    setIsPlaying(false);
  }, [data, maxDepth]);
  useEffect(() => {
    initTree();
  }, [initTree]);

  // Give each node a unique ID sequentially (BFS style) for animation
  const { nodesBFS, dynamicW, dynamicH } = useMemo(() => {
    if (!tree) return { nodesBFS: [], dynamicW: 800, dynamicH: 500 };
    const result: any[] = [];
    let idCounter = 0;
    
    const getActualMaxDepth = (n: TreeNode): number => {
      if (!n.left && !n.right) return 0;
      return 1 + Math.max(getActualMaxDepth(n.left!), getActualMaxDepth(n.right!));
    };
    const actualDepth = Math.max(1, getActualMaxDepth(tree));
    const dH = Math.max(500, (actualDepth + 1) * 80);

    // Inorder traversal to assign X coordinates based on leaf order
    let currentLeafX = 50;
    const nodeXMap = new Map<TreeNode, number>();

    const assignX = (n: TreeNode) => {
      if (!n.left && !n.right) {
        nodeXMap.set(n, currentLeafX);
        currentLeafX += 110; // Spacing between leaves
      } else {
        if (n.left) assignX(n.left);
        if (n.right) assignX(n.right);
        
        const leftX = n.left ? nodeXMap.get(n.left)! : currentLeafX;
        const rightX = n.right ? nodeXMap.get(n.right)! : currentLeafX;
        nodeXMap.set(n, (leftX + rightX) / 2);
      }
    };
    assignX(tree);

    const dW = Math.max(800, currentLeafX + 50);

    // Calculate positions (Pre-order to populate result array)
    const calcPos = (n: TreeNode, depth: number, pId: number | null) => {
      const id = idCounter++;
      const x = nodeXMap.get(n)!;
      const y = 50 + depth * 80;
      
      const nodeData = { node: n, id, depth, x, y, parentId: pId };
      result.push(nodeData);

      if (n.left) calcPos(n.left, depth + 1, id);
      if (n.right) calcPos(n.right, depth + 1, id);
    };

    calcPos(tree, 0, null);
    
    // Sort by ID to ensure parent is added before children, which pre-order naturally does
    return { nodesBFS: result, dynamicW: dW, dynamicH: dH };
  }, [tree]);

  const stepAnim = useCallback(() => {
    if (!tree || nodesBFS.length === 0) return false;
    
    if (visibleCountRef.current >= nodesBFS.length) {
      setIsPlaying(false);
      return false;
    }
    
    const nextCount = visibleCountRef.current + 1;
    visibleCountRef.current = nextCount;
    setVisibleCount(nextCount);
    
    return nextCount < nodesBFS.length;
  }, [tree, nodesBFS.length]);

  useSimulationLoop(stepAnim, speed, isPlaying);

  const visibleNodes = useMemo(() => {
    return new Set(nodesBFS.slice(0, visibleCount).map(n => n.id));
  }, [nodesBFS, visibleCount]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <button onClick={randomize} className="btn-secondary flex items-center gap-2 text-xs py-2 px-3">
          <Shuffle className="w-3 h-3" /> Randomize Data
        </button>
        <select 
          value={dataType.current} 
          onChange={e => { changeType(e.target.value as any); }}
          className="px-3 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] text-xs text-white"
        >
          <option value="xor">Pola Menyilang (XOR)</option>
          <option value="circle">Pola Melingkar (Circle)</option>
          <option value="linear">Pola Linear</option>
        </select>
        
        <div className="flex items-center gap-2">
          <span className="text-xs text-[var(--text-muted)]">Max Depth =</span>
          <input type="range" min={1} max={10} value={maxDepth} onChange={e => setMaxDepth(parseInt(e.target.value))} className="w-48" />
          <span className="text-sm font-mono text-white font-semibold w-4">{maxDepth}</span>
        </div>
      </div>

      <div className="viz-container relative overflow-hidden custom-scrollbar bg-[#0f111a]"
           onMouseDown={(e) => {
             setIsDragging(true);
             dragStart.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
           }}
           onMouseMove={(e) => {
             if (!isDragging) return;
             setPan({ x: e.clientX - dragStart.current.x, y: e.clientY - dragStart.current.y });
           }}
           onMouseUp={() => setIsDragging(false)}
           onMouseLeave={() => setIsDragging(false)}
           style={{ cursor: isDragging ? 'grabbing' : 'grab' }}>
        
        {/* Zoom Controls */}
        <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
          <button onClick={() => setZoomScale(s => Math.min(s + 0.2, 3))} className="p-2 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg hover:bg-white/10 text-white" title="Zoom In">
            <ZoomIn className="w-4 h-4" />
          </button>
          <button onClick={() => setZoomScale(s => Math.max(s - 0.2, 0.2))} className="p-2 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg hover:bg-white/10 text-white" title="Zoom Out">
            <ZoomOut className="w-4 h-4" />
          </button>
          <button onClick={() => { setZoomScale(1); setPan({x:0, y:0}); }} className="p-2 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg hover:bg-white/10 text-white" title="Reset View">
            <Maximize className="w-4 h-4" />
          </button>
        </div>

        <div style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoomScale})`, transformOrigin: 'top left', transition: isDragging ? 'none' : 'transform 0.2s ease-out' }} className="w-full h-full min-h-[500px]">
          <svg viewBox={`0 0 ${dynamicW} ${dynamicH}`} className="w-full h-auto min-w-[600px]">
            {/* Background grid */}
            <rect x="0" y="0" width={dynamicW} height={dynamicH} fill="transparent" />
          
          <motion.g 
            initial={false}
            animate={{ 
              scale: Math.max(0.6, 1 - (maxDepth - 3) * 0.05),
              transformOrigin: '50% 10%'
            }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            {/* Edges */}
          <AnimatePresence>
            {nodesBFS.map((n) => {
              if (n.parentId === null || !visibleNodes.has(n.id)) return null;
              const parent = nodesBFS.find(p => p.id === n.parentId);
              if (!parent) return null;
              
              const isLeft = n.x < parent.x;
              
              return (
                <motion.line
                  key={`edge-${n.id}`}
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  x1={parent.x} y1={parent.y + 20}
                  x2={n.x} y2={n.y - 20}
                  stroke={isLeft ? '#10b981' : '#ef4444'} // Green for True, Red for False
                  strokeWidth="2"
                  strokeDasharray={isLeft ? 'none' : '4,4'}
                />
              );
            })}
          </AnimatePresence>

          {/* Nodes */}
          <AnimatePresence>
            {nodesBFS.map((n) => {
              if (!visibleNodes.has(n.id)) return null;
              
              const isLeaf = n.node.featureIndex === undefined;
              const majorityClass = n.node.predictedLabel ?? 0;
              const bgColor = isLeaf ? CLASS_COLORS[majorityClass] : '#1e1e2f';
              
              return (
                <motion.g 
                  key={`node-${n.id}`}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 260, damping: 20 }}
                >
                  <rect 
                    x={n.x - 45} y={n.y - 25} 
                    width="90" height="50" 
                    rx="8" 
                    fill={bgColor} 
                    stroke={isLeaf ? '#ffffff' : '#6366f1'} 
                    strokeWidth="2"
                  />
                  {isLeaf ? (
                    <>
                      <text x={n.x} y={n.y} fill="#fff" fontSize="11" fontWeight="bold" textAnchor="middle" dominantBaseline="middle">
                        Class {majorityClass}
                      </text>
                      <text x={n.x} y={n.y + 14} fill="rgba(255,255,255,0.7)" fontSize="9" textAnchor="middle">
                        N: {n.node.samples}
                      </text>
                    </>
                  ) : (
                    <>
                      <text x={n.x} y={n.y - 6} fill="#fff" fontSize="10" fontWeight="bold" textAnchor="middle">
                        {n.node.featureIndex === 0 ? 'X' : 'Y'} {'<='} {n.node.threshold?.toFixed(2)}
                      </text>
                      <text x={n.x} y={n.y + 8} fill="#a78bfa" fontSize="9" textAnchor="middle">
                        Gini: {n.node.gini?.toFixed(3)}
                      </text>
                      <text x={n.x} y={n.y + 18} fill="rgba(255,255,255,0.5)" fontSize="8" textAnchor="middle">
                        N: {n.node.samples}
                      </text>
                    </>
                  )}
                </motion.g>
              );
            })}
          </AnimatePresence>
        </motion.g>
      </svg>
      </div>
      </div>

      {tree && (
        <SimulationControls 
          onPlay={() => setIsPlaying(true)} 
          onPause={() => setIsPlaying(false)} 
          onReset={() => { setVisibleCount(1); visibleCountRef.current = 1; setIsPlaying(false); }} 
          onStep={() => stepAnim()} 
          isPlaying={isPlaying} 
          speed={speed} 
          onSpeedChange={setSpeed} 
          iteration={visibleCount} 
          maxIteration={nodesBFS.length}
          extraInfo={visibleCount === nodesBFS.length ? "Pohon Selesai Dibangun" : "Sedang membangun..."}
        />
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        <div className="glass-card p-4 border-l-4 border-indigo-500">
          <h4 className="text-sm font-bold text-indigo-300 mb-2">🌳 Struktur Pohon Keputusan</h4>
          <p className="text-xs text-[var(--text-muted)] leading-relaxed">
            Ibarat bermain tebak-tebakan. Pohon ini membagi data berdasarkan pertanyaan (X/Y {'<='} Nilai). Jika Ya (True), ke kiri (Hijau). Jika Tidak (False), ke kanan (Merah Putus-putus).
          </p>
        </div>
        <div className="glass-card p-4 border-l-4 border-purple-500">
          <h4 className="text-sm font-bold text-purple-300 mb-2">📉 Gini Impurity (Kemurnian)</h4>
          <p className="text-xs text-[var(--text-muted)] leading-relaxed">
            Skor seberapa "campur aduk" data di kotak tersebut. Gini 0 berarti kotak tersebut sangat murni (hanya berisi satu warna). Pohon akan terus bertanya sampai data semurni mungkin.
          </p>
        </div>
        <div className="glass-card p-4 border-l-4 border-amber-500">
          <h4 className="text-sm font-bold text-amber-300 mb-2">📐 Memahami Bentuk Data</h4>
          <div className="space-y-3 text-xs text-[var(--text-muted)] leading-relaxed">
            <p>
              <b className="text-amber-200">1. Terpisah Rapi (Lurus)</b><br/>
              <b>Pohon Pendek:</b> Paling mudah, ibarat menebak buah yang sudah dipisah kiri-kanan. Cukup sekali tanya, pohon tetap pendek.
            </p>
            <p>
              <b className="text-amber-200">2. Selang-seling (XOR)</b><br/>
              <b>Pohon Rimbun:</b> Seperti papan catur yang campur aduk. Pohon harus tanya berkali-kali agar tidak salah tebak, sehingga cabangnya lebih banyak.
            </p>
            <p>
              <b className="text-amber-200">3. Mengepung (Melingkar)</b><br/>
              <b>Pohon Sangat Rimbun:</b> Paling sulit karena satu warna dikepung warna lain. Pohon harus buat banyak cabang kecil untuk mengurung warna di tengah.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
