'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, Star } from 'lucide-react';
import { MLModel, KATEGORI_CONFIG, getKompleksitasEmoji } from '@/types/model';

interface FeaturedModelsProps {
  models: MLModel[];
}

export default function FeaturedModels({ models }: FeaturedModelsProps) {
  return (
    <section className="py-20 relative">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center gap-2 mb-4">
            <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
            <span className="text-sm font-medium text-amber-400 uppercase tracking-wider">Pilihan Editor</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Model <span className="gradient-text">Populer</span>
          </h2>
          <p className="text-[var(--text-secondary)] max-w-xl mx-auto">
            Mulai dari model-model paling populer dan penting dalam dunia ML
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {models.map((model, i) => {
            const config = KATEGORI_CONFIG[model.kategori];
            return (
              <motion.div
                key={model.slug}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
              >
                <Link href={`/models/${model.slug}`}>
                  <div className="glass-card p-5 group cursor-pointer h-full flex flex-col">
                    <div className="flex items-center gap-3 mb-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
                        style={{ backgroundColor: `${config.color}20` }}
                      >
                        {config.icon}
                      </div>
                      <span className="text-xs font-medium text-[var(--text-muted)]">
                        {getKompleksitasEmoji(model.kompleksitas)} {model.kompleksitas}
                      </span>
                    </div>
                    <h3 className="font-bold text-white mb-2 group-hover:text-indigo-300 transition-colors">
                      {model.nama_model}
                    </h3>
                    <p className="text-xs text-[var(--text-muted)] flex-1 line-clamp-3 leading-relaxed">
                      {model.deskripsi_singkat}
                    </p>
                    <div className="flex items-center gap-1 text-xs font-medium text-indigo-400 mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      Pelajari <ArrowRight className="w-3 h-3" />
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
