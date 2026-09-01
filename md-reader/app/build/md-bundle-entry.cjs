// 导出管线 bundle（IIFE, global: mdrMd）：markdown-it + 脚注 + highlight.js
import MarkdownIt from 'markdown-it';
import hljs from 'highlight.js';
import footnote from 'markdown-it-footnote';

const md = new MarkdownIt({
  html: false, linkify: true, breaks: false,
  highlight(str, lang) {
    if (lang && hljs.getLanguage(lang)) {
      try { return hljs.highlight(str, { language: lang, ignoreIllegals: true }).value; } catch {}
    }
    return ''; // 由 fence 渲染器补 class
  },
});
md.use(footnote);

// fence 渲染器：输出 <pre><code class="hljs language-x">
const defaultFence = md.renderer.rules.fence;
md.renderer.rules.fence = (tokens, idx, options, env, self) => {
  const token = tokens[idx];
  const lang = (token.info || '').trim().split(/\s+/)[0];
  const highlighted = md.options.highlight(token.content, lang) || md.utils.escapeHtml(token.content);
  const cls = ['hljs', lang ? `language-${lang}` : ''].filter(Boolean).join(' ');
  return `<pre><code class="${cls}">${highlighted}\n</code></pre>\n`;
};

export default md;
