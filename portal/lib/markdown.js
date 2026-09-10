/* ============================================================
   ECHO'S REALM — MINI MARKDOWN v1.0
   Dependency-free renderer for local .md content (manifest.md).
   Supports: headings, bold/italic, inline + fenced code, links,
   unordered/ordered lists, blockquotes, horizontal rules, paragraphs.
   All text is HTML-escaped before rendering.
   ============================================================ */

export function escapeHtml(text = '') {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderInline(text) {
  let out = escapeHtml(text);

  // Protect inline code from further transforms
  const codes = [];
  out = out.replace(/`([^`]+)`/g, (_, code) => {
    codes.push(code);
    return `\u0000${codes.length - 1}\u0000`;
  });

  // Links [label](url) — only safe schemes allowed
  out = out.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, label, url) => {
    const safe = /^(https?:|mailto:|#|\/)/i.test(url) ? url : '#';
    return `<a href="${safe}" target="_blank" rel="noopener noreferrer">${label}</a>`;
  });

  // Bold, then italic (avoid clobbering bold markers)
  out = out.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  out = out.replace(/__([^_]+)__/g, '<strong>$1</strong>');
  out = out.replace(/(^|[^*])\*([^*\n]+)\*(?!\*)/g, '$1<em>$2</em>');

  // Restore inline code
  out = out.replace(/\u0000(\d+)\u0000/g, (_, i) => `<code>${codes[Number(i)]}</code>`);

  return out;
}

export function renderMarkdown(markdown = '') {
  const lines = String(markdown).replace(/\r\n?/g, '\n').split('\n');
  const html = [];
  let listType = null; // 'ul' | 'ol'
  let inQuote = false;
  let i = 0;

  const closeList = () => {
    if (listType) { html.push(`</${listType}>`); listType = null; }
  };
  const closeQuote = () => {
    if (inQuote) { html.push('</blockquote>'); inQuote = false; }
  };

  while (i < lines.length) {
    const line = lines[i];

    // Fenced code block
    const fence = line.match(/^\s*```(\S*)\s*$/);
    if (fence) {
      closeList(); closeQuote();
      const lang = fence[1] || '';
      const body = [];
      i++;
      while (i < lines.length && !/^\s*```\s*$/.test(lines[i])) { body.push(lines[i]); i++; }
      i++; // consume closing fence
      const langAttr = lang ? ` data-lang="${escapeHtml(lang)}"` : '';
      html.push(`<pre class="md-code"${langAttr}><code>${escapeHtml(body.join('\n'))}</code></pre>`);
      continue;
    }

    // Horizontal rule
    if (/^\s*(-{3,}|\*{3,}|_{3,})\s*$/.test(line)) {
      closeList(); closeQuote();
      html.push('<hr class="md-hr">');
      i++;
      continue;
    }

    // Heading
    const heading = line.match(/^\s*(#{1,6})\s+(.*)$/);
    if (heading) {
      closeList(); closeQuote();
      const level = heading[1].length;
      html.push(`<h${level} class="md-h${level}">${renderInline(heading[2].trim())}</h${level}>`);
      i++;
      continue;
    }

    // Blockquote
    const quote = line.match(/^\s*>\s?(.*)$/);
    if (quote) {
      closeList();
      if (!inQuote) { html.push('<blockquote class="md-quote">'); inQuote = true; }
      html.push(`<p>${renderInline(quote[1])}</p>`);
      i++;
      continue;
    }
    closeQuote();

    // Unordered list
    const ul = line.match(/^\s*[-*+]\s+(.*)$/);
    if (ul) {
      if (listType !== 'ul') { closeList(); html.push('<ul class="md-ul">'); listType = 'ul'; }
      html.push(`<li>${renderInline(ul[1])}</li>`);
      i++;
      continue;
    }

    // Ordered list
    const ol = line.match(/^\s*\d+\.\s+(.*)$/);
    if (ol) {
      if (listType !== 'ol') { closeList(); html.push('<ol class="md-ol">'); listType = 'ol'; }
      html.push(`<li>${renderInline(ol[1])}</li>`);
      i++;
      continue;
    }

    // Blank line
    if (!line.trim()) {
      closeList();
      i++;
      continue;
    }

    // Paragraph
    closeList();
    html.push(`<p>${renderInline(line.trim())}</p>`);
    i++;
  }

  closeList(); closeQuote();
  return html.join('\n');
}

export default renderMarkdown;
