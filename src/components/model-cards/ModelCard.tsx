'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, GitCompare } from 'lucide-react';
import { MLModel, KATEGORI_CONFIG, getKompleksitasEmoji, getKompleksitasColor } from '@/types/model';
import { useModelStore } from '@/lib/store';

interface ModelCardProps {
  model: MLModel;
  index: number;
}

export default function ModelCard({ model, index }: ModelCardProps) {
  const config = KATEGORI_CONFIG[model.kategori];
  const { addCompareModel, compareModels, removeCompareModel } = useModelStore();
  const isInCompare = compareModels.includes(model.slug);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.03, 0.5), duration: 0.4 }}
      layout
    >
      <div className="glass-card p-5 group cursor-pointer h-full flex flex-col relative overflow-hidden">
        {/* Gradient accent */}
        <div
          className="absolute top-0 left-0 right-0 h-1 opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ background: `linear-gradient(90deg, ${config.color}, ${config.color}88)` }}
        />

        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center text-base"
              style={{ backgroundColor: `${config.color}15`, border: `1px solid ${config.color}30` }}
            >
              {config.icon}
            </div>
            <div>
              <span
                className="text-[10px] font-semibold uppercase tracking-wider"
                style={{ color: config.color }}
              >
                {model.kategori}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <span
              className="text-xs font-medium px-2 py-0.5 rounded-md"
              style={{
                backgroundColor: `${getKompleksitasColor(model.kompleksitas)}15`,
                color: getKompleksitasColor(model.kompleksitas),
              }}
            >
              {getKompleksitasEmoji(model.kompleksitas)} {model.kompleksitas}
            </span>
          </div>
        </div>

        {/* Model name */}
        <Link href={`/models/${model.slug}`} className="flex-1">
          <h3 className="font-bold text-white mb-2 group-hover:text-indigo-300 transition-colors text-sm leading-tight">
            {model.nama_model}
          </h3>
          <p className="text-xs text-[var(--text-muted)] line-clamp-2 leading-relaxed mb-3">
            {model.deskripsi_singkat}
          </p>
        </Link>

        {/* Footer actions */}
        <div className="flex items-center justify-between pt-3 border-t border-[var(--border-color)]">
          <Link
            href={`/models/${model.slug}`}
            className="flex items-center gap-1 text-xs font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            Detail <ArrowRight className="w-3 h-3" />
          </Link>
          <button
            onClick={(e) => {
              e.preventDefault();
              isInCompare ? removeCompareModel(model.slug) : addCompareModel(model.slug);
            }}
            className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-md transition-all ${
              isInCompare
                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)]'
            }`}
            title={isInCompare ? 'Hapus dari perbandingan' : 'Tambah ke perbandingan'}
          >
            <GitCompare className="w-3 h-3" />
            {isInCompare ? 'Added' : 'Compare'}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
