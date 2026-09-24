export interface ModelOption {
  id: string;
  name: string;
  shortName: string;
  provider: string;
  desc: string;
  badge?: string;
  isFree?: boolean;
}

export const BACKEND_SUPPORTED_MODELS: ModelOption[] = [
  {
    id: 'openrouter/free',
    name: 'OpenRouter Free (Auto)',
    shortName: 'Free Auto',
    provider: 'OpenRouter',
    desc: 'Auto-routes dynamically to the best available free model on OpenRouter',
    badge: 'Recommended',
    isFree: true,
  },
  {
    id: 'poolside/laguna-s-2.1:free',
    name: 'Poolside Laguna S 2.1',
    shortName: 'Laguna S 2.1',
    provider: 'Poolside',
    desc: 'Ultra-fast specialized coding and reasoning model',
    badge: 'Fast',
    isFree: true,
  },
  {
    id: 'inclusionai/ling-3.0-flash-fin:free',
    name: 'InclusionAI Ling 3.0 Flash Fin',
    shortName: 'Ling 3.0 Flash Fin',
    provider: 'InclusionAI',
    desc: 'Fine-tuned variant optimized for structured queries and financial/domain logic',
    badge: 'Specialized',
    isFree: true,
  },
  {
    id: 'dots-studio/dots-3-note-preview:free',
    name: 'Dots Studio 3 Note Preview',
    shortName: 'Dots 3 Note',
    provider: 'Dots Studio',
    desc: 'Fine-grained analytical, note-taking, and synthesis engine',
    badge: 'Preview',
    isFree: true,
  },
  {
    id: 'nvidia/nemotron-3.5-lightning:free',
    name: 'NVIDIA Nemotron 3.5 Lightning',
    shortName: 'Nemotron 3.5',
    provider: 'NVIDIA',
    desc: 'Accelerated enterprise-grade alignment and reasoning from NVIDIA',
    badge: 'Lightning',
    isFree: true,
  },
];

export const DEFAULT_MODEL_ID = 'openrouter/free';

export function getModelInfo(modelId?: string): ModelOption {
  if (!modelId) return BACKEND_SUPPORTED_MODELS[0];
  const found = BACKEND_SUPPORTED_MODELS.find((m) => m.id === modelId);
  if (found) return found;

  // Fallback for custom or previously stored models
  return {
    id: modelId,
    name: modelId.split('/').pop() || modelId,
    shortName: (modelId.split('/').pop() || modelId).replace(':free', ''),
    provider: modelId.split('/')[0] || 'Custom',
    desc: `Model identifier: ${modelId}`,
  };
}
