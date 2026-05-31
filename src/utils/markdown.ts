import MarkdownIt from 'markdown-it'
import hljs from 'highlight.js'

const markdown = new MarkdownIt({
  html: false,
  breaks: true,
  linkify: true,
  highlight(code: string, language: string): string {
    const safeCode = markdown.utils.escapeHtml(code)

    if (language && hljs.getLanguage(language)) {
      try {
        const highlighted = hljs.highlight(code, { language }).value
        return `<pre class="code-block"><code class="hljs language-${language}">${highlighted}</code></pre>`
      } catch {
        return `<pre class="code-block"><code>${safeCode}</code></pre>`
      }
    }

    try {
      const highlighted = hljs.highlightAuto(code).value
      return `<pre class="code-block"><code class="hljs">${highlighted}</code></pre>`
    } catch {
      return `<pre class="code-block"><code>${safeCode}</code></pre>`
    }
  },
})

export function renderMarkdown(content: string): string {
  return markdown.render(content)
}
