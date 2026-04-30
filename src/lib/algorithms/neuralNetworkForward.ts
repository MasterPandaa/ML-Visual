export interface NeuralNetworkConfig {
  inputSize: number;
  hiddenSizes: number[];
  outputSize: number;
  activation: 'sigmoid' | 'relu' | 'tanh';
}

export interface LayerState {
  weights: number[][];
  biases: number[];
  activations: number[];
  preActivations: number[];
}

export interface ForwardPassState {
  layers: LayerState[];
  input: number[];
  output: number[];
}

function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-Math.max(-500, Math.min(500, x))));
}

function relu(x: number): number {
  return Math.max(0, x);
}

function tanh_(x: number): number {
  return Math.tanh(x);
}

function getActivation(type: 'sigmoid' | 'relu' | 'tanh'): (x: number) => number {
  switch (type) {
    case 'sigmoid': return sigmoid;
    case 'relu': return relu;
    case 'tanh': return tanh_;
  }
}

function randomWeight(): number {
  return (Math.random() - 0.5) * 2;
}

export function initNetwork(config: NeuralNetworkConfig): LayerState[] {
  const layers: LayerState[] = [];
  const sizes = [config.inputSize, ...config.hiddenSizes, config.outputSize];
  
  for (let i = 0; i < sizes.length - 1; i++) {
    const inputSize = sizes[i];
    const outputSize = sizes[i + 1];
    
    const weights: number[][] = [];
    for (let j = 0; j < outputSize; j++) {
      weights.push(Array(inputSize).fill(0).map(randomWeight));
    }
    
    layers.push({
      weights,
      biases: Array(outputSize).fill(0).map(() => randomWeight() * 0.1),
      activations: Array(outputSize).fill(0),
      preActivations: Array(outputSize).fill(0),
    });
  }
  
  return layers;
}

export function forwardPass(
  input: number[],
  layers: LayerState[],
  activation: 'sigmoid' | 'relu' | 'tanh' = 'sigmoid'
): ForwardPassState {
  const act = getActivation(activation);
  const resultLayers: LayerState[] = [];
  let currentInput = [...input];
  
  for (let l = 0; l < layers.length; l++) {
    const layer = layers[l];
    const preActivations: number[] = [];
    const activations: number[] = [];
    
    for (let j = 0; j < layer.weights.length; j++) {
      let sum = layer.biases[j];
      for (let i = 0; i < currentInput.length; i++) {
        sum += currentInput[i] * layer.weights[j][i];
      }
      preActivations.push(sum);
      // Use sigmoid for output layer, chosen activation for hidden
      const isOutput = l === layers.length - 1;
      activations.push(isOutput ? sigmoid(sum) : act(sum));
    }
    
    resultLayers.push({
      ...layer,
      preActivations,
      activations,
    });
    
    currentInput = activations;
  }
  
  return {
    layers: resultLayers,
    input,
    output: currentInput,
  };
}

export function* forwardPassSteps(
  input: number[],
  layers: LayerState[],
  activation: 'sigmoid' | 'relu' | 'tanh' = 'sigmoid'
): Generator<{ layerIndex: number; state: ForwardPassState }> {
  const act = getActivation(activation);
  const resultLayers: LayerState[] = [];
  let currentInput = [...input];
  
  for (let l = 0; l < layers.length; l++) {
    const layer = layers[l];
    const preActivations: number[] = [];
    const activations: number[] = [];
    
    for (let j = 0; j < layer.weights.length; j++) {
      let sum = layer.biases[j];
      for (let i = 0; i < currentInput.length; i++) {
        sum += currentInput[i] * layer.weights[j][i];
      }
      preActivations.push(sum);
      const isOutput = l === layers.length - 1;
      activations.push(isOutput ? sigmoid(sum) : act(sum));
    }
    
    resultLayers.push({
      ...layer,
      preActivations,
      activations,
    });
    
    currentInput = activations;
    
    yield {
      layerIndex: l,
      state: {
        layers: [...resultLayers],
        input,
        output: currentInput,
      },
    };
  }
}
