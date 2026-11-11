/**
 * Словарь локализации RU / EN для интерфейса PolyAssist AI.
 */

export const I18N = Object.freeze({
  ru: Object.freeze({
    metaTitle: 'PolyAssist AI — ИИ-ассистент для 3D-моделирования, скульптинга и Game Dev',
    brandSub: '3D PIPELINE // SUPPORT AGENT',
    navWorkspace: '[01] ИИ-Workspace',
    navByok: '[02] BYOK Ключ (AQ.…)',
    keyConnected: 'KEY CONNECTED',
    keyNotVerified: 'KEY NOT VERIFIED',
    noKeyConnected: 'NO API KEY CONNECTED',
    keyShortOk: 'KEY ✓',
    keyShortNo: 'NO KEY',
    ctaConnectKey: 'Подключить ключ',
    ctaProfile: 'Профиль',
    mobileProfileCta: '→ Профиль и API-ключ [⌘K]',

    heroSpec: 'SPEC // REV 2.3 · 3D PIPELINE AI',
    heroBadge: 'BYOK · Ключи AQ.… и AIza…',
    heroTitleHtml: 'ИИ-техартист для <mark class="b-mark">каждого полигона</mark> вашего пайплайна',
    heroSubHtml:
      'Инженерный ИИ-ассистент для <strong>3D-моделирования</strong>, <strong>цифрового скульптинга</strong> и <strong>Game Dev</strong>. Диагностирует сетку по скриншотам, устраняет швы карт нормалей и пишет шейдеры HLSL/GLSL — напрямую через ваш собственный ключ Google AI Studio.',
    heroBtnLaunch: 'Запустить ИИ-агента',
    heroBtnKey: 'Подключить API-ключ',
    metric1Label: 'Специализации',
    metric1Val: '3 РЕЖИМА',
    metric1Sub: 'MODEL · SCULPT · DEV',
    metric2Label: 'Тематический фильтр',
    metric2Val: '100% 3D ONLY',
    metric2Sub: 'STRICT GUARDRAIL',
    metric3Label: 'Приватность',
    metric3Val: '0-SERVER',
    metric3Sub: 'DIRECT GOOGLE API',

    vpVerdictBadge: '✦ AI VERDICT',
    vpVerdictTitle: 'TOPOLOGY VERDICT',
    vpVerdictStatus: 'SUBD READY · PASS',
    vpVerdictTextHtml:
      'Чистая квад-сетка: 2 полюса на осях вращения. Добавьте удерживающие лупы (<code class="font-mono font-bold">Ctrl+R</code>) у полюсов перед <code class="font-mono font-bold">Subdivision Surface</code> (lvl 2), чтобы избежать стягивания шейдинга.',

    sec2Tag: 'SECTION [01] // INTERACTIVE 3D WORKSPACE',
    sec2Title: 'Рабочее пространство агента',
    sec2Sub: 'Выберите профильную 3D-дисциплину — запрос уйдёт напрямую в Google AI Studio с вашим ключом и системным промптом эксперта.',
    domainLabel: 'Специализация (System Prompt)',
    domainOptModeling: '3D Modeling — топология и UV',
    domainOptSculpting: '3D Sculpting — цифровой скульптинг',
    domainOptGameDev: 'Game Dev — движки и шейдеры',

    keyPanelDisconnectedTitle: 'Ключ не подключён',
    keyPanelUnverifiedTitle: 'Ключ не прошёл проверку',
    keyPanelConnectedTitle: 'KEY CONNECTED ✓',
    keyPanelDisconnectedText: 'Без ключа агент не сможет обработать запрос. Ключ хранится только в вашем браузере.',
    keyPanelRemembered: 'сохранён на этом устройстве',
    keyPanelSession: 'хранится до закрытия вкладки',
    keyPanelPrefix: 'Ключ ',
    keyPanelBtnConnect: 'Подключить ключ',
    keyPanelBtnUpdate: 'Обновить ключ',
    profileNoKey: 'ключ не задан',

    clearBtn: 'Очистить',
    qpTitle: 'QUICK PROMPTS // ТЕСТ В 1 КЛИК',
    qpSub: 'АВТОПЕРЕКЛЮЧЕНИЕ ДИСЦИПЛИНЫ',
    qp1Label: '⬡ Артефакты после Boolean в Blender',
    qp1Prompt:
      'После Boolean-операции (Difference) в Blender на поверхности появились артефакты затенения и N-гоны. Как исправить топологию и шейдинг, сохранив силуэт? Дай пошаговый план и, если уместно, скрипт bpy.',
    qp2Label: '◍ Швы normal map: ZBrush → UE5',
    qp2Prompt:
      'Запёк карту нормалей с хай-поли из ZBrush на лоу-поли, а в Unreal Engine 5 видны швы по UV-разрезам. Почему так происходит и как настроить пайплайн запекания, чтобы швов не было?',
    qp3Label: '◈ Формула Fresnel-шейдера (HLSL)',
    qp3Prompt: 'Напиши формулу Fresnel rim-свечения для HLSL шейдера.',

    inputPlaceholder: 'Опишите проблему с мешем, скульптом или шейдером…',
    sendBtn: 'Отправить',
    stopBtn: 'Стоп',
    attachTitle: 'Прикрепить скриншот (wireframe, UV, Shader Graph)',
    shortcutsHintHtml: '<kbd>Enter</kbd> отправить · <kbd>Shift+Enter</kbd> строка · <kbd>⌘K</kbd> ключ · <kbd>⌘J</kbd> тема',
    scopeCounterPrefix: 'ТОЛЬКО 3D И GAME DEV · ',

    sec3Tag: 'SECTION [02] // ZERO-TRUST BYOK VAULT',
    sec3Title: 'Ключ Google AI Studio за 3 шага',
    sec3SubHtml:
      'Вы платите Google напрямую по своему тарифу, а ключ никогда не покидает ваш браузер — кроме прямых запросов к <code class="font-mono font-bold">generativelanguage.googleapis.com</code>.',
    step1Title: 'Откройте Google AI Studio',
    step1TextHtml: 'Войдите в свой Google-аккаунт и перейдите в раздел выпуска ключей <strong>Get API key</strong>.',
    step1Btn: 'Открыть Google AI Studio',
    step2Title: 'Скопируйте API-ключ',
    step2TextHtml: 'Поддерживаются как новые сервисные ключи <code class="font-mono font-bold">AQ.…</code>, так и классические <code class="font-mono font-bold">AIza…</code>:',
    step3Title: 'Проверьте и сохраните',
    step3TextHtml: 'Вставьте ключ в окно профиля — мы проверим его запросом <code class="font-mono font-bold">models.list</code> и сохраним в браузере.',
    step3Btn: 'Открыть профиль [⌘K]',
    secCalloutHtml:
      'По умолчанию ключ хранится только в <code class="font-mono font-bold">sessionStorage</code> до закрытия вкладки, а строгая политика <code class="font-mono font-bold">Content-Security-Policy</code> разрешает сетевые соединения исключительно с доменом Google API.',
    footerCopy: '© 2026 POLYASSIST AI // BRUTALISM EDITION · 3D & GAME DEV SUPPORT',

    modalBar: 'BYOK VAULT // ПРОФИЛЬ И API-КЛЮЧ',
    modalTitle: 'Настройка профиля и ключа',
    modalSub: 'Данные остаются в вашем браузере и используются только для прямых запросов к Google AI Studio.',
    modalNickLabel: 'Никнейм 3D-художника / разработчика',
    modalKeyLabel: 'API-ключ Google AI Studio',
    modalGetKey: 'Получить ключ ↗',
    modalRememberHtml: 'Запомнить ключ на этом устройстве <span class="b-muted">(иначе ключ хранится только до закрытия вкладки)</span>',
    modalRemoveBtn: 'Удалить ключ',
    modalCancelBtn: 'Отмена',
    modalSaveBtn: 'Проверить и сохранить',
    modalCheckingBtn: 'Проверяем ключ…',

    welcomeMeta: 'POLYASSIST // SYSTEM READY',
    welcomeHtml: (name, domain, hasKey) => {
      const greeting = name ? `Привет, ${name}!` : 'Привет!';
      const keyLine = hasKey
        ? 'Ключ подключён — задавайте вопросы или прикрепляйте скриншоты сетки.'
        : 'Чтобы начать, <button type="button" data-open-modal class="underline font-extrabold text-[var(--brutal-accent)]">подключите API-ключ Google AI Studio [⌘K]</button>.';
      return `<p>${greeting} Я <strong>PolyAssist</strong> — ИИ-техартист для 3D-пайплайна.</p>
        <p>Активный режим: <strong class="accent-text">${domain}</strong>. ${keyLine}</p>
        <p class="b-muted text-xs mt-2 font-mono font-bold uppercase">STRICT GUARDRAIL: ТОЛЬКО ВОПРОСЫ ПО 3D-МОДЕЛИРОВАНИЮ, СКУЛЬПТИНГУ, РЕНДЕРУ И GAME DEV.</p>`;
    },
    noKeyChatErrorHtml:
      '<p>API-ключ не подключён. <button type="button" data-open-modal class="underline font-extrabold">Подключите ключ Google AI Studio [⌘K]</button>, чтобы отправить запрос.</p>',
    analyzingLabel: 'Анализирую',
    offTopicMeta: 'POLYASSIST // ВНЕ ТЕМАТИКИ 3D',
    abortedMeta: 'POLYASSIST // ОСТАНОВЛЕНО',
    errorMeta: 'POLYASSIST // ERROR',
    screenshotFallback: '(скриншот)',
    screenshotPrompt: 'Проанализируй прикреплённое изображение.',
    offTopicReply:
      'Я отвечаю только на вопросы по 3D-моделированию, скульптингу, текстурированию, рендеру и разработке игр. Этот вопрос вне моей специализации — переформулируйте его в контексте 3D или Game Dev.',

    keyFormatHint: 'Формат: <span class="font-mono font-bold">AQ.…</span> (новые ключи) или <span class="font-mono font-bold">AIza…</span> (старые). Оставьте пустым, чтобы не менять сохранённый ключ.',
    keySavedHint: 'Ключ уже сохранён. Введите новый, чтобы заменить его.',
    keyValidMsg: 'Формат корректен ✓',
    keyInvalidLen: (len) => `Неверный формат: ключ должен начинаться с <span class="font-mono font-bold">AQ.</span> или <span class="font-mono font-bold">AIza</span> (сейчас ${len} симв.)`,
    keySavedPlaceholder: (masked) => `Сохранён: ${masked}`,
    keyEmptyErr: 'Введите API-ключ Google AI Studio.',
    keyFormatErr: 'Неверный формат ключа. Ожидается <span class="font-mono font-bold">AQ.…</span> или <span class="font-mono font-bold">AIza…</span>',
    keyVerifyProgress: 'Тестовый запрос models.list к Google AI Studio…',

    toastThemeDark: 'Тёмная тема: Dark Industrial',
    toastThemeLight: 'Светлая тема: Swiss Paper',
    toastLang: 'Язык интерфейса: Русский',
    toastTooLong: (max) => `Сообщение длиннее ${max} символов`,
    toastMaxAttach: (max) => `Можно прикрепить не более ${max} изображений`,
    toastFileType: (name) => `${name}: поддерживаются PNG, JPEG, WebP`,
    toastFileSize: (name, mb) => `${name}: больше ${mb} МБ`,
    toastFileReadErr: (name) => `${name}: не удалось прочитать файл`,
    toastEnterNick: 'Укажите никнейм',
    toastNetSaved: 'Сеть недоступна: ключ сохранён без проверки',
    toastProfileConnected: 'KEY CONNECTED — профиль сохранён',
    toastProfileSaved: 'Профиль сохранён',
    toastKeyRemoved: 'API-ключ удалён из браузера',
    toastCopyErr: 'Не удалось скопировать',
  }),

  en: Object.freeze({
    metaTitle: 'PolyAssist AI — AI Support Agent for 3D Modeling, Sculpting & Game Dev',
    brandSub: '3D PIPELINE // SUPPORT AGENT',
    navWorkspace: '[01] AI Workspace',
    navByok: '[02] BYOK Key (AQ.…)',
    keyConnected: 'KEY CONNECTED',
    keyNotVerified: 'KEY NOT VERIFIED',
    noKeyConnected: 'NO API KEY CONNECTED',
    keyShortOk: 'KEY ✓',
    keyShortNo: 'NO KEY',
    ctaConnectKey: 'Connect Key',
    ctaProfile: 'Profile',
    mobileProfileCta: '→ Profile & API Key [⌘K]',

    heroSpec: 'SPEC // REV 2.3 · 3D PIPELINE AI',
    heroBadge: 'BYOK · AQ.… & AIza… Keys',
    heroTitleHtml: 'AI Tech Artist for <mark class="b-mark">Every Polygon</mark> in Your Pipeline',
    heroSubHtml:
      'Engineering AI assistant for <strong>3D Modeling</strong>, <strong>Digital Sculpting</strong>, and <strong>Game Dev</strong>. Diagnoses wireframe screenshots, fixes normal map seams, and writes HLSL/GLSL shaders — directly via your own Google AI Studio key.',
    heroBtnLaunch: 'Launch AI Agent',
    heroBtnKey: 'Connect API Key',
    metric1Label: 'Specializations',
    metric1Val: '3 MODES',
    metric1Sub: 'MODEL · SCULPT · DEV',
    metric2Label: 'Topic Filter',
    metric2Val: '100% 3D ONLY',
    metric2Sub: 'STRICT GUARDRAIL',
    metric3Label: 'Privacy',
    metric3Val: '0-SERVER',
    metric3Sub: 'DIRECT GOOGLE API',

    vpVerdictBadge: '✦ AI VERDICT',
    vpVerdictTitle: 'TOPOLOGY VERDICT',
    vpVerdictStatus: 'SUBD READY · PASS',
    vpVerdictTextHtml:
      'Clean quad mesh: 2 poles on rotation axes. Add support loops (<code class="font-mono font-bold">Ctrl+R</code>) near poles before <code class="font-mono font-bold">Subdivision Surface</code> (lvl 2) to prevent shading pinch.',

    sec2Tag: 'SECTION [01] // INTERACTIVE 3D WORKSPACE',
    sec2Title: 'Agent Workspace',
    sec2Sub: 'Select a 3D specialization — your request goes straight to Google AI Studio with your key and expert system prompt.',
    domainLabel: 'Specialization (System Prompt)',
    domainOptModeling: '3D Modeling — Topology & UVs',
    domainOptSculpting: '3D Sculpting — Digital Sculpting',
    domainOptGameDev: 'Game Dev — Engines & Shaders',

    keyPanelDisconnectedTitle: 'No API Key Connected',
    keyPanelUnverifiedTitle: 'Key Not Verified',
    keyPanelConnectedTitle: 'KEY CONNECTED ✓',
    keyPanelDisconnectedText: 'Without an API key the agent cannot process requests. Your key is stored only in your browser.',
    keyPanelRemembered: 'saved on this device',
    keyPanelSession: 'stored until tab closes',
    keyPanelPrefix: 'Key ',
    keyPanelBtnConnect: 'Connect Key',
    keyPanelBtnUpdate: 'Update Key',
    profileNoKey: 'no key set',

    clearBtn: 'Clear',
    qpTitle: 'QUICK PROMPTS // 1-CLICK TEST',
    qpSub: 'AUTO-SWITCHES DISCIPLINE',
    qp1Label: '⬡ Boolean shading artifacts in Blender',
    qp1Prompt:
      'After a Boolean (Difference) operation in Blender, shading artifacts and N-gons appeared on the surface. How do I fix topology and shading while preserving the silhouette? Give a step-by-step plan and a bpy script if helpful.',
    qp2Label: '◍ Normal map seams: ZBrush → UE5',
    qp2Prompt:
      'I baked a normal map from a high-poly ZBrush sculpt onto a low-poly mesh, and visible seams appear along UV splits in Unreal Engine 5. Why does this happen and how do I configure the baking pipeline to eliminate seams?',
    qp3Label: '◈ Fresnel rim shader formula (HLSL)',
    qp3Prompt: 'Write a Fresnel rim-lighting formula for an HLSL shader.',

    inputPlaceholder: 'Describe your mesh, sculpt, or shader issue…',
    sendBtn: 'Send',
    stopBtn: 'Stop',
    attachTitle: 'Attach screenshot (wireframe, UV, Shader Graph)',
    shortcutsHintHtml: '<kbd>Enter</kbd> send · <kbd>Shift+Enter</kbd> newline · <kbd>⌘K</kbd> key · <kbd>⌘J</kbd> theme',
    scopeCounterPrefix: '3D & GAME DEV ONLY · ',

    sec3Tag: 'SECTION [02] // ZERO-TRUST BYOK VAULT',
    sec3Title: 'Google AI Studio Key in 3 Steps',
    sec3SubHtml:
      'You pay Google directly on your own tier, and your key never leaves your browser — except for direct requests to <code class="font-mono font-bold">generativelanguage.googleapis.com</code>.',
    step1Title: 'Open Google AI Studio',
    step1TextHtml: 'Sign in with your Google account and open the <strong>Get API key</strong> section.',
    step1Btn: 'Open Google AI Studio',
    step2Title: 'Copy Your API Key',
    step2TextHtml: 'Both new service auth keys (<code class="font-mono font-bold">AQ.…</code>) and classic keys (<code class="font-mono font-bold">AIza…</code>) are supported:',
    step3Title: 'Verify & Save',
    step3TextHtml: 'Paste the key in the profile dialog — we verify it via <code class="font-mono font-bold">models.list</code> and store it locally.',
    step3Btn: 'Open Profile [⌘K]',
    secCalloutHtml:
      'By default your key is kept only in <code class="font-mono font-bold">sessionStorage</code> until the tab is closed, and a strict <code class="font-mono font-bold">Content-Security-Policy</code> restricts network connections exclusively to the Google API domain.',
    footerCopy: '© 2026 POLYASSIST AI // BRUTALISM EDITION · 3D & GAME DEV SUPPORT',

    modalBar: 'BYOK VAULT // PROFILE & API KEY',
    modalTitle: 'Profile & API Key Setup',
    modalSub: 'Data stays in your browser and is used only for direct requests to Google AI Studio.',
    modalNickLabel: '3D Artist / Developer Nickname',
    modalKeyLabel: 'Google AI Studio API Key',
    modalGetKey: 'Get API Key ↗',
    modalRememberHtml: 'Remember key on this device <span class="b-muted">(otherwise cleared when the tab closes)</span>',
    modalRemoveBtn: 'Remove Key',
    modalCancelBtn: 'Cancel',
    modalSaveBtn: 'Verify & Save',
    modalCheckingBtn: 'Verifying key…',

    welcomeMeta: 'POLYASSIST // SYSTEM READY',
    welcomeHtml: (name, domain, hasKey) => {
      const greeting = name ? `Hello, ${name}!` : 'Hello!';
      const keyLine = hasKey
        ? 'API key connected — ask a question or attach wireframe screenshots.'
        : 'To begin, <button type="button" data-open-modal class="underline font-extrabold text-[var(--brutal-accent)]">connect your Google AI Studio API key [⌘K]</button>.';
      return `<p>${greeting} I am <strong>PolyAssist</strong> — your AI Technical Artist for the 3D pipeline.</p>
        <p>Active mode: <strong class="accent-text">${domain}</strong>. ${keyLine}</p>
        <p class="b-muted text-xs mt-2 font-mono font-bold uppercase">STRICT GUARDRAIL: 3D MODELING, SCULPTING, RENDERING & GAME DEV QUESTIONS ONLY.</p>`;
    },
    noKeyChatErrorHtml:
      '<p>No API key connected. <button type="button" data-open-modal class="underline font-extrabold">Connect your Google AI Studio key [⌘K]</button> to send a request.</p>',
    analyzingLabel: 'Analyzing',
    offTopicMeta: 'POLYASSIST // OUT OF 3D SCOPE',
    abortedMeta: 'POLYASSIST // STOPPED',
    errorMeta: 'POLYASSIST // ERROR',
    screenshotFallback: '(screenshot)',
    screenshotPrompt: 'Analyze the attached image.',
    offTopicReply:
      'I only answer questions about 3D modeling, sculpting, texturing, rendering, and game development. Please rephrase your question in the context of 3D or Game Dev.',

    keyFormatHint: 'Format: <span class="font-mono font-bold">AQ.…</span> (new auth keys) or <span class="font-mono font-bold">AIza…</span> (legacy). Leave blank to keep saved key.',
    keySavedHint: 'Key already saved. Enter a new one to replace it.',
    keyValidMsg: 'Valid key format ✓',
    keyInvalidLen: (len) => `Invalid format: key must start with <span class="font-mono font-bold">AQ.</span> or <span class="font-mono font-bold">AIza</span> (currently ${len} chars)`,
    keySavedPlaceholder: (masked) => `Saved: ${masked}`,
    keyEmptyErr: 'Please enter your Google AI Studio API key.',
    keyFormatErr: 'Invalid key format. Expected <span class="font-mono font-bold">AQ.…</span> or <span class="font-mono font-bold">AIza…</span>',
    keyVerifyProgress: 'Testing key via models.list on Google AI Studio…',

    toastThemeDark: 'Dark theme: Dark Industrial',
    toastThemeLight: 'Light theme: Swiss Paper',
    toastLang: 'Interface language: English',
    toastTooLong: (max) => `Message exceeds ${max} characters`,
    toastMaxAttach: (max) => `Up to ${max} images allowed`,
    toastFileType: (name) => `${name}: only PNG, JPEG, WebP supported`,
    toastFileSize: (name, mb) => `${name}: exceeds ${mb} MB`,
    toastFileReadErr: (name) => `${name}: failed to read file`,
    toastEnterNick: 'Please enter a nickname',
    toastNetSaved: 'Network unavailable: key saved without verification',
    toastProfileConnected: 'KEY CONNECTED — profile saved',
    toastProfileSaved: 'Profile saved',
    toastKeyRemoved: 'API key removed from browser',
    toastCopyErr: 'Failed to copy',
  }),
});
