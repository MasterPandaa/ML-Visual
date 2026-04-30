import { Point2D } from '@/lib/datasets';

export interface KMeansState {
  centroids: Point2D[];
  assignments: number[];
  iteration: number;
  converged: boolean;
}

function euclidean(a: Point2D, b: Point2D): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

function initCentroids(points: Point2D[], k: number): Point2D[] {
  const shuffled = [...points].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, k).map(p => ({ ...p }));
}

function assignClusters(points: Point2D[], centroids: Point2D[]): number[] {
  return points.map(p => {
    let minDist = Infinity;
    let bestCluster = 0;
    for (let c = 0; c < centroids.length; c++) {
      const dist = euclidean(p, centroids[c]);
      if (dist < minDist) {
        minDist = dist;
        bestCluster = c;
      }
    }
    return bestCluster;
  });
}

function updateCentroids(points: Point2D[], assignments: number[], k: number): Point2D[] {
  const newCentroids: Point2D[] = [];
  for (let c = 0; c < k; c++) {
    const members = points.filter((_, i) => assignments[i] === c);
    if (members.length === 0) {
      newCentroids.push({ x: Math.random() * 100, y: Math.random() * 100 });
    } else {
      newCentroids.push({
        x: members.reduce((s, p) => s + p.x, 0) / members.length,
        y: members.reduce((s, p) => s + p.y, 0) / members.length,
      });
    }
  }
  return newCentroids;
}

export function* kmeansSteps(
  points: Point2D[],
  k: number,
  maxIterations: number = 30
): Generator<KMeansState> {
  let centroids = initCentroids(points, k);
  let assignments: number[] = [];
  
  for (let iter = 0; iter < maxIterations; iter++) {
    assignments = assignClusters(points, centroids);
    
    // Half-step 1: Show new assignments with old centroids
    yield {
      centroids: centroids.map(c => ({ ...c })),
      assignments: [...assignments],
      iteration: iter + 0.5,
      converged: false,
    };
    
    const newCentroids = updateCentroids(points, assignments, k);
    
    const converged = centroids.every((c, i) =>
      Math.abs(c.x - newCentroids[i].x) < 0.01 &&
      Math.abs(c.y - newCentroids[i].y) < 0.01
    );
    
    centroids = newCentroids;
    
    // Half-step 2: Show new centroids with current assignments
    yield {
      centroids: centroids.map(c => ({ ...c })),
      assignments: [...assignments],
      iteration: iter + 1,
      converged: converged,
    };
    
    if (converged) {
      return;
    }
  }
}

export function kmeansInit(points: Point2D[], k: number): KMeansState {
  const centroids = initCentroids(points, k);
  const assignments = assignClusters(points, centroids);
  return { centroids, assignments, iteration: 0, converged: false };
}
