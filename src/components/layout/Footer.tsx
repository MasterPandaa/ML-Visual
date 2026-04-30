'use client';

import { Brain, Code2, Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-[var(--border-color)] bg-[var(--bg-secondary)]/50" suppressHydrationWarning>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" suppressHydrationWarning>
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
              <Brain className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold gradient-text">ML Visual Lab</span>
          </div>
          
          <p className="text-sm text-[var(--text-muted)] flex items-center gap-1">
            Dibuat dengan <Heart className="w-3 h-3 text-red-400 fill-red-400" /> untuk edukasi Machine Learning
          </p>
          
          <div className="flex items-center gap-4">
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
            >
              <Code2 className="w-5 h-5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
