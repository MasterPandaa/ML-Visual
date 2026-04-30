import { getAllModels } from '@/lib/csvParser';
import ModelGrid from '@/components/model-cards/ModelGrid';
import { Suspense } from 'react';

interface ModelsPageProps {
  searchParams: Promise<{ kategori?: string }>;
}

export default async function ModelsPage({ searchParams }: ModelsPageProps) {
  const models = getAllModels();
  const params = await searchParams;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">
          Katalog <span className="gradient-text">Model ML</span>
        </h1>
        <p className="text-[var(--text-secondary)]">
          Jelajahi semua model machine learning dengan visualisasi interaktif
        </p>
      </div>
      
      <Suspense fallback={
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="skeleton h-48 rounded-xl" />
          ))}
        </div>
      }>
        <ModelGrid initialModels={models} initialKategori={params.kategori} />
      </Suspense>
    </div>
  );
}
