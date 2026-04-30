import { getAllModels } from '@/lib/csvParser';
import CompareClient from './CompareClient';

export default function ComparePage() {
  const allModels = getAllModels();
  return <CompareClient allModels={allModels} />;
}
