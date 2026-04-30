export interface Point2D {
  x: number;
  y: number;
}

export interface LabeledPoint2D extends Point2D {
  label: number;
  cluster?: number;
}

export function generateLinearData(
  n: number,
  noise: number = 0.3,
  slope: number = 1.5,
  intercept: number = 0.5
): Point2D[] {
  const points: Point2D[] = [];
  for (let i = 0; i < n; i++) {
    const x = Math.random() * 10;
    const y = slope * x + intercept + (Math.random() - 0.5) * noise * 10;
    points.push({ x, y });
  }
  return points;
}

export function generateClusterData(
  n: number,
  k: number = 3,
  spread: number = 1.5
): LabeledPoint2D[] {
  const points: LabeledPoint2D[] = [];
  const centers: Point2D[] = [];
  
  for (let i = 0; i < k; i++) {
    centers.push({
      x: Math.random() * 80 + 10,
      y: Math.random() * 80 + 10,
    });
  }
  
  const perCluster = Math.floor(n / k);
  
  for (let c = 0; c < k; c++) {
    for (let i = 0; i < perCluster; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = Math.random() * spread * 10;
      points.push({
        x: centers[c].x + Math.cos(angle) * r,
        y: centers[c].y + Math.sin(angle) * r,
        label: c,
      });
    }
  }
  
  return points;
}

export function generateClassificationData(
  n: number,
  type: 'linear' | 'xor' | 'circle' = 'linear'
): LabeledPoint2D[] {
  const points: Point2D[] = [];
  for (let i = 0; i < n; i++) {
    points.push({ x: Math.random() * 100, y: Math.random() * 100 });
  }
  return relabelPoints(points, type);
}

export function relabelPoints(
  points: Point2D[],
  type: 'linear' | 'xor' | 'circle' = 'linear'
): LabeledPoint2D[] {
  return points.map(p => {
    let label = 0;
    const noise = Math.random() < 0.05;
    switch (type) {
      case 'linear':
        label = (p.y > 0.6 * p.x + 20 ? 1 : 0);
        break;
      case 'xor':
        label = ((p.x > 50) !== (p.y > 50) ? 1 : 0);
        break;
      case 'circle':
        const dist = Math.sqrt((p.x - 50) ** 2 + (p.y - 50) ** 2);
        label = (dist < 30 ? 1 : 0);
        break;
    }
    return { ...p, label: (label ^ (noise ? 1 : 0)) as number };
  });
}

export function generateImageData(
  size: number = 8,
  pattern: 'X' | 'O' | 'edge' = 'X'
): number[][] {
  const grid: number[][] = Array(size).fill(null).map(() => Array(size).fill(0));
  
  switch (pattern) {
    case 'X':
      for (let i = 0; i < size; i++) {
        grid[i][i] = 1;
        grid[i][size - 1 - i] = 1;
      }
      break;
    case 'O':
      for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
          const dist = Math.sqrt((i - size/2 + 0.5) ** 2 + (j - size/2 + 0.5) ** 2);
          if (Math.abs(dist - size/3) < 1) grid[i][j] = 1;
        }
      }
      break;
    case 'edge':
      for (let i = 0; i < size; i++) {
        for (let j = 0; j < Math.floor(size / 2); j++) {
          grid[i][j] = 1;
        }
      }
      break;
  }
  
  return grid;
}
