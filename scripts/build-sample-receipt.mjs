#!/usr/bin/env node
/**
 * Renders the sample receipt participants attach in the stage 06 extension.
 *
 * It is generated rather than checked in as a photo so the numbers stay deliberate: the
 * total is $180 across 4 guests, which is $45/person against the $30/person internal-meal
 * cap. The agent should read the receipt *and* notice it breaches policy.
 *
 *   npm run docs:receipt
 */
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const target = join(repoRoot, 'docs', 'assets', 'sample-receipt.png');
mkdirSync(dirname(target), { recursive: true });

const html = `<!doctype html><html><head><meta charset="utf-8"><style>
  body { margin: 0; background: #f4f4f2; font-family: "Courier New", monospace; }
  .receipt { width: 360px; margin: 24px auto; background: #fff; padding: 26px 26px 34px;
             box-shadow: 0 2px 14px rgba(0,0,0,.18); color: #1a1a1a; }
  h1 { font-size: 19px; letter-spacing: 2px; text-align: center; margin: 0 0 2px; }
  .sub { text-align: center; font-size: 11px; color: #555; margin-bottom: 18px; line-height: 1.5; }
  hr { border: none; border-top: 1px dashed #999; margin: 12px 0; }
  table { width: 100%; font-size: 12.5px; border-collapse: collapse; }
  td { padding: 3px 0; }
  td.r { text-align: right; }
  .tot td { font-size: 15px; font-weight: bold; padding-top: 8px; }
  .foot { text-align: center; font-size: 10.5px; color: #666; margin-top: 18px; line-height: 1.6; }
</style></head><body><div class="receipt">
  <h1>THE GAGE</h1>
  <div class="sub">24 S Michigan Ave<br>Chicago, IL 60603<br>(312) 555-0142</div>
  <hr>
  <table>
    <tr><td>Date</td><td class="r">14 Aug 2026  19:42</td></tr>
    <tr><td>Table</td><td class="r">18  /  Guests: 4</td></tr>
    <tr><td>Server</td><td class="r">Marcus</td></tr>
  </table>
  <hr>
  <table>
    <tr><td>2 x Roast Chicken</td><td class="r">54.00</td></tr>
    <tr><td>1 x Seared Salmon</td><td class="r">32.00</td></tr>
    <tr><td>1 x Mushroom Risotto</td><td class="r">26.00</td></tr>
    <tr><td>4 x Sparkling Water</td><td class="r">16.00</td></tr>
    <tr><td>2 x Espresso</td><td class="r">9.00</td></tr>
  </table>
  <hr>
  <table>
    <tr><td>Subtotal</td><td class="r">137.00</td></tr>
    <tr><td>Sales Tax (10.75%)</td><td class="r">14.73</td></tr>
    <tr><td>Gratuity (20%)</td><td class="r">28.27</td></tr>
    <tr class="tot"><td>TOTAL USD</td><td class="r">$180.00</td></tr>
  </table>
  <hr>
  <table>
    <tr><td>VISA ****4417</td><td class="r">APPROVED</td></tr>
    <tr><td>Auth</td><td class="r">028841</td></tr>
  </table>
  <div class="foot">ITEMIZED RECEIPT<br>Thank you for dining with us</div>
</div></body></html>`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 420, height: 700 }, deviceScaleFactor: 2 });
await page.setContent(html, { waitUntil: 'load' });
await page.locator('.receipt').screenshot({ path: target });
await browser.close();

console.log('Wrote docs/assets/sample-receipt.png');
