import Papa from 'papaparse';
import fs from 'fs';
import path from 'path';
import { MLModel, Kategori, Kompleksitas, KATEGORI_CONFIG } from '@/types/model';

interface RawCSVRow {
  Model: string;
  'Penjelasan Singkat': string;
}

const FILE_KATEGORI_MAP: Record<string, Kategori> = {
  'Regresi.csv': 'Regresi',
  'Klasifikasi.csv': 'Klasifikasi',
  'UNSUPERVISED LEARNING.csv': 'Unsupervised Learning',
  'ENSEMBLE METHODS.csv': 'Ensemble Methods',
  'DEEP LEARNING.csv': 'Deep Learning',
  'DEEP LEARNING_Generatif.csv': 'Deep Learning Generatif',
  'REINFORCEMENT LEARNING.csv': 'Reinforcement Learning',
  'MODEL HYBRID.csv': 'Model Hybrid',
  'MODEL SPESIALIS.csv': 'Model Spesialis',
};

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/\*\*/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

function cleanModelName(name: string): string {
  return name.replace(/\*\*/g, '').trim();
}

function estimateKompleksitas(kategori: Kategori, modelName: string): Kompleksitas {
  const name = modelName.toLowerCase();
  
  // High complexity models
  if (['deep learning', 'deep learning generatif', 'reinforcement learning'].includes(kategori.toLowerCase())) {
    if (name.includes('perceptron') && !name.includes('multi')) return 'Low';
    if (name.includes('simple') || name.includes('basic')) return 'Medium';
    return 'High';
  }
  
  if (kategori === 'Model Hybrid' || kategori === 'Model Spesialis') {
    return 'High';
  }
  
  if (kategori === 'Ensemble Methods') {
    if (name.includes('voting')) return 'Medium';
    return 'High';
  }
  
  // Medium complexity
  if (name.includes('svm') || name.includes('support vector') || name.includes('pca') || name.includes('dbscan')) {
    return 'Medium';
  }
  
  // Low complexity
  if (name.includes('linear') || name.includes('knn') || name.includes('k-nearest') || name.includes('naive bayes') || name.includes('k-means')) {
    return 'Low';
  }
  
  if (kategori === 'Regresi') return 'Low';
  if (kategori === 'Klasifikasi') return 'Medium';
  
  return 'Medium';
}

function parseCSVFile(filePath: string, kategori: Kategori): MLModel[] {
  const csvContent = fs.readFileSync(filePath, 'utf-8');
  const config = KATEGORI_CONFIG[kategori];
  
  const result = Papa.parse<RawCSVRow>(csvContent, {
    header: true,
    skipEmptyLines: true,
  });

  return result.data.map((row, index) => {
    const namaModel = cleanModelName(row.Model || '');
    const slug = slugify(namaModel);
    
    return {
      id: `${slugify(kategori)}-${index + 1}`,
      slug,
      nama_model: namaModel,
      kategori,
      deskripsi_singkat: (row['Penjelasan Singkat'] || '').replace(/"/g, '').trim(),
      kompleksitas: estimateKompleksitas(kategori, namaModel),
      icon: config.icon,
      color: config.color,
    };
  }).filter(model => model.nama_model.length > 0);
}

export function getAllModels(): MLModel[] {
  const dataDir = path.join(process.cwd(), 'public', 'data', 'Sistem_Belajar_ML');
  const allModels: MLModel[] = [];

  for (const [filename, kategori] of Object.entries(FILE_KATEGORI_MAP)) {
    const filePath = path.join(dataDir, filename);
    if (fs.existsSync(filePath)) {
      const models = parseCSVFile(filePath, kategori);
      allModels.push(...models);
    }
  }

  return allModels;
}

export function getModelBySlug(slug: string): MLModel | undefined {
  const models = getAllModels();
  return models.find(m => m.slug === slug);
}

export function getModelsByKategori(kategori: Kategori): MLModel[] {
  const models = getAllModels();
  return models.filter(m => m.kategori === kategori);
}

export function getKategoriStats(): Record<Kategori, number> {
  const models = getAllModels();
  const stats: Partial<Record<Kategori, number>> = {};
  for (const model of models) {
    stats[model.kategori] = (stats[model.kategori] || 0) + 1;
  }
  return stats as Record<Kategori, number>;
}
