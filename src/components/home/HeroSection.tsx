'use client';

import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, Zap, Eye } from 'lucide-react';
import Link from 'next/link';

interface HeroProps {
  totalModels: number;
  totalKategori: number;
}

export default function HeroSection({ totalModels, totalKategori }: HeroProps) {
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden particle-bg pt-20">
      {/* Animated orbs */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div
          className="absolute w-[500px] h-[500px] rounded-full blur-[80px]"
          style={{
            background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)',
            top: '-10%',
            left: '-10%',
          }}
          animate={{ x: [0, 50, 0], y: [0, 30, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute w-[400px] h-[400px] rounded-full blur-[80px]"
          style={{
            background: 'radial-gradient(circle, rgba(236,72,153,0.12) 0%, transparent 70%)',
            bottom: '-10%',
            right: '-10%',
          }}
          animate={{ x: [0, -40, 0], y: [0, -30, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 grid-pattern opacity-30 pointer-events-none" />

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="flex justify-center mb-8">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-sm font-medium text-indigo-300 backdrop-blur-md"
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span className="tracking-wide text-white/90">Platform Pembelajaran Visual V2.0</span>
          </motion.div>
        </div>

        <motion.h1
          className="text-5xl sm:text-6xl md:text-7xl font-extrabold text-white mb-6 leading-[1.15] tracking-tight"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          Pahami <span className="gradient-text">Machine Learning</span><br className="hidden md:block" /> Tanpa Pusing
        </motion.h1>

        <motion.p
          className="text-lg sm:text-xl text-[var(--text-secondary)] mb-10 max-w-2xl mx-auto leading-relaxed"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          Eksplorasi {totalModels}+ algoritma dari {totalKategori} kategori secara interaktif. Dari Regresi Linear hingga Neural Network, lihat bagaimana model bekerja langkah demi langkah.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Link href="/models">
            <motion.button
              className="btn-primary flex items-center gap-2 text-lg px-8 py-3.5 w-full sm:w-auto"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              <Eye className="w-5 h-5" />
              Jelajahi Model
              <ArrowRight className="w-5 h-5" />
            </motion.button>
          </Link>
          <Link href="/playground">
            <motion.button
              className="btn-secondary flex items-center gap-2 text-lg px-8 py-3.5 w-full sm:w-auto bg-white/5 backdrop-blur-lg"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              <Zap className="w-5 h-5 text-amber-400" />
              Coba Playground
            </motion.button>
          </Link>
        </motion.div>

        {/* Feature pills */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="flex flex-wrap items-center justify-center gap-3 mt-14"
        >
          {['Visualisasi Interaktif', 'Step-by-Step', 'Animasi Real-time', 'Dark Mode', 'Responsive', 'Modern UI'].map(
            (feature, i) => (
              <motion.span
                key={feature}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.7 + i * 0.1 }}
                className="px-4 py-2 rounded-xl text-xs font-semibold border border-white/10 text-[var(--text-muted)] bg-white/5 backdrop-blur-md"
              >
                {feature}
              </motion.span>
            )
          )}
        </motion.div>
      </div>
    </section>
  );
}
