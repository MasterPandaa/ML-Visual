import { getAllModels, getKategoriStats } from '@/lib/csvParser';
import { KATEGORI_CONFIG, Kategori } from '@/types/model';
import HeroSection from '@/components/home/HeroSection';
import StatsSection from '@/components/home/StatsSection';
import KategoriGrid from '@/components/home/KategoriGrid';
import FeaturedModels from '@/components/home/FeaturedModels';

export default function HomePage() {
  const models = getAllModels();
  const stats = getKategoriStats();
  
  const kategoriList = (Object.entries(KATEGORI_CONFIG) as [Kategori, typeof KATEGORI_CONFIG[Kategori]][]).map(
    ([nama, config]) => ({
      nama,
      ...config,
      count: stats[nama] || 0,
    })
  );

  const featuredSlugs = ['random-forest', 'k-means-clustering', 'transformer', 'linear-regression'];
  const featuredModels = featuredSlugs
    .map(slug => models.find(m => m.slug === slug))
    .filter(Boolean);

  return (
    <div className="relative">
      <HeroSection totalModels={models.length} totalKategori={kategoriList.length} />
      <StatsSection totalModels={models.length} totalKategori={kategoriList.length} />
      <FeaturedModels models={featuredModels as typeof models} />
      <KategoriGrid kategoriList={kategoriList} />
    </div>
  );
}
