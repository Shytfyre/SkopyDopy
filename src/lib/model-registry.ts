import { GPUTier, GPUCapabilities } from './gpu-detect';

export interface ModelConfig {
  id: string;
  fallbackId?: string;
  displayName: string;
  params: string;
  runtime: 'webllm' | 'transformers';
  tier: GPUTier;
  estimatedVRAM: string;
  description: string;
}

export const TEXT_MODELS: ModelConfig[] = [
  {
    id: 'Qwen2.5-7B-Instruct-q4f16_1-MLC',
    fallbackId: 'Qwen2.5-7B-Instruct-q4f32_1-MLC',
    displayName: 'Qwen2.5 7B',
    params: '7B',
    runtime: 'webllm',
    tier: 'ultra',
    estimatedVRAM: '4GB+',
    description: 'Powerful model with deep reasoning. Best for desktops with discrete GPUs.',
  },
  {
    id: 'Phi-3.5-mini-instruct-q4f16_1-MLC',
    fallbackId: 'Phi-3.5-mini-instruct-q4f32_1-MLC',
    displayName: 'Phi-3.5 Mini',
    params: '3.8B',
    runtime: 'webllm',
    tier: 'high',
    estimatedVRAM: '2.5GB+',
    description: "Microsoft's model tuned for reasoning tasks. Great for powerful laptops.",
  },
  {
    id: 'gemma-2-2b-it-q4f16_1-MLC',
    fallbackId: 'gemma-2-2b-it-q4f32_1-MLC',
    displayName: 'Gemma-2 2B',
    params: '2B',
    runtime: 'webllm',
    tier: 'medium',
    estimatedVRAM: '1.5GB+',
    description: "Google's lightweight workhorse. Excellent balance of speed and quality.",
  },
  {
    id: 'Qwen2.5-0.5B-Instruct-q4f16_1-MLC',
    fallbackId: 'Qwen2.5-0.5B-Instruct-q4f32_1-MLC',
    displayName: 'Qwen2.5 0.5B',
    params: '0.5B',
    runtime: 'webllm',
    tier: 'low',
    estimatedVRAM: '0.5GB+',
    description: 'Very tiny model for constrained devices.',
  },
  {
    id: 'Xenova/SmolLM2-360M-Instruct',
    displayName: 'SmolLM2 360M (CPU)',
    params: '360M',
    runtime: 'transformers',
    tier: 'cpu',
    estimatedVRAM: 'CPU RAM',
    description: 'Runs on CPU. Much slower, but works without WebGPU.',
  },
];

export const VISION_MODELS = {
  default: {
    id: 'Xenova/SmolVLM-256M-Instruct',
    displayName: 'SmolVLM 256M',
    description: 'Fast, lightweight image understanding.',
  },
  advanced: {
    id: 'Xenova/Florence-2-base',
    displayName: 'Florence-2 Base',
    description: 'Better for complex OCR and document scanning.',
  },
};

export const EMBEDDING_MODEL = {
  id: 'Xenova/all-MiniLM-L6-v2',
  displayName: 'all-MiniLM-L6-v2',
};

const tierRank: Record<GPUTier, number> = {
  cpu: 0,
  low: 1,
  medium: 2,
  high: 3,
  ultra: 4,
};

// Returns the f16 model id if the GPU supports it, otherwise the f32 fallback.
export function resolveModelId(model: ModelConfig, capabilities: GPUCapabilities): string {
  if (!capabilities.supportsF16 && model.fallbackId) {
    return model.fallbackId;
  }
  return model.id;
}

export function getRecommendedModel(capabilities: GPUCapabilities): ModelConfig {
  const targetTier = capabilities.recommendedTier;
  const targetRank = tierRank[targetTier];

  const recommended = TEXT_MODELS.find(m => tierRank[m.tier] <= targetRank);
  return recommended || TEXT_MODELS[TEXT_MODELS.length - 1];
}

export function getAvailableModels(capabilities: GPUCapabilities): ModelConfig[] {
  const targetRank = tierRank[capabilities.recommendedTier];
  return TEXT_MODELS.filter(m => tierRank[m.tier] <= targetRank);
}