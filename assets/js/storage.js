/**
 * Хранилище профиля и ключа (BYOK Vault).
 *
 * - Профиль и настройки — localStorage.
 * - API-ключ — localStorage ТОЛЬКО при явном согласии «Запомнить ключ»,
 *   иначе sessionStorage (очищается при закрытии вкладки).
 * Ключ хранится в профиле отдельно от данных пользователя; в объекте профиля
 * лежат только метаданные (keyPrefix, keyType, isVerified).
 */
import { STORAGE_KEYS } from './config.js';

const memory = new Map();
const memoryStorage = {
  getItem: (k) => (memory.has(k) ? memory.get(k) : null),
  setItem: (k, v) => memory.set(k, String(v)),
  removeItem: (k) => memory.delete(k),
};

function safeStorage(getter) {
  try {
    const s = getter();
    const probe = '__polyassist_probe__';
    s.setItem(probe, '1');
    s.removeItem(probe);
    return s;
  } catch {
    return memoryStorage; // приватный режим / storage отключён
  }
}

export function createVault({
  local = safeStorage(() => globalThis.localStorage),
  session = safeStorage(() => globalThis.sessionStorage),
} = {}) {
  const read = (storage, key, fallback) => {
    try {
      const v = storage.getItem(key);
      return v === null ? fallback : JSON.parse(v);
    } catch {
      return fallback;
    }
  };
  const write = (storage, key, value) => {
    try {
      storage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.warn('[PolyAssist] Не удалось сохранить данные', e);
    }
  };

  return {
    get: (key, fallback = null) => read(local, key, fallback),
    set: (key, value) => write(local, key, value),
    remove: (key) => local.removeItem(key),

    getApiKey() {
      const v = read(local, STORAGE_KEYS.key, null) ?? read(session, STORAGE_KEYS.key, null);
      return typeof v === 'string' && v ? v : null;
    },
    isKeyRemembered() {
      return typeof read(local, STORAGE_KEYS.key, null) === 'string';
    },
    setApiKey(key, { remember }) {
      local.removeItem(STORAGE_KEYS.key);
      session.removeItem(STORAGE_KEYS.key);
      write(remember ? local : session, STORAGE_KEYS.key, key);
    },
    clearApiKey() {
      local.removeItem(STORAGE_KEYS.key);
      session.removeItem(STORAGE_KEYS.key);
    },
  };
}
