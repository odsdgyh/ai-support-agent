/**
 * Сопоставление «маркетинговой» версии (Gemini 3.5 / 3.6 / 3.8) с реальным ID модели.
 *
 * Порядок выбора:
 *  1. Ручное переопределение пользователя (если ID валиден).
 *  2. ID из спецификации, если он есть в списке доступных моделей ключа.
 *  3. Автоподбор: самая новая доступная модель того же семейства (flash / pro).
 *  4. ID из спецификации (если список моделей неизвестен).
 */
import { MODELS } from './config.js';

const MODEL_ID_RE = /^[a-z0-9][a-z0-9.\-]{1,80}$/i;
const NON_CHAT_RE = /(tts|image|embed|live|audio|aqa|imagen|veo|learnlm|gemma|robotics|computer-use|native|thinking-exp)/i;

export function isValidModelId(id) {
  return MODEL_ID_RE.test(String(id ?? ''));
}

export function parseGeminiId(id) {
  const m = /^gemini-(\d+(?:\.\d+)?)-(pro|flash|ultra)(-lite)?(.*)$/i.exec(id);
  if (!m || NON_CHAT_RE.test(id)) return null;
  return {
    id,
    version: parseFloat(m[1]),
    family: m[2].toLowerCase() === 'ultra' ? 'pro' : m[2].toLowerCase(),
    lite: Boolean(m[3]),
    preview: /preview|exp/i.test(m[4]),
  };
}

function score(p) {
  return p.version * 100 - (p.lite ? 50 : 0) - (p.preview ? 5 : 0);
}

/**
 * @param {string} name — ключ MODELS, например "Gemini 3.8"
 * @param {{ overrides?: Record<string,string>, available?: string[] }} ctx
 * @returns {{ id: string, source: 'override' | 'spec' | 'auto' | 'default' }}
 */
export function resolveModelId(name, { overrides = {}, available = [] } = {}) {
  const cfg = MODELS[name];
  if (!cfg) throw new Error(`Unknown model: ${name}`);

  const override = overrides[name]?.trim();
  if (override && isValidModelId(override)) return { id: override, source: 'override' };

  if (!available.length) return { id: cfg.id, source: 'default' };
  if (available.includes(cfg.id)) return { id: cfg.id, source: 'spec' };

  const candidates = available.map(parseGeminiId).filter(Boolean);
  const sameFamily = candidates.filter((c) => c.family === cfg.family);
  const pool = sameFamily.length ? sameFamily : candidates;
  if (!pool.length) return { id: cfg.id, source: 'default' };

  pool.sort((a, b) => score(b) - score(a));
  return { id: pool[0].id, source: 'auto' };
}
