import { Point2D } from '@/lib/datasets';

export interface LinearRegressionState {
  slope: number;
  intercept: number;
  mse: number;
  iteration: number;
  converged: boolean;
}

export function linearRegressionNormal(points: Point2D[]): { slope: number; intercept: number } {
  const n = points.length;
  if (n === 0) return { slope: 0, intercept: 0 };
  
  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
  for (const p of points) {
    sumX += p.x;
    sumY += p.y;
    sumXY += p.x * p.y;
    sumX2 += p.x * p.x;
  }
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  
  return { slope, intercept };
}

export function computeMSE(points: Point2D[], slope: number, intercept: number): number {
  if (points.length === 0) return 0;
  let sum = 0;
  for (const p of points) {
    const predicted = slope * p.x + intercept;
    sum += (p.y - predicted) ** 2;
  }
  return sum / points.length;
}

export function* gradientDescentSteps(
  points: Point2D[],
  learningRate: number = 0.001,
  maxIterations: number = 100
): Generator<LinearRegressionState> {
  let slope = 0;
  let intercept = 0;
  const n = points.length;
  
  for (let iter = 0; iter < maxIterations; iter++) {
    let dSlope = 0;
    let dIntercept = 0;
    
    for (const p of points) {
      const predicted = slope * p.x + intercept;
      const error = predicted - p.y;
      dSlope += error * p.x;
      dIntercept += error;
    }
    
    dSlope = (2 / n) * dSlope;
    dIntercept = (2 / n) * dIntercept;
    
    slope -= learningRate * dSlope;
    intercept -= learningRate * dIntercept;
    
    const mse = computeMSE(points, slope, intercept);
    const converged = Math.abs(dSlope) < 0.001 && Math.abs(dIntercept) < 0.001;
    
    yield { slope, intercept, mse, iteration: iter + 1, converged };
    
    if (converged) return;
  }
}
