'use client';

import { motion } from 'framer-motion';
import { Database, FolderTree, Brain, TrendingUp } from 'lucide-react';

interface StatsProps {
  totalModels: number;
  totalKategori: number;
}

export default function StatsSection({ totalModels, totalKategori }: StatsProps) {
  const stats = [
    { label: 'Total Model ML', value: `${totalModels}+`, icon: Database, color: 'from-blue-500 to-cyan-400' },
    { label: 'Kategori', value: totalKategori.toString(), icon: FolderTree, color: 'from-emerald-500 to-teal-400' },
    { label: 'Visualisasi Interaktif', value: '20+', icon: Brain, color: 'from-purple-500 to-pink-400' },
    { label: 'Algoritma Implementasi', value: '6+', icon: TrendingUp, color: 'from-orange-500 to-amber-400' },
  ];

  return (
    <section className="py-16 relative">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className="glass-card p-6 text-center group"
            >
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
              <div className="text-3xl font-bold text-white mb-1">{stat.value}</div>
              <div className="text-sm text-[var(--text-muted)]">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
