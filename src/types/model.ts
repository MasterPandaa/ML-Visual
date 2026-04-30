export type Kompleksitas = 'Low' | 'Medium' | 'High';

export type Kategori =
  | 'Regresi'
  | 'Klasifikasi'
  | 'Unsupervised Learning'
  | 'Ensemble Methods'
  | 'Deep Learning'
  | 'Deep Learning Generatif'
  | 'Reinforcement Learning'
  | 'Model Hybrid'
  | 'Model Spesialis';

export interface MLModel {
  id: string;
  slug: string;
  nama_model: string;
  kategori: Kategori;
  deskripsi_singkat: string;
  kompleksitas: Kompleksitas;
  icon: string;
  color: string;
}

export interface KategoriInfo {
  nama: Kategori;
  icon: string;
  color: string;
  gradient: string;
  description: string;
  count: number;
}

export const KATEGORI_CONFIG: Record<Kategori, { icon: string; color: string; gradient: string; description: string }> = {
  'Regresi': {
    icon: '📈',
    color: '#3B82F6',
    gradient: 'from-blue-500 to-cyan-400',
    description: 'Model untuk memprediksi nilai kontinu'
  },
  'Klasifikasi': {
    icon: '🏷️',
    color: '#10B981',
    gradient: 'from-emerald-500 to-teal-400',
    description: 'Model untuk mengklasifikasi data ke dalam kategori'
  },
  'Unsupervised Learning': {
    icon: '🔍',
    color: '#F59E0B',
    gradient: 'from-amber-500 to-yellow-400',
    description: 'Model yang belajar pola tanpa label'
  },
  'Ensemble Methods': {
    icon: '🤝',
    color: '#F97316',
    gradient: 'from-orange-500 to-red-400',
    description: 'Kombinasi beberapa model untuk prediksi lebih baik'
  },
  'Deep Learning': {
    icon: '🧠',
    color: '#EF4444',
    gradient: 'from-red-500 to-pink-500',
    description: 'Neural network berlapis untuk masalah kompleks'
  },
  'Deep Learning Generatif': {
    icon: '🎨',
    color: '#A855F7',
    gradient: 'from-purple-500 to-violet-400',
    description: 'Model yang dapat membuat data baru'
  },
  'Reinforcement Learning': {
    icon: '🎮',
    color: '#8B5CF6',
    gradient: 'from-violet-500 to-indigo-400',
    description: 'Agent belajar dari interaksi dengan lingkungan'
  },
  'Model Hybrid': {
    icon: '🔗',
    color: '#06B6D4',
    gradient: 'from-cyan-500 to-blue-400',
    description: 'Kombinasi arsitektur untuk tugas spesifik'
  },
  'Model Spesialis': {
    icon: '⚡',
    color: '#EC4899',
    gradient: 'from-pink-500 to-rose-400',
    description: 'Model khusus untuk domain tertentu'
  }
};

export function getKompleksitasColor(k: Kompleksitas): string {
  switch (k) {
    case 'Low': return '#22C55E';
    case 'Medium': return '#F59E0B';
    case 'High': return '#EF4444';
  }
}

export function getKompleksitasEmoji(k: Kompleksitas): string {
  switch (k) {
    case 'Low': return '🟢';
    case 'Medium': return '🟡';
    case 'High': return '🔴';
  }
}
