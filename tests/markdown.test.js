import { test } from 'node:test';
import assert from 'node:assert/strict';

import { renderMarkdown, escapeHtml } from '../assets/js/markdown.js';

const XSS = [
  '<img src=x onerror=alert(1)>',
  '<script>alert(1)</script>',
  '[click](javascript:alert(1))',
  '`<svg onload=alert(1)>`',
  '```"><img src=x onerror=alert(1)>\ncode\n```',
  '**<iframe src=//evil>**',
  '[x](https://ok.com/" onmouseover="alert(1))',
];

test('рендер Markdown не пропускает исполняемый HTML', () => {
  for (const payload of XSS) {
    const html = renderMarkdown(payload);
    assert.ok(!/<(img|script|svg|iframe)\b/i.test(html), `тег прошёл: ${payload} → ${html}`);
    assert.ok(!/href="javascript:/i.test(html), `javascript: прошёл: ${payload}`);
    assert.ok(!/\son\w+="/i.test(html), `обработчик прошёл: ${payload} → ${html}`);
  }
});

test('код-блоки экранируются и получают метку языка', () => {
  const html = renderMarkdown('```hlsl\nfloat f = a < b ? 1 : 0;\n```');
  assert.match(html, /<span class="code-lang">hlsl<\/span>/);
  assert.match(html, /a &lt; b/);
});

test('базовая разметка: списки, жирный, inline-код, ссылки', () => {
  const html = renderMarkdown('- **Bevel**: `Ctrl+B`\n- [Docs](https://docs.blender.org)');
  assert.match(html, /<ul><li><strong>Bevel<\/strong>: <code class="inline">Ctrl\+B<\/code><\/li>/);
  assert.match(html, /<a href="https:\/\/docs\.blender\.org" target="_blank" rel="noopener noreferrer nofollow">Docs<\/a>/);
});

test('escapeHtml экранирует все опасные символы', () => {
  assert.equal(escapeHtml(`<a href="x" onclick='y'>&</a>`), '&lt;a href=&quot;x&quot; onclick=&#39;y&#39;&gt;&amp;&lt;/a&gt;');
});
