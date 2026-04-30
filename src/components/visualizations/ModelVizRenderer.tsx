'use client';

import dynamic from 'next/dynamic';
import { Code2 } from 'lucide-react';

function VizSkeleton() {
  return <div className="w-full h-[400px] skeleton rounded-xl" />;
}

const LinearRegressionViz = dynamic(() => import('./regresi/LinearRegressionViz'), { ssr: false, loading: () => <VizSkeleton /> });
const PolynomialRegressionViz = dynamic(() => import('./regresi/PolynomialRegressionViz'), { ssr: false, loading: () => <VizSkeleton /> });
const RidgeRegressionViz = dynamic(() => import('./regresi/RidgeRegressionViz'), { ssr: false, loading: () => <VizSkeleton /> });
const LassoRegressionViz = dynamic(() => import('./regresi/LassoRegressionViz'), { ssr: false, loading: () => <VizSkeleton /> });
const ElasticNetViz = dynamic(() => import('./regresi/ElasticNetViz'), { ssr: false, loading: () => <VizSkeleton /> });
const BayesianRegressionViz = dynamic(() => import('./regresi/BayesianRegressionViz'), { ssr: false, loading: () => <VizSkeleton /> });
const QuantileRegressionViz = dynamic(() => import('./regresi/QuantileRegressionViz'), { ssr: false, loading: () => <VizSkeleton /> });
const HuberRegressionViz = dynamic(() => import('./regresi/HuberRegressionViz'), { ssr: false, loading: () => <VizSkeleton /> });
const KMeansViz = dynamic(() => import('./unsupervised/KMeansViz'), { ssr: false, loading: () => <VizSkeleton /> });
const PCAViz = dynamic(() => import('./unsupervised/PCAViz'), { ssr: false, loading: () => <VizSkeleton /> });
const DBSCANViz = dynamic(() => import('./unsupervised/DBSCANViz'), { ssr: false, loading: () => <VizSkeleton /> });
const HierarchicalClusteringViz = dynamic(() => import('./unsupervised/HierarchicalClusteringViz'), { ssr: false, loading: () => <VizSkeleton /> });
const GMMViz = dynamic(() => import('./unsupervised/GMMViz'), { ssr: false, loading: () => <VizSkeleton /> });
const IsolationForestViz = dynamic(() => import('./unsupervised/IsolationForestViz'), { ssr: false, loading: () => <VizSkeleton /> });
const OneClassSVMViz = dynamic(() => import('./unsupervised/OneClassSVMViz'), { ssr: false, loading: () => <VizSkeleton /> });
const TSNEViz = dynamic(() => import('./unsupervised/TSNEViz'), { ssr: false, loading: () => <VizSkeleton /> });
const UMAPViz = dynamic(() => import('./unsupervised/UMAPViz'), { ssr: false, loading: () => <VizSkeleton /> });
const AutoencoderViz = dynamic(() => import('./unsupervised/AutoencoderViz'), { ssr: false, loading: () => <VizSkeleton /> });
const NeuralNetworkViz = dynamic(() => import('./deeplearning/NeuralNetworkViz'), { ssr: false, loading: () => <VizSkeleton /> });
const CNNViz = dynamic(() => import('./deeplearning/CNNViz'), { ssr: false, loading: () => <VizSkeleton /> });
const LogisticRegressionViz = dynamic(() => import('./klasifikasi/LogisticRegressionViz'), { ssr: false, loading: () => <VizSkeleton /> });
const SVMViz = dynamic(() => import('./klasifikasi/SVMViz'), { ssr: false, loading: () => <VizSkeleton /> });
const NaiveBayesViz = dynamic(() => import('./klasifikasi/NaiveBayesViz'), { ssr: false, loading: () => <VizSkeleton /> });
const LDAViz = dynamic(() => import('./klasifikasi/LDAViz'), { ssr: false, loading: () => <VizSkeleton /> });
const QDAViz = dynamic(() => import('./klasifikasi/QDAViz'), { ssr: false, loading: () => <VizSkeleton /> });
const KNNViz = dynamic(() => import('./klasifikasi/KNNViz'), { ssr: false, loading: () => <VizSkeleton /> });
const DecisionTreeViz = dynamic(() => import('./klasifikasi/DecisionTreeViz'), { ssr: false, loading: () => <VizSkeleton /> });
const QLearningViz = dynamic(() => import('./reinforcement/QLearningViz'), { ssr: false, loading: () => <VizSkeleton /> });
const RandomForestViz = dynamic(() => import('./ensemble/RandomForestViz'), { ssr: false, loading: () => <VizSkeleton /> });
const BoostingViz = dynamic(() => import('./ensemble/BoostingViz'), { ssr: false, loading: () => <VizSkeleton /> });
const StackingViz = dynamic(() => import('./ensemble/StackingViz'), { ssr: false, loading: () => <VizSkeleton /> });
const VotingClassifierViz = dynamic(() => import('./ensemble/VotingClassifierViz'), { ssr: false, loading: () => <VizSkeleton /> });
const ExtraTreesViz = dynamic(() => import('./ensemble/ExtraTreesViz'), { ssr: false, loading: () => <VizSkeleton /> });
const XGBoostViz = dynamic(() => import('./ensemble/XGBoostViz'), { ssr: false, loading: () => <VizSkeleton /> });
const LightGBMViz = dynamic(() => import('./ensemble/LightGBMViz'), { ssr: false, loading: () => <VizSkeleton /> });
const CatBoostViz = dynamic(() => import('./ensemble/CatBoostViz'), { ssr: false, loading: () => <VizSkeleton /> });
const AdaBoostViz = dynamic(() => import('./ensemble/AdaBoostViz'), { ssr: false, loading: () => <VizSkeleton /> });

const VIZ_COMPONENTS: Record<string, React.ComponentType> = {
  'linear-regression': LinearRegressionViz,
  'polynomial-regression': PolynomialRegressionViz,
  'ridge-regression-l2': RidgeRegressionViz,
  'lasso-regression-l1': LassoRegressionViz,
  'elastic-net': ElasticNetViz,
  'bayesian-regression': BayesianRegressionViz,
  'quantile-regression': QuantileRegressionViz,
  'huber-regression': HuberRegressionViz,
  'k-means-clustering': KMeansViz,
  'principal-component-analysis-pca': PCAViz,
  'dbscan': DBSCANViz,
  'hierarchical-clustering': HierarchicalClusteringViz,
  'gaussian-mixture-model-gmm': GMMViz,
  'isolation-forest': IsolationForestViz,
  'one-class-svm': OneClassSVMViz,
  't-sne': TSNEViz,
  'umap': UMAPViz,
  'autoencoder': AutoencoderViz,
  'multi-layer-perceptron-mlp': NeuralNetworkViz,
  'convolutional-neural-network-cnn': CNNViz,
  'logistic-regression': LogisticRegressionViz,
  'support-vector-machine-svm': SVMViz,
  'naive-bayes': NaiveBayesViz,
  'linear-discriminant-analysis-lda': LDAViz,
  'quadratic-discriminant-analysis-qda': QDAViz,
  'k-nearest-neighbors-knn': KNNViz,
  'decision-tree': DecisionTreeViz,
  'random-forest': RandomForestViz,
  'gradient-boosting-gbm': BoostingViz,
  'xgboost': XGBoostViz,
  'lightgbm': LightGBMViz,
  'catboost': CatBoostViz,
  'adaboost': AdaBoostViz,
  'extra-trees-extremely-randomized-trees': ExtraTreesViz,
  'stacking': StackingViz,
  'voting-classifier': VotingClassifierViz,
  'q-learning': QLearningViz,
};

interface Props {
  slug: string;
  modelName: string;
}

export default function ModelVizRenderer({ slug, modelName }: Props) {
  const VizComponent = VIZ_COMPONENTS[slug];
  
  if (!VizComponent) {
    return (
      <div className="absolute inset-0 flex items-center justify-center flex-col text-center p-6">
        <div className="w-16 h-16 rounded-full bg-indigo-500/10 flex items-center justify-center mb-4">
          <Code2 className="w-8 h-8 text-indigo-400" />
        </div>
        <h3 className="text-white font-medium mb-2">Visualisasi Belum Tersedia</h3>
        <p className="text-sm text-[var(--text-muted)] max-w-sm">
          Visualisasi interaktif untuk model {modelName} sedang dalam tahap pengembangan.
        </p>
      </div>
    );
  }

  return <VizComponent />;
}
