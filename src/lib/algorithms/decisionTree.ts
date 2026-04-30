import { LabeledPoint2D } from '@/lib/datasets';

export interface TreeNode {
  featureIndex?: number; // 0 untuk X, 1 untuk Y
  threshold?: number;
  gini?: number;
  samples: number;
  predictedLabel?: number; // Hanya untuk leaf atau info tambahan
  left?: TreeNode;
  right?: TreeNode;
}

function calculateGini(labels: number[]): number {
  if (labels.length === 0) return 0;
  const counts: Record<number, number> = {};
  for (const l of labels) counts[l] = (counts[l] || 0) + 1;
  let sum = 0;
  for (const c of Object.values(counts)) {
    const p = c / labels.length;
    sum += p * p;
  }
  return 1 - sum;
}

function getMajorityLabel(labels: number[]): number {
  const counts: Record<number, number> = {};
  for (const l of labels) counts[l] = (counts[l] || 0) + 1;
  let maxCount = -1;
  let majority = 0;
  for (const [l, c] of Object.entries(counts)) {
    if (c > maxCount) {
      maxCount = c;
      majority = parseInt(l);
    }
  }
  return majority;
}

export function buildTree(
  data: LabeledPoint2D[],
  maxDepth: number = 3,
  minSamples: number = 2,
  currentDepth: number = 0
): TreeNode {
  const labels = data.map(d => d.label);
  const nodeGini = calculateGini(labels);
  const majority = getMajorityLabel(labels);

  // Basis case: max depth, min samples, atau murni
  if (currentDepth >= maxDepth || data.length <= minSamples || nodeGini === 0) {
    return {
      samples: data.length,
      predictedLabel: majority,
      gini: nodeGini
    };
  }

  let bestGini = Infinity;
  let bestFeature = 0;
  let bestThreshold = 0;
  let bestSplits: { left: LabeledPoint2D[], right: LabeledPoint2D[] } | null = null;

  // Cek setiap fitur (X=0, Y=1)
  for (let f = 0; f < 2; f++) {
    const featureName = f === 0 ? 'x' : 'y';
    const values = Array.from(new Set(data.map(d => d[featureName]))).sort((a, b) => a - b);

    for (let i = 0; i < values.length - 1; i++) {
      const threshold = (values[i] + values[i+1]) / 2;
      const left = data.filter(d => d[featureName] <= threshold);
      const right = data.filter(d => d[featureName] > threshold);

      if (left.length === 0 || right.length === 0) continue;

      const leftGini = calculateGini(left.map(d => d.label));
      const rightGini = calculateGini(right.map(d => d.label));
      const weightedGini = (left.length * leftGini + right.length * rightGini) / data.length;

      if (weightedGini < bestGini) {
        bestGini = weightedGini;
        bestFeature = f;
        bestThreshold = threshold;
        bestSplits = { left, right };
      }
    }
  }

  if (!bestSplits) {
    return {
      samples: data.length,
      predictedLabel: majority,
      gini: nodeGini
    };
  }

  return {
    featureIndex: bestFeature,
    threshold: bestThreshold,
    gini: nodeGini,
    samples: data.length,
    predictedLabel: majority,
    left: buildTree(bestSplits.left, maxDepth, minSamples, currentDepth + 1),
    right: buildTree(bestSplits.right, maxDepth, minSamples, currentDepth + 1)
  };
}
