import { create } from 'zustand';
import { MLModel, Kategori, Kompleksitas } from '@/types/model';

interface ModelStore {
  models: MLModel[];
  setModels: (models: MLModel[]) => void;
  
  // Filters
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  selectedKategori: Kategori[];
  setSelectedKategori: (k: Kategori[]) => void;
  toggleKategori: (k: Kategori) => void;
  selectedKompleksitas: Kompleksitas[];
  setSelectedKompleksitas: (k: Kompleksitas[]) => void;
  toggleKompleksitas: (k: Kompleksitas) => void;
  sortBy: 'name' | 'complexity' | 'category';
  setSortBy: (s: 'name' | 'complexity' | 'category') => void;
  
  // Compare
  compareModels: string[];
  addCompareModel: (slug: string) => void;
  removeCompareModel: (slug: string) => void;
  clearCompare: () => void;
  
  // Simulation
  isPlaying: boolean;
  setIsPlaying: (p: boolean) => void;
  speed: number;
  setSpeed: (s: number) => void;
  
  // Filtered results
  getFilteredModels: () => MLModel[];
}

const KOMPLEKSITAS_ORDER: Record<Kompleksitas, number> = {
  'Low': 0,
  'Medium': 1,
  'High': 2,
};

export const useModelStore = create<ModelStore>((set, get) => ({
  models: [],
  setModels: (models) => set({ models }),
  
  searchQuery: '',
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  selectedKategori: [],
  setSelectedKategori: (selectedKategori) => set({ selectedKategori }),
  toggleKategori: (k) => set((state) => ({
    selectedKategori: state.selectedKategori.includes(k)
      ? state.selectedKategori.filter(x => x !== k)
      : [...state.selectedKategori, k],
  })),
  selectedKompleksitas: [],
  setSelectedKompleksitas: (selectedKompleksitas) => set({ selectedKompleksitas }),
  toggleKompleksitas: (k) => set((state) => ({
    selectedKompleksitas: state.selectedKompleksitas.includes(k)
      ? state.selectedKompleksitas.filter(x => x !== k)
      : [...state.selectedKompleksitas, k],
  })),
  sortBy: 'name',
  setSortBy: (sortBy) => set({ sortBy }),
  
  compareModels: [],
  addCompareModel: (slug) => set((state) => {
    if (state.compareModels.length >= 3 || state.compareModels.includes(slug)) return state;
    return { compareModels: [...state.compareModels, slug] };
  }),
  removeCompareModel: (slug) => set((state) => ({
    compareModels: state.compareModels.filter(s => s !== slug),
  })),
  clearCompare: () => set({ compareModels: [] }),
  
  isPlaying: false,
  setIsPlaying: (isPlaying) => set({ isPlaying }),
  speed: 1,
  setSpeed: (speed) => set({ speed }),
  
  getFilteredModels: () => {
    const { models, searchQuery, selectedKategori, selectedKompleksitas, sortBy } = get();
    
    let filtered = [...models];
    
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(m =>
        m.nama_model.toLowerCase().includes(q) ||
        m.deskripsi_singkat.toLowerCase().includes(q)
      );
    }
    
    if (selectedKategori.length > 0) {
      filtered = filtered.filter(m => selectedKategori.includes(m.kategori));
    }
    
    if (selectedKompleksitas.length > 0) {
      filtered = filtered.filter(m => selectedKompleksitas.includes(m.kompleksitas));
    }
    
    switch (sortBy) {
      case 'name':
        filtered.sort((a, b) => a.nama_model.localeCompare(b.nama_model));
        break;
      case 'complexity':
        filtered.sort((a, b) => KOMPLEKSITAS_ORDER[a.kompleksitas] - KOMPLEKSITAS_ORDER[b.kompleksitas]);
        break;
      case 'category':
        filtered.sort((a, b) => a.kategori.localeCompare(b.kategori));
        break;
    }
    
    return filtered;
  },
}));
