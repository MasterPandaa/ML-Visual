'use client';

import { Search, SlidersHorizontal, X, ArrowUpDown } from 'lucide-react';
import { KATEGORI_CONFIG, Kategori, Kompleksitas, getKompleksitasEmoji } from '@/types/model';
import { useModelStore } from '@/lib/store';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

const KOMPLEKSITAS_LIST: Kompleksitas[] = ['Low', 'Medium', 'High'];

export default function FilterBar() {
  const {
    searchQuery, setSearchQuery,
    selectedKategori, toggleKategori,
    selectedKompleksitas, toggleKompleksitas,
    sortBy, setSortBy,
    setSelectedKategori, setSelectedKompleksitas,
  } = useModelStore();

  const [showFilters, setShowFilters] = useState(false);
  const hasFilters = selectedKategori.length > 0 || selectedKompleksitas.length > 0;

  return (
    <div className="space-y-4">
      {/* Search and controls */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
          <input
            type="text"
            placeholder="Cari model ML..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] text-[var(--text-primary)] text-sm placeholder:text-[var(--text-muted)] focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Sort */}
        <div className="relative">
          <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] pointer-events-none" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'name' | 'complexity' | 'category')}
            className="pl-10 pr-8 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] text-[var(--text-primary)] text-sm appearance-none cursor-pointer focus:outline-none focus:border-indigo-500"
          >
            <option value="name">Nama (A-Z)</option>
            <option value="complexity">Kompleksitas</option>
            <option value="category">Kategori</option>
          </select>
        </div>

        {/* Filter toggle */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-colors ${
            showFilters || hasFilters
              ? 'border-indigo-500/50 bg-indigo-500/10 text-indigo-300'
              : 'border-[var(--border-color)] bg-[var(--bg-card)] text-[var(--text-secondary)] hover:border-indigo-500/30'
          }`}
        >
          <SlidersHorizontal className="w-4 h-4" />
          Filter
          {hasFilters && (
            <span className="w-5 h-5 rounded-full bg-indigo-500 text-white text-xs flex items-center justify-center">
              {selectedKategori.length + selectedKompleksitas.length}
            </span>
          )}
        </button>
      </div>

      {/* Expanded filters */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="glass-card p-5 space-y-4">
              {/* Kategori */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                    Kategori
                  </h4>
                  {selectedKategori.length > 0 && (
                    <button
                      onClick={() => setSelectedKategori([])}
                      className="text-xs text-indigo-400 hover:text-indigo-300"
                    >
                      Reset
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {(Object.keys(KATEGORI_CONFIG) as Kategori[]).map((kat) => (
                    <button
                      key={kat}
                      onClick={() => toggleKategori(kat)}
                      className={`chip ${selectedKategori.includes(kat) ? 'active' : ''}`}
                    >
                      <span>{KATEGORI_CONFIG[kat].icon}</span>
                      <span>{kat}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Kompleksitas */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                    Kompleksitas
                  </h4>
                  {selectedKompleksitas.length > 0 && (
                    <button
                      onClick={() => setSelectedKompleksitas([])}
                      className="text-xs text-indigo-400 hover:text-indigo-300"
                    >
                      Reset
                    </button>
                  )}
                </div>
                <div className="flex gap-2">
                  {KOMPLEKSITAS_LIST.map((k) => (
                    <button
                      key={k}
                      onClick={() => toggleKompleksitas(k)}
                      className={`chip ${selectedKompleksitas.includes(k) ? 'active' : ''}`}
                    >
                      {getKompleksitasEmoji(k)} {k}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
