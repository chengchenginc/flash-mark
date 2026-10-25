import MarkdownIt from 'markdown-it'
import anchor from 'markdown-it-anchor'
import hljs from 'highlight.js'
import katex from 'katex'
import 'katex/dist/katex.min.css'
import 'highlight.js/styles/github.css'
import { slugify } from './slug'

const md: MarkdownIt = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
  highlight(str, lang) {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return (
          '<pre class="hljs"><code>' +
          hljs.highlight(str, { language: lang, ignoreIllegals: true }).value +
          '</code></pre>'
        )
      } catch {
        /* 忽略高亮异常，走默认 */
      }
    }
    return '<pre class="hljs"><code>' + md.utils.escapeHtml(str) + '</code></pre>'
  },
})

// ---------- KaTeX 内联插件（块级 $$...$$ 与行内 $...$） ----------
function isValidDelim(state: any, pos: number) {
  const prev = pos > 0 ? state.src.charCodeAt(pos - 1) : -1
  const next = pos + 1 <= state.posMax ? state.src.charCodeAt(pos + 1) : -1
  let canOpen = true
  let canClose = true
  // 数字后不闭合（避免 $5 之类误判），空白后不开启
  if (prev === 0x20 || prev === 0x09 || (prev >= 0x30 && prev <= 0x39)) canClose = false
  if (next === 0x20 || next === 0x09) canOpen = false
  return { canOpen, canClose }
}

function mathInline(state: any, silent: boolean): boolean {
  if (state.src[state.pos] !== '$') return false
  const res = isValidDelim(state, state.pos)
  if (!res.canOpen) {
    if (!silent) state.pending += '$'
    state.pos += 1
    return true
  }
  const start = state.pos + 1
  let match = start
  let pos
  while ((match = state.src.indexOf('$', match)) !== -1) {
    pos = match - 1
    while (state.src[pos] === '\\') pos -= 1
    if ((match - pos) % 2 === 1) break
    match += 1
  }
  if (match === -1) {
    if (!silent) state.pending += '$'
    state.pos = start
    return true
  }
  if (match - start === 0) {
    if (!silent) state.pending += '$$'
    state.pos = start + 1
    return true
  }
  const res2 = isValidDelim(state, match)
  if (!res2.canClose) {
    if (!silent) state.pending += '$'
    state.pos = start
    return true
  }
  if (!silent) {
    const token = state.push('math_inline', 'math', 0)
    token.markup = '$'
    token.content = state.src.slice(start, match)
  }
  state.pos = match + 1
  return true
}

function mathBlock(state: any, start: number, end: number, silent: boolean): boolean {
  let firstLine: string
  let lastLine = ''
  let next = 0
  let found = false
  let pos = state.bMarks[start] + state.tShift[start]
  const max = state.eMarks[start]
  if (pos + 2 > max) return false
  if (state.src.slice(pos, pos + 2) !== '$$') return false
  pos += 2
  firstLine = state.src.slice(pos, max)
  if (silent) return true
  if (firstLine.trim().slice(-2) === '$$') {
    firstLine = firstLine.trim().slice(0, -2)
    found = true
  }
  for (next = start; !found; ) {
    next++
    if (next >= end) break
    pos = state.bMarks[next] + state.tShift[next]
    const max2 = state.eMarks[next]
    if (pos < max2 && state.tShift[next] < state.blkIndent) break
    if (state.src.slice(pos, max2).trim().slice(-2) === '$$') {
      const lastPos = state.src.slice(0, max2).lastIndexOf('$$')
      lastLine = state.src.slice(pos, lastPos)
      found = true
    }
  }
  state.line = next + 1
  const token = state.push('math_block', 'math', 0)
  token.block = true
  token.content =
    (firstLine && firstLine.trim() ? firstLine + '\n' : '') +
    state.getLines(start + 1, next, state.tShift[start], true) +
    (lastLine && lastLine.trim() ? lastLine : '')
  token.map = [start, state.line]
  token.markup = '$$'
  return true
}

md.inline.ruler.after('escape', 'math_inline', mathInline)
md.block.ruler.after('blockquote', 'math_block', mathBlock, {
  alt: ['paragraph', 'reference', 'blockquote', 'list'],
})
md.renderer.rules.math_inline = (tokens, idx) => {
  try {
    return katex.renderToString(tokens[idx].content, {
      displayMode: false,
      throwOnError: false,
    })
  } catch {
    return tokens[idx].content
  }
}
md.renderer.rules.math_block = (tokens, idx) => {
  try {
    return (
      '<div class="math-block">' +
      katex.renderToString(tokens[idx].content, {
        displayMode: true,
        throwOnError: false,
      }) +
      '</div>'
    )
  } catch {
    return tokens[idx].content
  }
}

md.use(anchor, {
  slugify,
  permalink: anchor.permalink.headerLink(),
})

export function renderMarkdown(src: string): string {
  return md.render(src)
}

export { md }
