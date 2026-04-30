'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { KategoriInfo } from '@/types/model';

interface KategoriGridProps {
  kategoriList: KategoriInfo[];
}

export default function KategoriGrid({ kategoriList }: KategoriGridProps) {
  return (
    <section className="py-20 relative">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Jelajahi <span className="gradient-text">Kategori</span>
          </h2>
          <p className="text-[var(--text-secondary)] max-w-xl mx-auto">
            Pilih kategori machine learning yang ingin kamu pelajari
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {kategoriList.map((kat, i) => (
            <motion.div
              key={kat.nama}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05, duration: 0.4 }}
            >
              <Link href={`/models?kategori=${encodeURIComponent(kat.nama)}`}>
                <div className="glass-card p-6 group cursor-pointer h-full">
                  <div className="flex items-start justify-between mb-4">
                    <div className="text-3xl">{kat.icon}</div>
                    <span className="text-xs font-semibold px-3 py-1 rounded-full border border-[var(--border-color)] text-[var(--text-muted)]">
                      {kat.count} model
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2 group-hover:text-indigo-300 transition-colors">
                    {kat.nama}
                  </h3>
                  <p className="text-sm text-[var(--text-muted)] mb-4 leading-relaxed">
                    {kat.description}
                  </p>
                  <div className="flex items-center gap-1 text-xs font-medium text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity">
                    Lihat semua model <ArrowRight className="w-3 h-3" />
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
