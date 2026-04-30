import { LabeledPoint2D } from '@/lib/datasets';

export interface KNNResult {
  point: { x: number; y: number };
  neighbors: { point: LabeledPoint2D; distance: number }[];
  predictedLabel: number;
}

function euclidean(a: { x: number; y: number }, b: { x: number; y: number }): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

export function knnPredict(
  trainingData: LabeledPoint2D[],
  queryPoint: { x: number; y: number },
  k: number
): KNNResult {
  const distances = trainingData.map(p => ({
    point: p,
    distance: euclidean(p, queryPoint),
  }));
  
  distances.sort((a, b) => a.distance - b.distance);
  const neighbors = distances.slice(0, k);
  
  // Voting
  const votes: Record<number, number> = {};
  for (const n of neighbors) {
    votes[n.point.label] = (votes[n.point.label] || 0) + 1;
  }
  
  let maxVotes = 0;
  let predictedLabel = 0;
  for (const [label, count] of Object.entries(votes)) {
    if (count > maxVotes) {
      maxVotes = count;
      predictedLabel = parseInt(label);
    }
  }
  
  return {
    point: queryPoint,
    neighbors,
    predictedLabel,
  };
}
