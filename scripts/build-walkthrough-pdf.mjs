#!/usr/bin/env node
/**
 * Renders `docs/studio-walkthrough.md` into a printable handout at
 * `docs/mastra-studio-walkthrough.pdf`.
 *
 * The markdown is the source of truth: edit that, then re-run this. Screenshots come from
 * `docs/images/`, which `npm run docs:screenshots` regenerates.
 *
 *   npm run docs:pdf
 *
 * No dev server is needed. This only reads files off disk.
 */
import { readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { marked } from 'marked';
import { chromium } from 'playwright';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const docsDir = join(repoRoot, 'docs');
const source = join(docsDir, 'studio-walkthrough.md');
const target = join(docsDir, 'mastra-studio-walkthrough.pdf');
const scratch = join(docsDir, '.walkthrough-print.html');

/**
 * The handout is for participants, so two things are cut: the maintainer section on
 * regenerating the images, and anything fenced off with `<!-- pdf:skip -->`, which is how
 * the markdown marks text that only makes sense on screen.
 */
const markdown = readFileSync(source, 'utf8')
  .split('\n## Re-capturing these images')[0]
  .replace(/<!-- pdf:skip -->[\s\S]*?<!-- \/pdf:skip -->\n?/g, '')
  .trimEnd();

/**
 * Links between docs are useless on paper, so they are rendered as plain text. Links to
 * the web keep their URL, since someone can still type it.
 */
const renderer = new marked.Renderer();
renderer.link = ({ href, text }) =>
  href.startsWith('http') ? `<a href="${href}">${text}</a>` : `<span class="flat-link">${text}</span>`;

const body = marked.parse(markdown, { renderer });

const css = `
  /* Page numbering comes from the footer template, not from a margin box. */
  @page {
    size: A4;
    margin: 18mm 16mm 20mm;
  }

  :root {
    --ink: #1a1a1a;
    --muted: #5c5c5c;
    --rule: #e0ddd7;
    --accent: #b45309;
    --code-bg: #f6f5f2;
  }

  * { box-sizing: border-box; }

  body {
    font-family: "Charter", "Iowan Old Style", Georgia, serif;
    font-size: 10.5pt;
    line-height: 1.55;
    color: var(--ink);
    margin: 0;
  }

  /* Cover */
  .cover {
    height: 232mm;
    display: flex;
    flex-direction: column;
    justify-content: center;
    page-break-after: always;
  }
  .cover .eyebrow {
    font-family: ui-monospace, "SF Mono", Menlo, monospace;
    font-size: 9pt;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--accent);
    margin-bottom: 10mm;
  }
  .cover h1 {
    font-size: 30pt;
    line-height: 1.1;
    margin: 0 0 6mm;
    border: 0;
    padding: 0;
  }
  .cover p {
    font-size: 12pt;
    color: var(--muted);
    max-width: 120mm;
    margin: 0 0 4mm;
  }
  .cover .rule {
    width: 40mm;
    border-top: 2pt solid var(--accent);
    margin: 8mm 0;
  }

  /* Headings. Each stage starts on a fresh page so a step never straddles a fold. */
  h1 {
    font-size: 19pt;
    margin: 0 0 6mm;
    padding-bottom: 3mm;
    border-bottom: 1pt solid var(--rule);
  }
  h2 {
    font-size: 14pt;
    margin: 0 0 5mm;
    padding-top: 2mm;
    page-break-before: always;
    page-break-after: avoid;
  }
  h2:first-of-type { page-break-before: avoid; }
  h3 { font-size: 11.5pt; margin: 7mm 0 2mm; page-break-after: avoid; }

  p { margin: 0 0 3.5mm; orphans: 3; widows: 3; }
  ol, ul { margin: 0 0 4mm; padding-left: 6mm; }
  li { margin-bottom: 1.5mm; }

  strong { font-weight: 600; }

  code {
    font-family: ui-monospace, "SF Mono", Menlo, monospace;
    font-size: 8.8pt;
    background: var(--code-bg);
    padding: 0.4mm 1.2mm;
    border-radius: 1mm;
  }
  pre {
    background: var(--code-bg);
    border-left: 2pt solid var(--accent);
    padding: 3mm 4mm;
    margin: 0 0 4mm;
    border-radius: 0 1mm 1mm 0;
    page-break-inside: avoid;
  }
  pre code { background: none; padding: 0; font-size: 8.6pt; line-height: 1.45; }

  /* Screenshots are never split across a page. They are held slightly under full width so
     a page can still fit surrounding text rather than stranding half a page of white. */
  p:has(> img) { page-break-inside: avoid; margin: 5mm 0 6mm; text-align: center; }
  img {
    width: 88%;
    border: 1pt solid var(--rule);
    border-radius: 1.5mm;
    display: block;
    margin: 0 auto;
  }

  hr { border: 0; border-top: 1pt solid var(--rule); margin: 7mm 0; }

  blockquote {
    margin: 0 0 4mm;
    padding-left: 4mm;
    border-left: 2pt solid var(--rule);
    color: var(--muted);
  }

  .flat-link { font-style: italic; }
  a { color: var(--accent); text-decoration: none; }
`;

const cover = `
  <div class="cover">
    <div class="eyebrow">Cursor &amp; Mastra workshop</div>
    <h1>Mastra Studio<br />walkthrough</h1>
    <div class="rule"></div>
    <p>What to do, and what you should see, at every checkpoint of the 90-minute build.</p>
    <p>Start after setup is finished and your API keys are in place.</p>
  </div>
`;

writeFileSync(
  scratch,
  `<!doctype html><html><head><meta charset="utf-8"><style>${css}</style></head><body>${cover}${body}</body></html>`,
);

const browser = await chromium.launch();
const page = await browser.newPage();
// A file URL keeps the relative `images/...` paths in the markdown working.
await page.goto(`file://${scratch}`, { waitUntil: 'networkidle' });
await page.pdf({
  path: target,
  format: 'A4',
  printBackground: true,
  displayHeaderFooter: true,
  headerTemplate: '<span></span>',
  footerTemplate: `
    <div style="width:100%;font-family:-apple-system,sans-serif;font-size:7.5pt;color:#8a8a8a;padding:0 16mm;display:flex;justify-content:space-between;">
      <span>Mastra Studio walkthrough</span>
      <span class="pageNumber"></span>
    </div>`,
  margin: { top: '18mm', bottom: '20mm', left: '16mm', right: '16mm' },
});
await browser.close();

rmSync(scratch);
console.log(`Wrote docs/${target.split('/').pop()}`);
