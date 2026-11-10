/**
 * Статическая конфигурация PolyAssist AI.
 * Модуль не зависит от DOM — используется и в браузере, и в Node-тестах.
 */

export const API_BASE = 'https://generativelanguage.googleapis.com/v1beta';

/** Единственная рабочая модель системы — Gemini 3.5. */
export const MODELS = Object.freeze({
  'Gemini 3.5': Object.freeze({
    id: 'gemini-3.5-flash',
    family: 'flash',
    temperature: 0.3,
    maxOutputTokens: 4096,
    desc: 'Единый рабочий движок для 3D-пайплайна: топология, цифровой скульптинг, мультимодальный разбор скриншотов сетки/UV и шейдеры HLSL / GLSL.',
  }),
});
export const DEFAULT_MODEL = 'Gemini 3.5';

/** Специализации (Tech Spec 1.3): персона эксперта + оформление. */
export const DOMAINS = Object.freeze({
  '3D Modeling': Object.freeze({
    color: '#6366f1',
    rgb: '99, 102, 241',
    hint: 'Blender · Maya · 3ds Max — квад-топология, support loops, UV и Texel Density.',
    hintEn: 'Blender · Maya · 3ds Max — quad topology, support loops, UVs, and Texel Density.',
    persona:
      'Ты — старший технический 3D-художник по полигональному моделированию (Blender, Maya, 3ds Max). Фокусируйся на чистой квад-топологии, устранении N-гонов и полюсов на изогнутых поверхностях, правильной расстановке поддерживающих лупов (support loops) под Subdivision Surface и упаковке UV-островов с равномерным тексельным разрешением (Texel Density).',
  }),
  '3D Sculpting': Object.freeze({
    color: '#06b6d4',
    rgb: '6, 182, 212',
    hint: 'ZBrush · Mudbox · Nomad — Dynamesh, ZRemesher, запекание High → Low, EXR Displacement.',
    hintEn: 'ZBrush · Mudbox · Nomad — Dynamesh, ZRemesher, High → Low baking, EXR Displacement.',
    persona:
      'Ты — ведущий цифровой скульптор (ZBrush, Mudbox, Nomad Sculpt). Помогай с пайплайном Dynamesh, ZRemesher, проекцией деталей с High-Poly на Low-Poly, настройкой 32-битных карт смещения (EXR Displacement) и анатомическими пропорциями.',
  }),
  'Game Dev': Object.freeze({
    color: '#10b981',
    rgb: '16, 185, 129',
    hint: 'UE5 · Unity · Godot — Draw Calls, Nanite / Lumen, MikkTSpace, HLSL / GLSL, C# / C++.',
    hintEn: 'UE5 · Unity · Godot — Draw Calls, Nanite / Lumen, MikkTSpace, HLSL / GLSL, C# / C++.',
    persona:
      'Ты — Principal Technical Artist и программист графики (Unreal Engine 5, Unity, Godot). Фокусируйся на оптимизации Draw Calls, настройке Nanite/Lumen, запекании нормалей в пространстве MikkTSpace, написании кода на C#/C++ и математических формулах шейдеров HLSL/GLSL (например, I = max(0, N · L)).',
  }),
});
export const DEFAULT_DOMAIN = '3D Modeling';

/** Ключи хранилища (Tech Spec 4.2). */
export const STORAGE_KEYS = Object.freeze({
  user: 'polyassist_user',
  key: 'polyassist_key',
  model: 'polyassist_model',
  overrides: 'polyassist_model_overrides',
  availableModels: 'polyassist_available_models',
  theme: 'polyassist_theme',
  lang: 'polyassist_lang',
});

export const LIMITS = Object.freeze({
  maxInputChars: 6000,
  maxHistoryMessages: 20,     // последние N сообщений, отправляемых в контекст
  maxAttachments: 3,
  maxAttachmentBytes: 4 * 1024 * 1024,
  requestTimeoutMs: 90_000,
  verifyTimeoutMs: 15_000,
});

export const ALLOWED_IMAGE_TYPES = Object.freeze(['image/png', 'image/jpeg', 'image/webp']);
