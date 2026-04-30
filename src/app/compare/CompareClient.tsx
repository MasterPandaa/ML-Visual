'use client';

import { useModelStore } from '@/lib/store';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { GitCompare, X, Plus, ArrowRight, CheckCircle2 } from 'lucide-react';
import { KATEGORI_CONFIG, getKompleksitasEmoji, getKompleksitasColor, MLModel } from '@/types/model';
import { motion, AnimatePresence } from 'framer-motion';

export default function CompareClient({ allModels }: { allModels: MLModel[] }) {
  const { compareModels, removeCompareModel, clearCompare, addCompareModel } = useModelStore();
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');


  
  const selectedModels = useMemo(() => 
    compareModels.map(slug => allModels.find(m => m.slug === slug)).filter(Boolean) as MLModel[],
    [compareModels, allModels]
  );

  const availableModels = useMemo(() => 
    allModels.filter(m => !compareModels.includes(m.slug) && 
      (m.nama_model.toLowerCase().includes(searchQuery.toLowerCase()) || 
       m.kategori.toLowerCase().includes(searchQuery.toLowerCase()))
    ).slice(0, 10),
    [allModels, compareModels, searchQuery]
  );

  if (selectedModels.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <div className="w-20 h-20 mx-auto bg-indigo-500/10 rounded-full flex items-center justify-center mb-6">
          <GitCompare className="w-10 h-10 text-indigo-400" />
        </div>
        <h1 className="text-3xl font-bold text-white mb-4">Perbandingan Model</h1>
        <p className="text-[var(--text-secondary)] mb-8 max-w-lg mx-auto">
          Pilih 2 hingga 3 model dari katalog untuk membandingkan karakteristik, kelebihan, dan kekurangannya secara langsung.
        </p>
        <Link href="/models">
          <button className="btn-primary">Telusuri Katalog Model</button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <GitCompare className="w-8 h-8 text-indigo-400" />
            <span className="gradient-text">Perbandingan</span> Model
          </h1>
          <p className="text-[var(--text-secondary)]">
            Membandingkan {selectedModels.length} model machine learning
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={() => clearCompare()}
            className="text-xs text-[var(--text-muted)] hover:text-rose-400 transition-colors"
          >
            Bersihkan Semua
          </button>
          {selectedModels.length < 3 && (
            <div className="relative">
              <button 
                onClick={() => setShowAddMenu(!showAddMenu)}
                className="btn-secondary text-sm py-2 px-4 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" /> Tambah Model
              </button>
              
              {showAddMenu && (
                <div className="absolute right-0 top-full mt-2 w-64 glass-card p-3 z-50">
                  <input
                    type="text"
                    placeholder="Cari model..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg px-3 py-2 text-sm text-white mb-2 focus:outline-none focus:border-indigo-500"
                  />
                  <div className="max-h-60 overflow-y-auto space-y-1 pr-1">
                    {availableModels.length > 0 ? availableModels.map(m => (
                      <button
                        key={m.slug}
                        onClick={() => {
                          addCompareModel(m.slug);
                          setShowAddMenu(false);
                          setSearchQuery('');
                        }}
                        className="w-full text-left px-3 py-2 rounded-lg hover:bg-indigo-500/10 transition-colors flex flex-col"
                      >
                        <span className="text-sm font-medium text-white">{m.nama_model}</span>
                        <span className="text-[10px] text-[var(--text-muted)]">{m.kategori}</span>
                      </button>
                    )) : (
                      <div className="text-center text-xs text-[var(--text-muted)] py-4">
                        Tidak ada model ditemukan
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="overflow-x-auto pb-6 custom-scrollbar">
        <div className="flex justify-center gap-6 min-w-full">
          <AnimatePresence>
            {selectedModels.map((model, idx) => {
              const config = KATEGORI_CONFIG[model.kategori];
              return (
                <motion.div
                  key={model.slug}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                  className="w-80 glass-card flex flex-col relative"
                >
                  <button
                    onClick={() => removeCompareModel(model.slug)}
                    className="absolute top-4 right-4 w-6 h-6 bg-[var(--bg-secondary)] rounded-full flex items-center justify-center text-[var(--text-muted)] hover:text-rose-400 hover:bg-rose-500/10 transition-colors z-10"
                  >
                    <X className="w-3 h-3" />
                  </button>

                  <div className="p-6 border-b border-[var(--border-color)]">
                    <div 
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-4"
                      style={{ backgroundColor: `${config.color}20`, border: `1px solid ${config.color}40` }}
                    >
                      {config.icon}
                    </div>
                    <h2 className="text-xl font-bold text-white mb-2">{model.nama_model}</h2>
                    <span 
                      className="text-[10px] font-semibold px-2 py-1 rounded-md border"
                      style={{ color: config.color, borderColor: `${config.color}40`, backgroundColor: `${config.color}10` }}
                    >
                      {model.kategori}
                    </span>
                  </div>

                  <div className="p-6 flex-1 flex flex-col gap-6">
                    <div>
                      <h3 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">
                        Deskripsi
                      </h3>
                      <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                        {model.deskripsi_singkat}
                      </p>
                    </div>

                    <div>
                      <h3 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">
                        Kompleksitas
                      </h3>
                      <div className="inline-flex items-center gap-1 text-sm font-medium px-3 py-1.5 rounded-lg"
                        style={{ backgroundColor: `${getKompleksitasColor(model.kompleksitas)}15`, color: getKompleksitasColor(model.kompleksitas) }}>
                        {getKompleksitasEmoji(model.kompleksitas)} {model.kompleksitas}
                      </div>
                    </div>

                    <div className="mt-auto pt-4 border-t border-[var(--border-color)]">
                      <Link href={`/models/${model.slug}`}>
                        <button className="w-full py-2.5 rounded-lg bg-[var(--bg-secondary)] hover:bg-[var(--border-color)] text-sm font-medium transition-colors flex items-center justify-center gap-2">
                          Lihat Detail <ArrowRight className="w-4 h-4" />
                        </button>
                      </Link>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {/* Empty slot placeholder */}
          {selectedModels.length < 3 && (
            <motion.div 
              className="w-80 border-2 border-dashed border-[var(--border-color)] rounded-2xl flex flex-col items-center justify-center text-center p-6 opacity-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
            >
              <div className="w-16 h-16 rounded-full bg-[var(--bg-secondary)] flex items-center justify-center mb-4">
                <Plus className="w-8 h-8 text-[var(--text-muted)]" />
              </div>
              <h3 className="text-lg font-medium text-white mb-2">Tambah Model</h3>
              <p className="text-sm text-[var(--text-muted)]">
                Bandingkan hingga 3 model sekaligus
              </p>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
