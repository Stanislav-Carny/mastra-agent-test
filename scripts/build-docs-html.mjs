#!/usr/bin/env node
/**
 * Renders every participant-facing `docs/*.md` file into a matching `.html` file, so the
 * workshop can be read by opening a file in a browser straight out of a downloaded zip —
 * no git, no server, no GitHub Pages.
 *
 * The markdown is the source of truth: edit that, then re-run this.
 *
 *   npm run docs:html
 *
 * `facilitator-guide.md` is deliberately skipped: it is not participant material.
 */
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { marked } from 'marked';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const docsDir = join(repoRoot, 'docs');

const SKIP = new Set(['facilitator-guide.md']);

const files = readdirSync(docsDir)
  .filter((name) => name.endsWith('.md') && !SKIP.has(name))
  .sort();

/**
 * Matches GitHub's heading slug algorithm, since the anchors in these docs (e.g.
 * `studio-walkthrough.md#stage-01--the-empty-starting-point`) were written against it:
 * strip anything that isn't a letter, digit, or space, lowercase, then turn every space
 * into a hyphen without collapsing runs.
 */
function slugify(text) {
  return text
    .replace(/[^A-Za-z0-9 ]/g, '')
    .toLowerCase()
    .trim()
    .replace(/ /g, '-');
}

const renderer = new marked.Renderer();

renderer.link = ({ href, text }) => {
  const localMd = !href.startsWith('http') && /\.md(#.*)?$/.test(href);
  const target = localMd ? href.replace(/\.md(?=#|$)/, '.html') : href;
  return `<a href="${target}">${text}</a>`;
};

renderer.heading = function ({ tokens, depth }) {
  const html = this.parser.parseInline(tokens);
  const id = slugify(html.replace(/<[^>]+>/g, ''));
  return `<h${depth} id="${id}">${html}</h${depth}>\n`;
};

function titleOf(markdown, fallback) {
  const match = markdown.match(/^#\s+(.+)$/m);
  return match ? match[1] : fallback;
}

function stripFrontMatter(markdown) {
  return markdown.replace(/^---\n[\s\S]*?\n---\n/, '');
}

const css = `
  :root {
    --ink: #1a1a1a;
    --muted: #5c5c5c;
    --rule: #e0ddd7;
    --accent: #b45309;
    --code-bg: #f6f5f2;
  }
  * { box-sizing: border-box; }
  body {
    margin: 0 auto;
    max-width: 780px;
    padding: 48px 24px 80px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
    color: var(--ink);
    line-height: 1.55;
  }
  h1, h2, h3 { line-height: 1.25; }
  h1 { border-bottom: 2px solid var(--rule); padding-bottom: 8px; }
  h2 { margin-top: 2.2em; border-bottom: 1px solid var(--rule); padding-bottom: 6px; }
  a { color: var(--accent); text-decoration: none; }
  a:hover { text-decoration: underline; }
  code { background: var(--code-bg); padding: 0.15em 0.4em; border-radius: 4px; font-size: 0.92em; }
  pre { background: var(--code-bg); padding: 14px 16px; border-radius: 6px; overflow-x: auto; }
  pre code { background: none; padding: 0; }
  table { border-collapse: collapse; width: 100%; margin: 1em 0; }
  th, td { border: 1px solid var(--rule); padding: 6px 10px; text-align: left; vertical-align: top; }
  th { background: var(--code-bg); }
  img { max-width: 100%; border: 1px solid var(--rule); border-radius: 6px; }
  blockquote { border-left: 3px solid var(--accent); margin: 1em 0; padding: 0.2em 1em; color: var(--muted); }
`;

for (const file of files) {
  const source = join(docsDir, file);
  const markdown = stripFrontMatter(readFileSync(source, 'utf8'));
  const title = titleOf(markdown, file.replace(/\.md$/, ''));
  const body = marked.parse(markdown, { renderer });

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<style>${css}</style>
</head>
<body>
${body}
</body>
</html>
`;

  const target = join(docsDir, file.replace(/\.md$/, '.html'));
  writeFileSync(target, html);
  console.log(`docs/${file} -> docs/${file.replace(/\.md$/, '.html')}`);
}
