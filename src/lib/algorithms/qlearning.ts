export interface QTableState {
  qTable: number[][][]; // [row][col][action] - 4 actions: up, right, down, left
  agentPos: { row: number; col: number };
  goalPos: { row: number; col: number };
  traps: { row: number; col: number }[];
  episode: number;
  step: number;
  totalReward: number;
  path: { row: number; col: number }[];
}

const ACTIONS = [
  { dr: -1, dc: 0 }, // up
  { dr: 0, dc: 1 },  // right
  { dr: 1, dc: 0 },  // down
  { dr: 0, dc: -1 }, // left
];

export function initQTable(gridSize: number): number[][][] {
  return Array(gridSize).fill(null).map(() =>
    Array(gridSize).fill(null).map(() =>
      Array(4).fill(0)
    )
  );
}

export function initGridWorld(gridSize: number = 5): QTableState {
  const traps = [
    { row: 1, col: 2 },
    { row: 3, col: 1 },
    { row: 2, col: 3 },
  ].filter(t => t.row < gridSize && t.col < gridSize);
  
  return {
    qTable: initQTable(gridSize),
    agentPos: { row: 0, col: 0 },
    goalPos: { row: gridSize - 1, col: gridSize - 1 },
    traps,
    episode: 0,
    step: 0,
    totalReward: 0,
    path: [{ row: 0, col: 0 }],
  };
}

function getReward(
  pos: { row: number; col: number },
  goalPos: { row: number; col: number },
  traps: { row: number; col: number }[]
): number {
  if (pos.row === goalPos.row && pos.col === goalPos.col) return 10;
  if (traps.some(t => t.row === pos.row && t.col === pos.col)) return -5;
  return -0.1;
}

export function qLearningStep(
  state: QTableState,
  gridSize: number,
  epsilon: number = 0.3,
  learningRate: number = 0.1,
  discount: number = 0.9
): QTableState {
  const { agentPos, goalPos, traps, qTable } = state;
  const r = agentPos.row;
  const c = agentPos.col;
  
  // Epsilon-greedy action selection
  let action: number;
  if (Math.random() < epsilon) {
    action = Math.floor(Math.random() * 4);
  } else {
    action = qTable[r][c].indexOf(Math.max(...qTable[r][c]));
  }
  
  // Take action
  const newRow = Math.max(0, Math.min(gridSize - 1, r + ACTIONS[action].dr));
  const newCol = Math.max(0, Math.min(gridSize - 1, c + ACTIONS[action].dc));
  const newPos = { row: newRow, col: newCol };
  
  // Get reward
  const reward = getReward(newPos, goalPos, traps);
  
  // Q-Learning update
  const maxNextQ = Math.max(...qTable[newRow][newCol]);
  const newQTable = qTable.map(row => row.map(col => [...col]));
  newQTable[r][c][action] = qTable[r][c][action] + 
    learningRate * (reward + discount * maxNextQ - qTable[r][c][action]);
  
  const reachedGoal = newPos.row === goalPos.row && newPos.col === goalPos.col;
  const hitTrap = traps.some(t => t.row === newPos.row && t.col === newPos.col);
  const done = reachedGoal || hitTrap || state.step > 50;
  
  if (done) {
    return {
      ...state,
      qTable: newQTable,
      agentPos: { row: 0, col: 0 },
      episode: state.episode + 1,
      step: 0,
      totalReward: 0,
      path: [{ row: 0, col: 0 }],
    };
  }
  
  return {
    ...state,
    qTable: newQTable,
    agentPos: newPos,
    step: state.step + 1,
    totalReward: state.totalReward + reward,
    path: [...state.path, newPos],
  };
}
