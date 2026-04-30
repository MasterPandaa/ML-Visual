'use client';

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { Play, Pause, RotateCcw, SkipForward, Gauge } from 'lucide-react';

interface SimulationControlsProps {
  onPlay: () => void;
  onPause: () => void;
  onReset: () => void;
  onStep: () => void;
  isPlaying: boolean;
  speed: number;
  onSpeedChange: (s: number) => void;
  iteration?: number;
  maxIteration?: number;
  extraInfo?: string;
}

export default function SimulationControls({
  onPlay, onPause, onReset, onStep,
  isPlaying, speed, onSpeedChange,
  iteration, maxIteration, extraInfo,
}: SimulationControlsProps) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      switch (e.key) {
        case ' ':
          e.preventDefault();
          isPlaying ? onPause() : onPlay();
          break;
        case 'ArrowRight':
          e.preventDefault();
          onStep();
          break;
        case 'r':
        case 'R':
          e.preventDefault();
          onReset();
          break;
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isPlaying, onPlay, onPause, onStep, onReset]);

  return (
    <div className="flex flex-wrap items-center gap-3 p-3 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)]/80 backdrop-blur-sm">
      {/* Play/Pause */}
      <button
        onClick={isPlaying ? onPause : onPlay}
        className={`control-btn ${isPlaying ? 'active' : ''}`}
        title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
      >
        {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
      </button>

      {/* Step */}
      <button
        onClick={onStep}
        className="control-btn"
        disabled={isPlaying}
        title="Next Step (→)"
      >
        <SkipForward className="w-4 h-4" />
      </button>

      {/* Reset */}
      <button
        onClick={onReset}
        className="control-btn"
        title="Reset (R)"
      >
        <RotateCcw className="w-4 h-4" />
      </button>

      {/* Divider */}
      <div className="w-px h-6 bg-[var(--border-color)]" />

      {/* Speed */}
      <div className="flex items-center gap-2">
        <Gauge className="w-4 h-4 text-[var(--text-muted)]" />
        <input
          type="range"
          min={0.25}
          max={2}
          step={0.25}
          value={speed}
          onChange={(e) => onSpeedChange(parseFloat(e.target.value))}
          className="w-20"
        />
        <span className="text-xs text-[var(--text-muted)] font-mono w-10">{speed}x</span>
      </div>

      {/* Iteration info */}
      {iteration !== undefined && (
        <>
          <div className="w-px h-6 bg-[var(--border-color)]" />
          <span className="text-xs text-[var(--text-muted)]">
            Step: <span className="text-white font-semibold">{iteration}</span>
            {maxIteration !== undefined && <span>/{maxIteration}</span>}
          </span>
        </>
      )}

      {extraInfo && (
        <>
          <div className="w-px h-6 bg-[var(--border-color)]" />
          <span className="text-xs text-indigo-300">{extraInfo}</span>
        </>
      )}
    </div>
  );
}

// Hook for simulation loop
export function useSimulationLoop(
  stepFn: () => boolean, // returns true if should continue
  speed: number,
  isPlaying: boolean,
) {
  const frameRef = useRef<number | undefined>(undefined);
  const lastTimeRef = useRef<number>(0);
  const intervalMs = useMemo(() => 1000 / speed, [speed]);

  const animate = useCallback((time: number) => {
    if (time - lastTimeRef.current >= intervalMs) {
      lastTimeRef.current = time;
      const shouldContinue = stepFn();
      if (!shouldContinue) return;
    }
    frameRef.current = requestAnimationFrame(animate);
  }, [stepFn, intervalMs]);

  useEffect(() => {
    if (isPlaying) {
      frameRef.current = requestAnimationFrame(animate);
    } else if (frameRef.current) {
      cancelAnimationFrame(frameRef.current);
    }
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [isPlaying, animate]);
}
