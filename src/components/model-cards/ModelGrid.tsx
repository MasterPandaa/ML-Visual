'use client';

import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useModelStore } from '@/lib/store';
import { MLModel, Kategori } from '@/types/model';
import ModelCard from './ModelCard';
import FilterBar from './FilterBar';
import { Frown } from 'lucide-react';

interface ModelGridProps {
  initialModels: MLModel[];
  initialKategori?: string;
}

export default function ModelGrid({ initialModels, initialKategori }: ModelGridProps) {
  const { setModels, getFilteredModels, setSelectedKategori } = useModelStore();

  useEffect(() => {
    setModels(initialModels);
  }, [initialModels, setModels]);

  useEffect(() => {
    if (initialKategori) {
      setSelectedKategori([initialKategori as Kategori]);
    } else {
      setSelectedKategori([]);
    }
  }, [initialKategori, setSelectedKategori]);

  const filtered = getFilteredModels();

  return (
    <div className="space-y-6">
      <FilterBar />
      
      <div className="flex items-center justify-between">
        <p className="text-sm text-[var(--text-muted)]">
          Menampilkan <span className="text-white font-semibold">{filtered.length}</span> dari{' '}
          <span className="text-white">{initialModels.length}</span> model
        </p>
      </div>

      <AnimatePresence mode="wait">
        {filtered.length > 0 ? (
          <motion.div
            key="grid"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
          >
            {filtered.map((model, i) => (
              <ModelCard key={model.id} model={model} index={i} />
            ))}
          </motion.div>
        ) : (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <Frown className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">Tidak ada model ditemukan</h3>
            <p className="text-sm text-[var(--text-muted)]">
              Coba ubah filter atau kata kunci pencarian
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
