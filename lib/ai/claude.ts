import 'server-only';
import Anthropic from '@anthropic-ai/sdk';

/**
 * One place that knows how to ask Claude for a reply, for the website
 * assistant and the WhatsApp assistant alike.
 *
 * The owner picks a tier in the console. Economy is the default because the
 * work — answering from a fixed reference, collecting details, booking a
 * call — does not need a frontier model, and Haiku 4.5 costs a fraction of
 * one. The tiers differ in API surface too: the newer models think adaptively
 * with an `effort` dial and support server-side refusal fallbacks; Haiku 4.5
 * takes neither, so those fields are only sent where they are accepted.
 */

export type Tier = 'economy' | 'balanced' | 'best';

export const TIER_MODEL: Record<Tier, string> = {
  economy: 'claude-haiku-4-5',
  balanced: 'claude-sonnet-5-5',
  best: 'claude-opus-5-5',
};

export const TIER_LABEL: Record<Tier, string> = {
  economy: 'Economy — Claude Haiku 4.5 (lowest cost, recommended)',
  balanced: 'Balanced — Claude Sonnet 5.5',
  best: 'Best — Claude Opus 5.5 (highest cost)',
};

export function modelFor(tier: Tier | undefined): string {
  return process.env.ASSISTANT_MODEL || TIER_MODEL[tier ?? 'economy'] || TIER_MODEL.economy;
}

const isHaiku = (model: string) => model.startsWith('claude-haiku');

/** Request fields that depend on the model. */
export function shapeFor(
  model: string,
  effort: 'low' | 'medium',
): Pick<Anthropic.Beta.MessageCreateParams, 'betas' | 'fallbacks' | 'thinking' | 'output_config'> {
  if (isHaiku(model)) return {};
  return {
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    thinking: { type: 'adaptive' },
    output_config: { effort },
  };
}

let shared: Anthropic | null = null;
export function anthropic(): Anthropic {
  shared ??= new Anthropic();
  return shared;
}

export type Usage = { input: number; output: number; cached: number };

export function addUsage(u: Usage, m: Anthropic.Beta.BetaMessage): Usage {
  return {
    input: u.input + (m.usage.input_tokens ?? 0),
    output: u.output + (m.usage.output_tokens ?? 0),
    cached: u.cached + (m.usage.cache_read_input_tokens ?? 0),
  };
}

export const textOf = (m: Anthropic.Beta.BetaMessage): string =>
  m.content
    .filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === 'text')
    .map((b) => b.text)
    .join('')
    .trim();
