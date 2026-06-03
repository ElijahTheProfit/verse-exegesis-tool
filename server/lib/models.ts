// The only models the public proxy will call, and the per-feature defaults.
// Clients pick a model per feature in Settings; the server validates against this list
// so the open endpoint can't be coerced into calling an arbitrary/expensive model.

export const ALLOWED_MODELS = ['gpt-5.5', 'gpt-5.4-mini', 'gpt-5.4-nano'] as const;
export type ModelId = (typeof ALLOWED_MODELS)[number];

export type AiFeature = 'search' | 'align' | 'etymology';

export const DEFAULT_MODELS: Record<AiFeature, ModelId> = {
  search: 'gpt-5.5',
  align: 'gpt-5.4-mini',
  etymology: 'gpt-5.4-mini',
};

export function isAllowedModel(m: unknown): m is ModelId {
  return typeof m === 'string' && (ALLOWED_MODELS as readonly string[]).includes(m);
}

/** Use the requested model if allowed, otherwise the feature default. */
export function resolveModel(requested: unknown, feature: AiFeature): ModelId {
  return isAllowedModel(requested) ? requested : DEFAULT_MODELS[feature];
}
