import { test } from 'node:test';
import assert from 'node:assert/strict';

import { isKeyFormatValid, getKeyType, maskKey, normalizeKey } from '../assets/js/keys.js';
import { resolveModelId, isValidModelId } from '../assets/js/models.js';
import { createVault } from '../assets/js/storage.js';
import { buildContents, routeAgentRequest, verifyApiKey } from '../assets/js/gemini.js';

const AUTH_KEY = 'AQ.Ab8RN6KxyzABCDEFGHIJ_klmnop-qrstuv';
const LEGACY_KEY = 'AIza' + 'A'.repeat(35);

/* ---------- keys ---------- */
test('форматы ключей: новый AQ. и устаревший AIza', () => {
  assert.equal(getKeyType(AUTH_KEY), 'auth_key');
  assert.equal(getKeyType(LEGACY_KEY), 'legacy_api_key');
  for (const bad of ['', 'AQ.A', 'AIzaShort', 'sk-123', 'AQ.<script>alert(1)</script>xxxxxxxx']) {
    assert.equal(isKeyFormatValid(bad), false, bad);
  }
  assert.equal(normalizeKey(' AQ.abc \n'), 'AQ.abc');
  assert.equal(maskKey(AUTH_KEY), 'AQ.Ab…stuv');
  assert.ok(!maskKey(LEGACY_KEY).includes('A'.repeat(10)));
});

/* ---------- model resolution ---------- */
test('resolveModelId: override → spec → auto → default', () => {
  assert.deepEqual(resolveModelId('Gemini 3.5', { overrides: { 'Gemini 3.5': 'gemini-2.5-flash' } }), { id: 'gemini-2.5-flash', source: 'override' });
  assert.deepEqual(resolveModelId('Gemini 3.5', { overrides: { 'Gemini 3.5': '../../evil' } }), { id: 'gemini-3.5-flash', source: 'default' });
  assert.deepEqual(resolveModelId('Gemini 3.5', { available: ['gemini-3.5-flash'] }), { id: 'gemini-3.5-flash', source: 'spec' });

  const available = ['gemini-2.0-flash', 'gemini-2.5-flash', 'gemini-2.5-flash-lite', 'gemini-2.5-pro', 'gemini-2.5-flash-preview-tts', 'text-embedding-004'];
  assert.deepEqual(resolveModelId('Gemini 3.5', { available }), { id: 'gemini-2.5-flash', source: 'auto' });
  assert.deepEqual(resolveModelId('Gemini 3.5', { available: ['text-embedding-004'] }), { id: 'gemini-3.5-flash', source: 'default' });
});

test('isValidModelId отклоняет path traversal и спецсимволы', () => {
  assert.ok(isValidModelId('gemini-2.5-flash'));
  for (const bad of ['', '../x', 'a/b', 'x:generateContent?key=1', 'gemini 2.5']) assert.equal(isValidModelId(bad), false, bad);
});

/* ---------- storage ---------- */
function fakeStorage() {
  const m = new Map();
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k), _m: m };
}

test('vault: ключ в sessionStorage по умолчанию и в localStorage только при remember', () => {
  const local = fakeStorage();
  const session = fakeStorage();
  const v = createVault({ local, session });
  v.setApiKey(AUTH_KEY, { remember: false });
  assert.equal(v.getApiKey(), AUTH_KEY);
  assert.equal(v.isKeyRemembered(), false);
  assert.equal(local._m.size, 0);

  v.setApiKey(AUTH_KEY, { remember: true });
  assert.equal(v.isKeyRemembered(), true);
  assert.equal(session._m.size, 0);

  v.clearApiKey();
  assert.equal(v.getApiKey(), null);
});

/* ---------- contents builder ---------- */
test('buildContents: история начинается с user, изображения только в последнем сообщении', () => {
  const img = { mimeType: 'image/png', data: 'AAAA' };
  const contents = buildContents([
    { role: 'model', content: 'orphan' },
    { role: 'user', content: 'old', attachments: [img] },
    { role: 'model', content: 'ok' },
    { role: 'user', content: 'new', attachments: [img] },
  ]);
  assert.equal(contents[0].role, 'user');
  assert.equal(contents.length, 3);
  assert.ok(!contents[0].parts.some((p) => p.inlineData), 'старое изображение не должно отправляться повторно');
  assert.ok(contents[2].parts.some((p) => p.inlineData));
});

/* ---------- router with mocked fetch ---------- */
function mockFetch(payload, status = 200, capture = {}) {
  return async (url, init) => {
    capture.url = url;
    capture.init = init;
    return { ok: status >= 200 && status < 300, status, json: async () => payload };
  };
}
const geminiReply = (text, finishReason = 'STOP') => ({
  candidates: [{ content: { parts: [{ text }] }, finishReason }],
  usageMetadata: { promptTokenCount: 10, candidatesTokenCount: 5, totalTokenCount: 15 },
});
const baseRequest = {
  model: 'Gemini 3.5', domain: 'Game Dev', apiKey: AUTH_KEY,
  messages: [{ role: 'user', content: 'Напиши формулу Fresnel rim-свечения для HLSL шейдера.' }],
};

test('router: успешный ответ соответствует контракту 1.5, ключ — в заголовке', async () => {
  const cap = {};
  const res = await routeAgentRequest(baseRequest, { modelId: 'gemini-2.5-flash', fetchImpl: mockFetch(geminiReply('float rim = pow(1 - saturate(dot(N, V)), 4);'), 200, cap) });
  assert.equal(res.status, 'success');
  assert.equal(res.modelUsed, 'Gemini 3.5');
  assert.equal(res.domain, 'Game Dev');
  assert.deepEqual(res.usage, { promptTokens: 10, completionTokens: 5, totalTokens: 15 });

  assert.ok(!cap.url.includes(AUTH_KEY), 'ключ не должен попадать в URL');
  assert.equal(cap.init.headers['x-goog-api-key'], AUTH_KEY);
  const body = JSON.parse(cap.init.body);
  assert.equal(body.generationConfig.temperature, 0.3);
  assert.equal(body.generationConfig.maxOutputTokens, 4096);
  assert.ok(body.systemInstruction.parts[0].text.includes('[OFF_TOPIC]'));
});

test('router: маркер OFF_TOPIC → status off_topic с фиксированным отказом', async () => {
  const res = await routeAgentRequest(baseRequest, { modelId: 'x', fetchImpl: mockFetch(geminiReply('[OFF_TOPIC]')) });
  assert.equal(res.status, 'off_topic');
  assert.match(res.reply, /только на вопросы по 3D/);
});

test('router: thought-части не попадают в ответ', async () => {
  const payload = geminiReply('ответ');
  payload.candidates[0].content.parts.unshift({ text: 'secret reasoning', thought: true });
  const res = await routeAgentRequest(baseRequest, { modelId: 'x', fetchImpl: mockFetch(payload) });
  assert.equal(res.reply, 'ответ');
});

test('router: ошибки HTTP, сеть и отмена', async () => {
  const e404 = await routeAgentRequest(baseRequest, { modelId: 'nope', fetchImpl: mockFetch({ error: { message: 'not found' } }, 404) });
  assert.equal(e404.status, 'error');
  assert.equal(e404.httpStatus, 404);
  assert.match(e404.reply, /Дополнительно/);

  const net = await routeAgentRequest(baseRequest, { modelId: 'x', fetchImpl: async () => { throw new TypeError('Failed to fetch'); } });
  assert.equal(net.status, 'error');

  const ctrl = new AbortController();
  const hanging = (url, init) => new Promise((_, reject) => init.signal.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError'))));
  const p = routeAgentRequest(baseRequest, { modelId: 'x', signal: ctrl.signal, fetchImpl: hanging });
  ctrl.abort();
  assert.equal((await p).status, 'aborted');
});

test('verifyApiKey: 200 → список generateContent-моделей, 403 → ошибка', async () => {
  const ok = await verifyApiKey(AUTH_KEY, { fetchImpl: mockFetch({ models: [
    { name: 'models/gemini-2.5-flash', supportedGenerationMethods: ['generateContent'] },
    { name: 'models/text-embedding-004', supportedGenerationMethods: ['embedContent'] },
  ] }) });
  assert.deepEqual(ok, { ok: true, models: ['gemini-2.5-flash'] });

  const bad = await verifyApiKey(AUTH_KEY, { fetchImpl: mockFetch({ error: { message: 'API key not valid' } }, 403) });
  assert.equal(bad.ok, false);
  assert.equal(bad.status, 403);
});
