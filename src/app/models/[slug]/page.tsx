import { getModelBySlug, getAllModels } from '@/lib/csvParser';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, BookOpen, Code2, Cpu, Tags, CheckCircle2, XCircle } from 'lucide-react';
import { KATEGORI_CONFIG, getKompleksitasEmoji, getKompleksitasColor } from '@/types/model';
import ModelVizRenderer from '@/components/visualizations/ModelVizRenderer';

interface ModelDetailPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const models = getAllModels();
  return models.map((model) => ({
    slug: model.slug,
  }));
}

export default async function ModelDetailPage({ params }: ModelDetailPageProps) {
  const resolvedParams = await params;
  const model = getModelBySlug(resolvedParams.slug);

  if (!model) {
    notFound();
  }

  const config = KATEGORI_CONFIG[model.kategori];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-[var(--text-muted)] mb-6">
        <Link href="/" className="hover:text-white transition-colors">Home</Link>
        <span>/</span>
        <Link href={`/models?kategori=${encodeURIComponent(model.kategori)}`} className="hover:text-white transition-colors">
          Models
        </Link>
        <span>/</span>
        <span className="text-white font-medium">{model.nama_model}</span>
      </nav>

      {/* Main Layout */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* INFO PANEL (30%) */}
        <div className="w-full lg:w-[35%] space-y-6">
          <div className="glass-card p-6 border-t-4" style={{ borderTopColor: config.color }}>
            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                style={{ backgroundColor: `${config.color}20`, border: `1px solid ${config.color}40` }}
              >
                {config.icon}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white leading-tight mb-1">{model.nama_model}</h1>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-md border"
                    style={{ color: config.color, borderColor: `${config.color}40`, backgroundColor: `${config.color}10` }}>
                    {model.kategori}
                  </span>
                  <span className="text-xs font-medium px-2 py-0.5 rounded-md"
                    style={{ backgroundColor: `${getKompleksitasColor(model.kompleksitas)}15`, color: getKompleksitasColor(model.kompleksitas) }}>
                    {getKompleksitasEmoji(model.kompleksitas)} {model.kompleksitas}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2 flex items-center gap-1">
                  <Cpu className="w-3 h-3" /> Info Singkat
                </h3>
                <p className="text-sm text-white/90 leading-relaxed">
                  {model.deskripsi_singkat}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                  <h4 className="text-xs font-semibold text-emerald-400 mb-1 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Kelebihan
                  </h4>
                  <ul className="text-xs text-white/80 space-y-1 list-disc pl-3">
                    <li>Mudah diinterpretasi</li>
                    <li>Training cepat</li>
                  </ul>
                </div>
                <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20">
                  <h4 className="text-xs font-semibold text-rose-400 mb-1 flex items-center gap-1">
                    <XCircle className="w-3 h-3" /> Kekurangan
                  </h4>
                  <ul className="text-xs text-white/80 space-y-1 list-disc pl-3">
                    <li>Rentan outlier</li>
                    <li>Asumsi linear</li>
                  </ul>
                </div>
              </div>

              <div>
                <h3 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2 flex items-center gap-1">
                  <Tags className="w-3 h-3" /> Tags
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  <span className="chip text-[10px] px-2 py-0.5">{model.kategori}</span>
                  <span className="chip text-[10px] px-2 py-0.5">Machine Learning</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* VISUALIZATION PANEL (70%) */}
        <div className="w-full lg:w-[65%] flex flex-col gap-6">
          <div className="glass-card p-6 flex-1 min-h-[500px] flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <SparklesIcon className="w-5 h-5 text-indigo-400" />
                Visualisasi Interaktif
              </h2>
            </div>
            
            <div className="flex-1 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)] overflow-hidden p-4 relative">
              <ModelVizRenderer slug={model.slug} modelName={model.nama_model} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SparklesIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
      <path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/>
    </svg>
  );
}
