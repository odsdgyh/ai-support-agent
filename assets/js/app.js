/**
 * PolyAssist AI — точка входа UI (Brutalism Website Style + Light / Dark Theme + RU / EN i18n).
 * Связывает DOM с чистыми модулями: config, i18n, guardrail, gemini, models, keys, storage, markdown.
 */
import {
  DOMAINS, DEFAULT_MODEL, DEFAULT_DOMAIN, STORAGE_KEYS as K, LIMITS, ALLOWED_IMAGE_TYPES,
} from './config.js';
import { I18N } from './i18n.js';
import { routeAgentRequest, verifyApiKey } from './gemini.js';
import { validateUserInput } from './guardrail.js';
import { resolveModelId, isValidModelId } from './models.js';
import { normalizeKey, isKeyFormatValid, getKeyType, maskKey } from './keys.js';
import { createVault } from './storage.js';
import { renderMarkdown, escapeHtml } from './markdown.js';
import { initViewport } from './viewport.js';

/* ================================================================
   DOM helpers
   ================================================================ */
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

function h(tag, props = {}, children = []) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (k === 'class') node.className = v;
    else if (k === 'text') node.textContent = v;
    else if (k === 'html') node.innerHTML = v; // только для заранее экранированного HTML
    else node.setAttribute(k, v);
  }
  for (const c of [].concat(children)) if (c) node.append(c);
  return node;
}

let toastTimer;
function toast(message, tone = 'info') {
  const el = $('#toast');
  if (!el) return;
  el.textContent = message;
  el.classList.remove('hidden');
  el.style.backgroundColor = {
    error: 'var(--brutal-accent)',
    ok: 'var(--status-ok)',
  }[tone] || 'var(--highlight)';
  el.style.color = tone === 'error' ? '#FFFFFF' : '#0D0D0D';
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.add('hidden'), 3200);
}

/* ================================================================
   State
   ================================================================ */
const vault = createVault();

const savedUser = vault.get(K.user);
const savedTheme = vault.get(K.theme);
const savedLang = vault.get(K.lang);

const state = {
  user: savedUser && typeof savedUser === 'object' ? savedUser : null,
  apiKey: vault.getApiKey(),
  model: DEFAULT_MODEL,
  domain: DOMAINS[savedUser?.defaultDomain] ? savedUser.defaultDomain : DEFAULT_DOMAIN,
  available: (vault.get(K.availableModels, []) || []).filter(isValidModelId),
  theme: savedTheme === 'dark' || savedTheme === 'light' ? savedTheme : 'light',
  lang: savedLang === 'en' || savedLang === 'ru' ? savedLang : 'ru',
  history: [],       // [{ role: 'user' | 'model', content, attachments? }] — только релевантные ходы
  attachments: [],   // [{ name, mimeType, data, url }]
  sessionTokens: 0,
  controller: null,  // AbortController текущего запроса
};

const t = () => I18N[state.lang] || I18N.ru;
const fmt = (n) => Number(n || 0).toLocaleString(state.lang === 'en' ? 'en-US' : 'ru-RU');

const currentModelId = (name = state.model) =>
  resolveModelId(name, { available: state.available });

function saveUser() {
  if (state.user) vault.set(K.user, state.user);
}

/* ================================================================
   Light / Dark Brutalism Theme Switcher
   ================================================================ */
function setTheme(theme, { persist = true } = {}) {
  const next = theme === 'dark' ? 'dark' : 'light';
  state.theme = next;
  document.documentElement.setAttribute('data-theme', next);
  const icon = $('#themeIcon');
  const label = $('#themeLabel');
  if (icon) icon.textContent = next === 'dark' ? '☾' : '☀';
  if (label) label.textContent = next === 'dark' ? 'DARK' : 'LIGHT';
  if (persist) vault.set(K.theme, next);
}

function toggleTheme() {
  setTheme(state.theme === 'dark' ? 'light' : 'dark');
  toast(state.theme === 'dark' ? t().toastThemeDark : t().toastThemeLight);
}

/* ================================================================
   Language Switcher (RU / EN)
   ================================================================ */
function setLang(lang, { persist = true } = {}) {
  const next = lang === 'en' ? 'en' : 'ru';
  state.lang = next;
  const dict = t();

  document.documentElement.lang = next;
  document.title = dict.metaTitle;
  const langLabel = $('#langLabel');
  if (langLabel) langLabel.textContent = next.toUpperCase();

  $$('[data-i18n]').forEach((el) => {
    const key = el.dataset.i18n;
    if (typeof dict[key] === 'string') el.textContent = dict[key];
  });
  $$('[data-i18n-html]').forEach((el) => {
    const key = el.dataset.i18nHtml;
    if (typeof dict[key] === 'string') el.innerHTML = dict[key];
  });

  const inputEl = $('#chatInput');
  if (inputEl) inputEl.placeholder = dict.inputPlaceholder;
  const attachLabel = $('#attachLabel');
  if (attachLabel) attachLabel.title = dict.attachTitle;
  const sendLabel = $('#sendBtnLabel');
  if (sendLabel) sendLabel.textContent = state.controller ? dict.stopBtn : dict.sendBtn;

  const d = DOMAINS[state.domain];
  if (d && $('#domainHint')) {
    $('#domainHint').textContent = next === 'en' ? d.hintEn : d.hint;
  }

  renderKeyStatus();
  if (state.history.length === 0) welcome();
  if (persist) vault.set(K.lang, next);
}

function toggleLang() {
  setLang(state.lang === 'ru' ? 'en' : 'ru');
  toast(t().toastLang);
}

/* ================================================================
   Domain switcher (System Prompt)
   ================================================================ */
function setDomain(name, { persist = true } = {}) {
  if (!DOMAINS[name]) return;
  state.domain = name;
  const d = DOMAINS[name];
  document.documentElement.style.setProperty('--accent', d.color);
  document.documentElement.style.setProperty('--accent-rgb', d.rgb);
  const select = $('#domainSelect');
  if (select) select.value = name;
  const hint = $('#domainHint');
  if (hint) hint.textContent = state.lang === 'en' ? d.hintEn : d.hint;
  const chatDomain = $('#chatDomainLabel');
  if (chatDomain) chatDomain.textContent = name;
  if (persist && state.user) {
    state.user.defaultDomain = name;
    saveUser();
  }
}

/* ================================================================
   Key status / profile badge
   ================================================================ */
function renderKeyStatus() {
  const dict = t();
  const connected = Boolean(state.apiKey);
  const verified = connected && state.user?.apiKeyConfig?.isVerified === true;

  const btn = $('#keyStatus');
  if (btn) {
    btn.className = `flex items-center gap-2 px-3 sm:px-4 b-border-l font-mono text-xs font-extrabold uppercase transition ${
      verified
        ? 'b-status-ok hover:opacity-90'
        : 'bg-[var(--highlight)] text-[var(--highlight-fg)] hover:opacity-90'
    }`;
  }
  const dot = $('#keyStatusDot');
  if (dot) {
    dot.className = `h-2.5 w-2.5 rounded-full border border-black ${
      verified ? 'bg-black' : 'bg-[var(--brutal-accent)] pulse-amber'
    }`;
  }
  const statusText = $('#keyStatusText');
  if (statusText) {
    statusText.textContent = verified ? dict.keyConnected : connected ? dict.keyNotVerified : dict.noKeyConnected;
  }
  const statusShort = $('#keyStatusTextShort');
  if (statusShort) {
    statusShort.textContent = verified ? dict.keyShortOk : dict.keyShortNo;
  }
  const headerCta = $('#headerCtaText');
  if (headerCta) {
    headerCta.textContent = connected ? dict.ctaProfile : dict.ctaConnectKey;
  }

  const title = $('#keyPanelTitle');
  if (title) {
    title.className = 'flex items-center gap-2 font-mono font-extrabold uppercase';
    title.replaceChildren(
      h('span', { class: `h-2.5 w-2.5 rounded-full border border-black ${verified ? 'bg-[var(--status-ok)]' : 'bg-[var(--brutal-accent)]'}` }),
      verified ? dict.keyPanelConnectedTitle : connected ? dict.keyPanelUnverifiedTitle : dict.keyPanelDisconnectedTitle,
    );
  }
  const where = vault.isKeyRemembered() ? dict.keyPanelRemembered : dict.keyPanelSession;
  const panelText = $('#keyPanelText');
  if (panelText) {
    panelText.replaceChildren(
      ...(connected
        ? [dict.keyPanelPrefix, h('span', { class: 'font-mono font-bold', text: maskKey(state.apiKey) }), ` ${where}.`]
        : [dict.keyPanelDisconnectedText]),
    );
  }
  const panelBtn = $('#keyPanelBtn');
  if (panelBtn) {
    panelBtn.textContent = connected ? dict.keyPanelBtnUpdate : dict.keyPanelBtnConnect;
  }

  const badge = $('#profileBadge');
  const show = Boolean(state.user?.username);
  if (badge) {
    badge.classList.toggle('hidden', !show);
    badge.classList.toggle('flex', show);
  }
  if (show) {
    $('#profileName').textContent = state.user.username;
    $('#profileAvatar').textContent =
      state.user.username.replace(/[^\p{L}\p{N}]/gu, '').slice(0, 2).toUpperCase() || 'PA';
    $('#profileKey').textContent = connected ? maskKey(state.apiKey) : dict.profileNoKey;
  }
}

/* ================================================================
   Chat rendering (Brutalism Bubbles)
   ================================================================ */
const chatLog = $('#chatLog');
const scrollChat = () => { chatLog.scrollTop = chatLog.scrollHeight; };

function addUserMessage(text, images = []) {
  const bubble = h('div', {
    class: 'msg-user-bubble px-4 py-2.5 text-sm whitespace-pre-wrap break-words',
    text,
  });
  const gallery = images.length
    ? h('div', { class: 'flex flex-wrap justify-end gap-2 mb-2' },
      images.map((src) => h('img', { src, alt: 'attachment', class: 'h-20 w-20 object-cover b-border-2' })))
    : null;
  chatLog.append(h('div', { class: 'flex justify-end' }, h('div', { class: 'max-w-[85%] sm:max-w-[75%]' }, [gallery, bubble])));
  scrollChat();
}

const TONES = {
  normal:   { icon: 'b-accent-box', body: 'msg-ai-bubble' },
  error:    { icon: 'b-accent-box', body: 'msg-error-bubble' },
  offtopic: { icon: 'bg-black text-[var(--highlight)]', body: 'msg-offtopic-bubble' },
};

/** @param {{ markdown?: string, safeHtml?: string, meta?: string, tone?: keyof TONES }} opts */
function addAssistantMessage({ markdown, safeHtml, meta = '', tone = 'normal' }) {
  const tTone = TONES[tone];
  const node = h('div', { class: 'flex gap-3' }, [
    h('div', {
      class: `h-8 w-8 shrink-0 grid place-items-center b-border-2 font-mono font-extrabold text-sm shadow-[2px_2px_0_var(--shadow)] ${tTone.icon}`,
      text: tone === 'offtopic' ? '⦸' : '✦',
    }),
    h('div', { class: 'min-w-0 flex-1' }, [
      h('div', { class: 'text-[11px] font-mono font-extrabold uppercase b-muted mb-1.5', text: meta }),
      h('div', {
        class: `msg-body ${tTone.body} px-4 py-3 text-sm leading-relaxed break-words`,
        html: safeHtml ?? renderMarkdown(markdown),
      }),
    ]),
  ]);
  chatLog.append(node);
  scrollChat();
  return node;
}

function welcome() {
  chatLog.replaceChildren();
  const dict = t();
  const name = state.user?.username ? escapeHtml(state.user.username) : '';
  addAssistantMessage({
    meta: dict.welcomeMeta,
    safeHtml: dict.welcomeHtml(name, escapeHtml(state.domain), Boolean(state.apiKey)),
  });
}

/* ================================================================
   Send flow
   ================================================================ */
const input = $('#chatInput');

function setBusy(busy) {
  const dict = t();
  $('#sendBtnLabel').textContent = busy ? dict.stopBtn : dict.sendBtn;
  $$('.quick-prompt').forEach((q) => { q.disabled = busy; });
}

function updateCounter() {
  $('#charCounter').textContent = fmt(input.value.length);
}

function autoGrow() {
  input.style.height = 'auto';
  input.style.height = `${Math.min(input.scrollHeight, 160)}px`;
}

async function sendMessage(rawText) {
  if (state.controller) return; // защита от двойной отправки
  const dict = t();

  const check = validateUserInput(rawText, { maxChars: LIMITS.maxInputChars, hasAttachments: state.attachments.length > 0 });
  if (!check.ok) {
    if (check.reason === 'too_long') toast(dict.toastTooLong(fmt(LIMITS.maxInputChars)), 'error');
    return;
  }
  const text = check.text;
  const atts = state.attachments.slice();

  addUserMessage(text || dict.screenshotFallback, atts.map((a) => a.url));
  clearAttachments();
  input.value = '';
  autoGrow();
  updateCounter();

  if (!state.apiKey) {
    addAssistantMessage({
      tone: 'error',
      meta: 'POLYASSIST // SYSTEM',
      safeHtml: dict.noKeyChatErrorHtml,
    });
    return;
  }

  const userMsg = {
    role: 'user',
    content: text || dict.screenshotPrompt,
    attachments: atts.map(({ mimeType, data }) => ({ mimeType, data })),
  };
  const { id: modelId } = currentModelId();
  const request = {
    model: state.model,
    domain: state.domain,
    apiKey: state.apiKey,
    messages: [...state.history, userMsg],
  };

  state.controller = new AbortController();
  setBusy(true);
  const pending = addAssistantMessage({
    meta: `POLYASSIST // ${state.domain}`,
    safeHtml: `<span class="inline-flex items-center gap-2 font-mono font-bold uppercase"><span class="caret">${escapeHtml(dict.analyzingLabel)}</span></span>`,
  });

  let response;
  try {
    response = await routeAgentRequest(request, { modelId, signal: state.controller.signal });
  } finally {
    pending.remove();
    state.controller = null;
    setBusy(false);
  }

  if (response.usage) {
    state.sessionTokens += response.usage.totalTokens;
    $('#sessionTokens').textContent = `${fmt(state.sessionTokens)} tokens`;
  }

  switch (response.status) {
    case 'success': {
      // В историю — только релевантные ходы; base64 вложений не храним.
      const stored = { ...userMsg, attachments: userMsg.attachments.map(() => ({ omitted: true })) };
      state.history = [...state.history, stored, { role: 'model', content: response.reply }].slice(-LIMITS.maxHistoryMessages);
      const u = response.usage;
      addAssistantMessage({
        markdown: response.reply,
        meta: `POLYASSIST // ${response.domain} · ${fmt(u.promptTokens)}→${fmt(u.completionTokens)} tok`,
      });
      break;
    }
    case 'off_topic':
      addAssistantMessage({
        tone: 'offtopic',
        markdown: dict.offTopicReply,
        meta: dict.offTopicMeta,
      });
      break;
    case 'aborted':
      addAssistantMessage({
        markdown: response.reply,
        meta: dict.abortedMeta,
      });
      break;
    default:
      addAssistantMessage({
        tone: 'error',
        markdown: response.reply,
        meta: dict.errorMeta,
      });
      if ([400, 401, 403].includes(response.httpStatus) && state.user?.apiKeyConfig) {
        state.user.apiKeyConfig.isVerified = false;
        saveUser();
        renderKeyStatus();
      }
  }
}

/* ================================================================
   Attachments
   ================================================================ */
function readAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(r.error);
    r.readAsDataURL(file);
  });
}

async function addAttachments(files) {
  const dict = t();
  const free = LIMITS.maxAttachments - state.attachments.length;
  if (files.length > free) toast(dict.toastMaxAttach(LIMITS.maxAttachments), 'error');
  for (const f of files.slice(0, Math.max(0, free))) {
    if (!ALLOWED_IMAGE_TYPES.includes(f.type)) { toast(dict.toastFileType(f.name), 'error'); continue; }
    if (f.size > LIMITS.maxAttachmentBytes) { toast(dict.toastFileSize(f.name, LIMITS.maxAttachmentBytes / 1048576), 'error'); continue; }
    try {
      const url = await readAsDataUrl(f);
      state.attachments.push({ name: f.name, mimeType: f.type, data: url.split(',')[1], url });
    } catch {
      toast(dict.toastFileReadErr(f.name), 'error');
    }
  }
  renderAttachments();
}

function renderAttachments() {
  const box = $('#attachPreview');
  box.replaceChildren(...state.attachments.map((a, i) => h('div', { class: 'relative' }, [
    h('img', { src: a.url, alt: a.name, class: 'h-14 w-14 object-cover b-border-2' }),
    h('button', {
      type: 'button', 'data-remove': String(i), 'aria-label': `Remove ${a.name}`,
      class: 'absolute -top-1.5 -right-1.5 h-5 w-5 b-accent-box border border-black font-mono font-extrabold text-[10px]',
      text: '✕',
    }),
  ])));
  const has = state.attachments.length > 0;
  box.classList.toggle('hidden', !has);
  box.classList.toggle('flex', has);
}

function clearAttachments() {
  state.attachments = [];
  renderAttachments();
}

/* ================================================================
   Modal (BYOK Vault)
   ================================================================ */
const modal = $('#apiKeyModal');
let lastFocus = null;

function setFeedback(html, tone = 'muted') {
  const el = $('#keyFeedback');
  if (!el) return;
  el.innerHTML = html; // вызывается только с константами или escapeHtml(...)
  el.className = `mt-2 text-xs min-h-[1rem] font-semibold ${{
    ok: 'text-[var(--status-ok)]',
    error: 'text-[var(--brutal-accent)]',
    warn: 'text-[var(--brutal-accent)]',
  }[tone] || 'b-muted'}`;
}

const defaultKeyHint = () =>
  (state.apiKey ? t().keySavedHint : t().keyFormatHint);

function openModal() {
  const dict = t();
  lastFocus = document.activeElement;
  $('#usernameInput').value = state.user?.username || '';
  $('#apiKeyInput').value = '';
  $('#apiKeyInput').type = 'password';
  $('#apiKeyInput').placeholder = state.apiKey ? dict.keySavedPlaceholder(maskKey(state.apiKey)) : 'AQ.Ab…';
  $('#rememberKeyInput').checked = state.apiKey ? vault.isKeyRemembered() : false;
  $('#removeKeyBtn').classList.toggle('hidden', !state.apiKey);
  setFeedback(defaultKeyHint());
  modal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
  $('#mobileMenu').classList.add('hidden');
  setTimeout(() => (state.user?.username ? $('#apiKeyInput') : $('#usernameInput')).focus(), 30);
}

function closeModal() {
  modal.classList.add('hidden');
  document.body.style.overflow = '';
  $('#apiKeyInput').value = ''; // не держим ключ в DOM дольше необходимого
  lastFocus?.focus?.();
}

const isModalOpen = () => !modal.classList.contains('hidden');

function trapFocus(e) {
  const focusable = $$('button, [href], input, select, textarea, summary', modal)
    .filter((el) => !el.disabled && el.offsetParent !== null);
  if (!focusable.length) return;
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
  else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
}

async function saveProfile(e) {
  e.preventDefault();
  const dict = t();
  const username = $('#usernameInput').value.trim().slice(0, 40);
  const newKey = normalizeKey($('#apiKeyInput').value);
  const remember = $('#rememberKeyInput').checked;

  if (!username) { $('#usernameInput').focus(); toast(dict.toastEnterNick, 'error'); return; }
  if (!newKey && !state.apiKey) { setFeedback(dict.keyEmptyErr, 'error'); $('#apiKeyInput').focus(); return; }
  if (newKey && !isKeyFormatValid(newKey)) {
    setFeedback(dict.keyFormatErr, 'error');
    return;
  }

  let apiKeyConfig = state.user?.apiKeyConfig;
  if (newKey) {
    const btn = $('#saveProfileBtn');
    btn.disabled = true;
    $('#saveProfileLabel').textContent = dict.modalCheckingBtn;
    setFeedback(dict.keyVerifyProgress);
    const result = await verifyApiKey(newKey);
    btn.disabled = false;
    $('#saveProfileLabel').textContent = dict.modalSaveBtn;

    if (!result.ok && !result.network) { setFeedback(escapeHtml(result.message), 'error'); return; }
    if (result.ok) {
      state.available = result.models.filter(isValidModelId);
      vault.set(K.availableModels, state.available);
    } else {
      toast(dict.toastNetSaved, 'error');
    }
    state.apiKey = newKey;
    apiKeyConfig = {
      provider: 'google_ai_studio',
      keyType: getKeyType(newKey),
      keyPrefix: maskKey(newKey).split('…')[0],
      isVerified: result.ok,
      lastVerifiedAt: result.ok ? new Date().toISOString() : null,
    };
  }
  if (state.apiKey) vault.setApiKey(state.apiKey, { remember });

  state.user = {
    userId: state.user?.userId || `usr_${crypto.randomUUID().slice(0, 8)}`,
    username,
    preferredModel: DEFAULT_MODEL,
    defaultDomain: state.domain,
    ...(apiKeyConfig ? { apiKeyConfig } : {}),
  };
  saveUser();
  renderKeyStatus();
  closeModal();
  welcome();
  toast(apiKeyConfig?.isVerified ? dict.toastProfileConnected : dict.toastProfileSaved, apiKeyConfig?.isVerified ? 'ok' : 'info');
}

function removeKey() {
  state.apiKey = null;
  vault.clearApiKey();
  if (state.user) {
    delete state.user.apiKeyConfig;
    saveUser();
  }
  renderKeyStatus();
  closeModal();
  welcome();
  toast(t().toastKeyRemoved);
}

/* ================================================================
   Event wiring
   ================================================================ */
function bindEvents() {
  // Делегирование: открытие/закрытие модалки, копирование кода
  document.addEventListener('click', (e) => {
    const target = e.target;
    if (target.closest('[data-open-modal]')) { e.preventDefault(); openModal(); return; }
    if (target.closest('[data-close-modal]')) { closeModal(); return; }
    const copyBtn = target.closest('.copy-btn');
    if (copyBtn) {
      const code = copyBtn.parentElement.querySelector('code').textContent;
      navigator.clipboard?.writeText(code).then(() => {
        copyBtn.textContent = 'copied ✓';
        setTimeout(() => { copyBtn.textContent = 'copy'; }, 1500);
      }).catch(() => toast(t().toastCopyErr, 'error'));
    }
  });

  document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      if (isModalOpen()) closeModal();
      else openModal();
      return;
    }
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'j') {
      e.preventDefault();
      toggleTheme();
      return;
    }
    if (!isModalOpen()) return;
    if (e.key === 'Escape') closeModal();
    else if (e.key === 'Tab') trapFocus(e);
  });

  $('#themeToggle')?.addEventListener('click', toggleTheme);
  $('#langToggle')?.addEventListener('click', toggleLang);
  $('#domainSelect')?.addEventListener('change', (e) => setDomain(e.target.value));

  input.addEventListener('input', () => { autoGrow(); updateCounter(); });
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) {
      e.preventDefault();
      sendMessage(input.value);
    }
  });
  $('#chatForm').addEventListener('submit', (e) => {
    e.preventDefault();
    if (state.controller) state.controller.abort(); // кнопка работает как «Стоп»
    else sendMessage(input.value);
  });

  $('#clearChat').addEventListener('click', () => {
    state.controller?.abort();
    state.history = [];
    state.sessionTokens = 0;
    $('#sessionTokens').textContent = '0 tokens';
    clearAttachments();
    welcome();
  });

  $$('.quick-prompt').forEach((btn) => btn.addEventListener('click', () => {
    setDomain(btn.dataset.domain);
    $('#workspace')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    const promptKey = btn.dataset.promptKey;
    const promptText = promptKey && t()[promptKey] ? t()[promptKey] : btn.dataset.prompt;
    sendMessage(promptText);
  }));

  $('#attachInput').addEventListener('change', async (e) => {
    const files = [...e.target.files];
    e.target.value = '';
    await addAttachments(files);
  });
  $('#attachPreview').addEventListener('click', (e) => {
    const idx = e.target.closest('[data-remove]')?.dataset.remove;
    if (idx !== undefined) {
      state.attachments.splice(Number(idx), 1);
      renderAttachments();
    }
  });

  $('#profileForm').addEventListener('submit', saveProfile);
  $('#removeKeyBtn').addEventListener('click', removeKey);
  $('#toggleKeyVisibility').addEventListener('click', () => {
    const el = $('#apiKeyInput');
    el.type = el.type === 'password' ? 'text' : 'password';
  });
  $('#apiKeyInput').addEventListener('input', (e) => {
    const dict = t();
    const v = normalizeKey(e.target.value);
    if (!v) return setFeedback(defaultKeyHint());
    if (isKeyFormatValid(v)) return setFeedback(dict.keyValidMsg, 'ok');
    return setFeedback(dict.keyInvalidLen(v.length), 'warn');
  });

  $('#mobileMenuBtn').addEventListener('click', () => {
    const open = $('#mobileMenu').classList.toggle('hidden') === false;
    $('#mobileMenuBtn').setAttribute('aria-expanded', String(open));
  });
  $$('#mobileMenu a').forEach((a) => a.addEventListener('click', () => $('#mobileMenu').classList.add('hidden')));
}

/* ================================================================
   Init — восстановление сессии
   ================================================================ */
bindEvents();
setTheme(state.theme, { persist: false });
setDomain(state.domain, { persist: false });
setLang(state.lang, { persist: false });
updateCounter();
initViewport();
