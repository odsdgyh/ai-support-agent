/**
 * Минимальный и безопасный рендер Markdown → HTML.
 * Весь пользовательский/модельный текст СНАЧАЛА экранируется, затем
 * размечается ограниченным набором конструкций. Ссылки — только http(s).
 * Модуль не зависит от DOM.
 */

const HTML_ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

export function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (c) => HTML_ESCAPES[c]);
}

const PLACEHOLDER = '\uE000'; // символ из Private Use Area — не встречается в обычном тексте

function renderInline(text) {
  let s = escapeHtml(String(text).replaceAll(PLACEHOLDER, ''));
  const codes = [];
  s = s.replace(/`([^`\n]+)`/g, (_, c) => {
    codes.push(c);
    return `${PLACEHOLDER}${codes.length - 1}${PLACEHOLDER}`;
  });
  s = s.replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>');
  s = s.replace(/(^|[\s(])\*([^*\n]+)\*(?=[\s).,!?:;]|$)/g, '$1<em>$2</em>');
  s = s.replace(/(^|[\s(])_([^_\n]+)_(?=[\s).,!?:;]|$)/g, '$1<em>$2</em>');
  s = s.replace(
    /\[([^\]\n]+)\]\((https?:\/\/[^\s)]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener noreferrer nofollow">$1</a>',
  );
  s = s.replace(new RegExp(`${PLACEHOLDER}(\\d+)${PLACEHOLDER}`, 'g'), (_, i) => `<code class="inline">${codes[+i] ?? ''}</code>`);
  return s;
}

function renderBlocks(text) {
  let html = '';
  let list = null;
  let para = [];
  const flushPara = () => {
    if (para.length) html += `<p>${para.map(renderInline).join('<br>')}</p>`;
    para = [];
  };
  const flushList = () => {
    if (list) html += `</${list}>`;
    list = null;
  };
  const openList = (type) => {
    if (list !== type) {
      flushList();
      html += `<${type}>`;
      list = type;
    }
  };

  for (const raw of text.split('\n')) {
    const line = raw.replace(/\s+$/, '');
    let m;
    if (!line.trim()) {
      flushPara();
      flushList();
    } else if ((m = line.match(/^#{1,6}\s+(.*)$/))) {
      flushPara();
      flushList();
      html += `<h4>${renderInline(m[1])}</h4>`;
    } else if ((m = line.match(/^\s*[-*•]\s+(.*)$/))) {
      flushPara();
      openList('ul');
      html += `<li>${renderInline(m[1])}</li>`;
    } else if ((m = line.match(/^\s*\d+[.)]\s+(.*)$/))) {
      flushPara();
      openList('ol');
      html += `<li>${renderInline(m[1])}</li>`;
    } else if (/^\s*(---|\*\*\*)\s*$/.test(line)) {
      flushPara();
      flushList();
      html += '<hr class="my-3 border-white/10">';
    } else {
      flushList();
      para.push(line);
    }
  }
  flushPara();
  flushList();
  return html;
}

export function renderMarkdown(md) {
  const source = String(md ?? '').replace(/\r\n?/g, '\n');
  const fence = /```([\w#+.-]*)[^\n]*\n([\s\S]*?)(?:```|$)/g;
  const out = [];
  let last = 0;
  let m;
  while ((m = fence.exec(source))) {
    out.push(renderBlocks(source.slice(last, m.index)));
    const lang = escapeHtml(m[1] || 'code');
    const code = escapeHtml(m[2].replace(/\n$/, ''));
    out.push(
      `<pre><span class="code-lang">${lang}</span><button type="button" class="copy-btn">copy</button><code>${code}</code></pre>`,
    );
    last = fence.lastIndex;
  }
  out.push(renderBlocks(source.slice(last)));
  return out.join('');
}
