import React from 'react'

// Dependency-free renderer for the safe Markdown subset used by CMS prose
// fields: paragraphs, line breaks, **bold**, *italic* / _italic_,
// [links](https://… or /path), "- " / "* " bullet lists, "1. " numbered lists
// and ## headings. All raw HTML is escaped before our own tags are applied, so
// editor input can't inject markup.

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

// The CMS editor escapes markdown punctuation (\\* \\_ …) and ends hard line
// breaks with two spaces or a backslash; undo both before rendering.
function clean(line: string): string {
  return line.replace(/(\s{2,}|\\)$/, '').replace(/\\([\\`*_{}[\]()#+\-.!>])/g, '$1')
}

function inline(s: string): string {
  let t = escapeHtml(clean(s))
  // Lift [text](url) out first (external links open in a new tab) so emphasis
  // markers inside URLs or attributes, like _ in a path, are left alone.
  const links: string[] = []
  t = t.replace(
    /\[([^\]]+)\]\((https?:\/\/[^\s)]+|\/[^\s)]*)\)/g,
    (_m, text: string, url: string) => {
      links.push(
        `<a href="${url}"${url.startsWith('http') ? ' target="_blank" rel="noopener noreferrer"' : ''}>${text}</a>`
      )
      return `\u0000${links.length - 1}\u0000`
    }
  )
  t = t.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
  t = t.replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>')
  t = t.replace(/(^|[^\w])_([^_\n]+)_(?=[^\w]|$)/g, '$1<em>$2</em>')
  return t.replace(/\u0000(\d+)\u0000/g, (_m, i: string) => links[Number(i)])
}

const BULLET = /^\s*[-*+]\s+/
const NUMBERED = /^\s*\d+[.)]\s+/

function toHtml(md: string): string {
  return md
    .trim()
    .split(/\n{2,}/)
    .map((block) => {
      const lines = block.split('\n')
      const heading = lines.length === 1 && lines[0].match(/^#{1,6}\s+(.*)$/)
      if (heading) return `<h3>${inline(heading[1])}</h3>`
      if (lines.every((l) => BULLET.test(l))) {
        return `<ul>${lines.map((l) => `<li>${inline(l.replace(BULLET, ''))}</li>`).join('')}</ul>`
      }
      if (lines.every((l) => NUMBERED.test(l))) {
        return `<ol>${lines.map((l) => `<li>${inline(l.replace(NUMBERED, ''))}</li>`).join('')}</ol>`
      }
      return `<p>${lines.map(inline).join('<br/>')}</p>`
    })
    .join('')
}

// Markdown stripped to a single line of plain text, for cards, meta tags and
// structured data where markup can't be shown.
export function plainText(md: string): string {
  return md
    .split('\n')
    .map((l) => clean(l).replace(/^\s*(#{1,6}|[-*+]|\d+[.)])\s+/, ''))
    .join(' ')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/(^|[^*])\*([^*\n]+)\*/g, '$1$2')
    .replace(/\s+/g, ' ')
    .trim()
}

export default function RichText({
  children,
  style,
  className,
}: {
  children?: string | null
  style?: React.CSSProperties
  className?: string
}) {
  if (!children) return null
  return (
    <div
      className={`richtext${className ? ` ${className}` : ''}`}
      style={style}
      dangerouslySetInnerHTML={{ __html: toHtml(children) }}
    />
  )
}
