/**
 * Клиент Google AI Studio (Generative Language API) и маршрутизатор агента.
 *
 * Контракт (Tech Spec 1.5):
 *   request:  { model, domain, apiKey, messages: [{ role, content, attachments }] }
 *   response: { status, modelUsed, domain, reply, usage: { promptTokens, completionTokens, totalTokens } }
 * Расширения: status ∈ 'success' | 'off_topic' | 'error' | 'aborted', а также modelId, httpStatus.
 *
 * Модуль не зависит от DOM; fetch можно подменить для тестов.
 */
import { API_BASE, MODELS, DOMAINS, LIMITS } from './config.js';
import { buildSystemInstruction, parseModelReply } from './guardrail.js';

/** Низкоуровневый запрос с таймаутом и поддержкой внешней отмены. */
async function callApi(path, { apiKey, method = 'GET', body, signal, timeoutMs, fetchImpl = globalThis.fetch }) {
  const controller = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);
  const forwardAbort = () => controller.abort();
  signal?.addEventListener('abort', forwardAbort, { once: true });

  try {
    const res = await fetchImpl(`${API_BASE}/${path}`, {
      method,
      headers: {
        // Ключ передаётся в заголовке, а не в URL: не попадает в логи прокси и историю.
        'x-goog-api-key': apiKey,
        ...(body ? { 'Content-Type': 'application/json' } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
      credentials: 'omit',
      cache: 'no-store',
    });
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok, status: res.status, data };
  } catch (err) {
    if (timedOut) return { ok: false, status: 0, kind: 'timeout', data: {} };
    if (signal?.aborted) return { ok: false, status: 0, kind: 'aborted', data: {} };
    return { ok: false, status: 0, kind: 'network', data: {}, error: err };
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', forwardAbort);
  }
}

const apiMessage = (r) => r.data?.error?.message || (r.status ? `HTTP ${r.status}` : 'нет ответа');

/**
 * Проверка ключа запросом models.list (Tech Spec 1.4, шаг 2).
 * @returns {Promise<{ ok: boolean, models?: string[], status?: number, network?: boolean, message?: string }>}
 */
export async function verifyApiKey(apiKey, { fetchImpl } = {}) {
  const models = [];
  let pageToken = '';
  for (let page = 0; page < 5; page++) {
    const q = `models?pageSize=200${pageToken ? `&pageToken=${encodeURIComponent(pageToken)}` : ''}`;
    const r = await callApi(q, { apiKey, timeoutMs: LIMITS.verifyTimeoutMs, fetchImpl });
    if (!r.ok) {
      if (r.kind === 'network' || r.kind === 'timeout') {
        return { ok: false, network: true, message: 'Сеть недоступна или Google не ответил. Проверьте соединение.' };
      }
      if ([400, 401, 403].includes(r.status)) {
        return { ok: false, status: r.status, message: `Ключ отклонён Google: ${apiMessage(r)}` };
      }
      return { ok: false, status: r.status, message: `Ошибка проверки (${r.status}): ${apiMessage(r)}` };
    }
    for (const m of r.data.models || []) {
      if ((m.supportedGenerationMethods || []).includes('generateContent')) {
        models.push(String(m.name).replace(/^models\//, ''));
      }
    }
    pageToken = r.data.nextPageToken;
    if (!pageToken) break;
  }
  return { ok: true, models };
}

/**
 * Преобразует историю чата в contents для Gemini:
 * - первая реплика всегда от пользователя;
 * - изображения (inlineData) отправляются только для последнего сообщения,
 *   в более старых заменяются текстовой пометкой — экономия трафика и токенов.
 */
export function buildContents(messages) {
  const list = messages.slice(-LIMITS.maxHistoryMessages);
  while (list.length && list[0].role !== 'user') list.shift();

  return list.map((m, i) => {
    const isLast = i === list.length - 1;
    const parts = [];
    const atts = m.attachments || [];
    if (atts.length) {
      if (isLast) atts.forEach((a) => parts.push({ inlineData: { mimeType: a.mimeType, data: a.data } }));
      else parts.push({ text: `[пользователь прикрепил изображений: ${atts.length}]` });
    }
    if (m.content) parts.push({ text: m.content });
    return { role: m.role === 'user' ? 'user' : 'model', parts };
  });
}

function errorHint(status, modelId) {
  if (status === 404) return `\n\nМодель \`${modelId}\` недоступна для вашего ключа. Откройте **Профиль → Дополнительно** и оставьте поле пустым (автоподбор) или укажите доступный ID.`;
  if ([400, 401, 403].includes(status)) return '\n\nПроверьте, что ключ действителен и для проекта включён Generative Language API.';
  if (status === 429) return '\n\nПревышена квота запросов. Подождите немного и повторите попытку.';
  if (status >= 500) return '\n\nСервис Google временно недоступен. Повторите запрос позже.';
  return '';
}

/**
 * Маршрутизатор агента: системный промпт дисциплины + generationConfig модели → Gemini.
 * @param {object} request — контракт 1.5
 * @param {{ modelId: string, signal?: AbortSignal, fetchImpl?: Function }} options
 */
export async function routeAgentRequest(request, { modelId, signal, fetchImpl } = {}) {
  const base = { modelUsed: request.model, domain: request.domain, modelId, usage: null };
  const cfg = MODELS[request.model];
  if (!cfg || !DOMAINS[request.domain]) {
    return { ...base, status: 'error', reply: 'Неизвестная модель или специализация.' };
  }

  const body = {
    systemInstruction: { parts: [{ text: buildSystemInstruction(request.domain) }] },
    contents: buildContents(request.messages),
    generationConfig: { temperature: cfg.temperature, maxOutputTokens: cfg.maxOutputTokens },
  };

  const r = await callApi(`models/${encodeURIComponent(modelId)}:generateContent`, {
    apiKey: request.apiKey,
    method: 'POST',
    body,
    signal,
    timeoutMs: LIMITS.requestTimeoutMs,
    fetchImpl,
  });

  if (r.kind === 'aborted') return { ...base, status: 'aborted', reply: '_Запрос остановлен._' };
  if (r.kind === 'timeout') return { ...base, status: 'error', reply: `**Таймаут:** модель не ответила за ${LIMITS.requestTimeoutMs / 1000} с. Попробуйте ещё раз или выберите более быструю модель.` };
  if (r.kind === 'network') return { ...base, status: 'error', reply: 'Не удалось связаться с Google AI Studio. Проверьте интернет-соединение.' };
  if (!r.ok) {
    return { ...base, status: 'error', httpStatus: r.status, reply: `**Ошибка ${r.status}:** ${apiMessage(r)}${errorHint(r.status, modelId)}` };
  }

  const data = r.data;
  const cand = data.candidates?.[0];
  const um = data.usageMetadata || {};
  const usage = {
    promptTokens: um.promptTokenCount || 0,
    completionTokens: um.candidatesTokenCount || 0,
    totalTokens: um.totalTokenCount || 0,
  };
  // Части с thought=true — «размышления» модели, пользователю не показываем.
  const text = (cand?.content?.parts || []).filter((p) => p.text && !p.thought).map((p) => p.text).join('');

  if (!text) {
    const reason = cand?.finishReason || data.promptFeedback?.blockReason || 'UNKNOWN';
    const hint = reason === 'MAX_TOKENS'
      ? ' Лимит токенов исчерпан на этапе рассуждений — переформулируйте вопрос короче.'
      : '';
    return { ...base, status: 'error', usage, reply: `_Модель вернула пустой ответ (причина: \`${reason}\`).${hint}_` };
  }

  const parsed = parseModelReply(text);
  if (parsed.offTopic) return { ...base, status: 'off_topic', usage, reply: parsed.text };

  let reply = parsed.text;
  if (cand?.finishReason === 'MAX_TOKENS') {
    reply += `\n\n_Ответ обрезан лимитом maxOutputTokens (${cfg.maxOutputTokens}). Попросите продолжить с места остановки._`;
  }
  return { ...base, status: 'success', usage, reply };
}
