/**
 * Работа с API-ключом Google AI Studio: валидация формата и маскирование.
 * Модуль не зависит от DOM.
 */

/** Новый формат (Auth Keys, привязаны к сервисному аккаунту): "AQ.…" */
const AUTH_KEY_RE = /^AQ\.[0-9A-Za-z\-_.]{20,200}$/;
/** Устаревший формат: "AIza…" (39 символов). */
const LEGACY_KEY_RE = /^AIza[0-9A-Za-z\-_]{35}$/;

export const KEY_FORMAT_HINT =
  'Формат: <span class="font-mono">AQ.…</span> (новые ключи) или <span class="font-mono">AIza…</span> (старые).';

/** Убирает пробелы/переводы строк, которые часто попадают при копировании. */
export function normalizeKey(raw) {
  return String(raw ?? '').replace(/\s+/g, '');
}

export function getKeyType(key) {
  if (AUTH_KEY_RE.test(key)) return 'auth_key';
  if (LEGACY_KEY_RE.test(key)) return 'legacy_api_key';
  return null;
}

export function isKeyFormatValid(key) {
  return getKeyType(key) !== null;
}

/** "AQ.Ab12…wxyz" — ключ никогда не выводится в UI целиком. */
export function maskKey(key) {
  if (!key) return '—';
  const head = key.startsWith('AQ.') ? 5 : 6;
  return `${key.slice(0, head)}…${key.slice(-4)}`;
}
