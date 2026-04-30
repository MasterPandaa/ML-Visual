'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { Brain, Menu, X, Home, Grid3X3, GitCompare, Gamepad2, Sparkles } from 'lucide-react';

const navLinks = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/models', label: 'Models', icon: Grid3X3 },
  { href: '/compare', label: 'Compare', icon: GitCompare },
  { href: '/playground', label: 'Playground', icon: Gamepad2 },
];

export default function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50">
      <div className="absolute inset-0 backdrop-blur-xl bg-[var(--bg-primary)]/80 border-b border-[var(--border-color)]" suppressHydrationWarning />
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" suppressHydrationWarning>
        <div className="flex items-center justify-between h-16" suppressHydrationWarning>
          {/* Custom Logo Branding */}
          <Link href="/" className="flex items-center gap-3 group" suppressHydrationWarning>
            <motion.div
              className="relative flex items-center justify-center w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 shadow-lg shadow-indigo-500/30"
              whileHover={{ rotate: 180, scale: 1.05 }}
              transition={{ type: "spring", stiffness: 200, damping: 10 }}
            >
              <div className="absolute inset-[2px] bg-[var(--bg-primary)] rounded-[14px] flex items-center justify-center">
                <Brain className="w-5 h-5 text-transparent bg-clip-text bg-gradient-to-tr from-indigo-400 to-pink-400" stroke="url(#logo-grad)" />
                <svg width="0" height="0">
                  <linearGradient id="logo-grad" x1="100%" y1="100%" x2="0%" y2="0%">
                    <stop stopColor="#818cf8" offset="0%" />
                    <stop stopColor="#e879f9" offset="100%" />
                  </linearGradient>
                </svg>
              </div>
            </motion.div>
            <div className="flex flex-col">
              <span className="text-xl font-extrabold tracking-tight text-white">
                ML<span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-pink-400">Visual</span>
              </span>
              <span className="text-[9px] font-medium text-[var(--text-muted)] -mt-1 tracking-widest uppercase">
                Interactive Lab
              </span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(({ href, label, icon: Icon }) => {
              const isActive = pathname === href || (href !== '/' && pathname.startsWith(href));
              return (
                <Link key={href} href={href}>
                  <motion.div
                    className={`relative flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                      isActive
                        ? 'text-white'
                        : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    suppressHydrationWarning
                  >
                    {isActive && (
                      <motion.div
                        layoutId="navbar-active"
                        className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 rounded-xl"
                        transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                    <Icon className="w-4 h-4 relative z-10" />
                    <span className="relative z-10">{label}</span>
                  </motion.div>
                </Link>
              );
            })}
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden control-btn"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="md:hidden absolute top-16 left-0 right-0 border-b border-[var(--border-color)] bg-[var(--bg-primary)]/95 backdrop-blur-2xl shadow-2xl"
          >
            <div className="px-4 py-6 flex flex-col gap-2">
              {navLinks.map(({ href, label, icon: Icon }) => {
                const isActive = pathname === href || (href !== '/' && pathname.startsWith(href));
                return (
                  <Link key={href} href={href} onClick={() => setMobileOpen(false)}>
                    <div
                      className={`flex items-center gap-4 px-5 py-4 rounded-2xl text-base font-semibold transition-all ${
                        isActive
                          ? 'bg-gradient-to-r from-indigo-500/20 to-purple-500/10 text-white border border-indigo-500/30 shadow-inner'
                          : 'text-[var(--text-secondary)] hover:bg-[var(--bg-card)] hover:text-white'
                      }`}
                    >
                      <Icon className={`w-5 h-5 ${isActive ? 'text-indigo-400' : ''}`} />
                      {label}
                    </div>
                  </Link>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
