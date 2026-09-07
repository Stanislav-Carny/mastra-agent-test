#!/usr/bin/env node
/**
 * Renders the receipt image for each folder under `test-cases/`.
 *
 * These are generated rather than photographed so every number is deliberate: each one is
 * built to land on a specific side of a policy rule, and the rules live in
 * `after/src/mock-data/expense-policy-docs.ts`. If you change a policy, change the receipt
 * that tests it.
 *
 *   npm run test:receipts
 */
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');

const css = `
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
  .note { font-size: 10.5px; color: #444; margin-top: 10px; line-height: 1.5; }
`;

/** The $180 dinner, reused by the duplicate-submission case so the two are identical. */
const teamDinner = `
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
`;

const cases = [
  { folder: 'test1', body: teamDinner },

  {
    folder: 'test2',
    body: `
      <h1>BISTRO NORD</h1>
      <div class="sub">88 Beacon Street<br>Boston, MA 02108<br>(617) 555-0198</div>
      <hr>
      <table>
        <tr><td>Date</td><td class="r">02 Sep 2026  20:05</td></tr>
        <tr><td>Table</td><td class="r">6  /  Guests: 3</td></tr>
      </table>
      <hr>
      <table>
        <tr><td>1 x Duck Confit</td><td class="r">31.00</td></tr>
        <tr><td>1 x Sea Bass</td><td class="r">29.00</td></tr>
        <tr><td>1 x Ratatouille</td><td class="r">22.00</td></tr>
        <tr><td>3 x Mineral Water</td><td class="r">9.00</td></tr>
      </table>
      <hr>
      <table>
        <tr><td>Subtotal</td><td class="r">91.00</td></tr>
        <tr><td>Sales Tax</td><td class="r">5.00</td></tr>
        <tr class="tot"><td>TOTAL USD</td><td class="r">$96.00</td></tr>
      </table>
      <hr>
      <table>
        <tr><td>VISA ****4417</td><td class="r">APPROVED</td></tr>
      </table>
      <div class="note">NO ALCOHOL SERVED</div>
      <div class="foot">ITEMIZED RECEIPT</div>
    `,
  },

  {
    folder: 'test3',
    body: `
      <h1>NORTHGATE MALL</h1>
      <div class="sub">Gift Card Services Desk<br>Seattle, WA 98125</div>
      <hr>
      <table>
        <tr><td>Date</td><td class="r">04 Sep 2026  14:11</td></tr>
        <tr><td>Register</td><td class="r">07</td></tr>
      </table>
      <hr>
      <table>
        <tr><td>2 x GIFT CARD $25.00</td><td class="r">50.00</td></tr>
        <tr><td>Activation Fee</td><td class="r">0.00</td></tr>
      </table>
      <hr>
      <table>
        <tr class="tot"><td>TOTAL USD</td><td class="r">$50.00</td></tr>
      </table>
      <hr>
      <table>
        <tr><td>VISA ****4417</td><td class="r">APPROVED</td></tr>
      </table>
      <div class="note">Gift cards are non-refundable and<br>redeemable for merchandise only.</div>
      <div class="foot">ITEMIZED RECEIPT</div>
    `,
  },

  {
    folder: 'test4',
    body: `
      <h1>HARBOR SUITES</h1>
      <div class="sub">410 Water Street<br>Portland, ME 04101<br>(207) 555-0166</div>
      <hr>
      <table>
        <tr><td>Guest</td><td class="r">B. LISKOV</td></tr>
        <tr><td>Check in</td><td class="r">16 Apr 2026</td></tr>
        <tr><td>Check out</td><td class="r">18 Apr 2026</td></tr>
        <tr><td>Nights</td><td class="r">2</td></tr>
      </table>
      <hr>
      <table>
        <tr><td>Room (2 x 95.00)</td><td class="r">190.00</td></tr>
        <tr><td>City Tax</td><td class="r">12.00</td></tr>
        <tr><td>Wifi</td><td class="r">8.00</td></tr>
      </table>
      <hr>
      <table>
        <tr class="tot"><td>TOTAL USD</td><td class="r">$210.00</td></tr>
      </table>
      <hr>
      <table>
        <tr><td>VISA ****4417</td><td class="r">PAID 18 APR 2026</td></tr>
      </table>
      <div class="foot">ITEMIZED FOLIO<br>Thank you for your stay</div>
    `,
  },

  {
    folder: 'test5',
    body: `
      <h1>PIXELWORKS DIRECT</h1>
      <div class="sub">Online Electronics Retailer<br>invoice@pixelworksdirect.example<br>Order #PW-884213</div>
      <hr>
      <table>
        <tr><td>Invoice date</td><td class="r">01 Sep 2026</td></tr>
        <tr><td>Bill to</td><td class="r">A. LOVELACE</td></tr>
      </table>
      <hr>
      <table>
        <tr><td>1 x 14" Laptop, 32GB</td><td class="r">720.00</td></tr>
        <tr><td>1 x USB-C Dock</td><td class="r">95.00</td></tr>
        <tr><td>Shipping</td><td class="r">0.00</td></tr>
      </table>
      <hr>
      <table>
        <tr><td>Subtotal</td><td class="r">815.00</td></tr>
        <tr><td>Sales Tax</td><td class="r">45.00</td></tr>
        <tr class="tot"><td>TOTAL USD</td><td class="r">$860.00</td></tr>
      </table>
      <hr>
      <table>
        <tr><td>PERSONAL CARD ****2290</td><td class="r">PAID</td></tr>
      </table>
      <div class="note">Paid personally. Reimbursement requested.</div>
      <div class="foot">TAX INVOICE</div>
    `,
  },

  {
    folder: 'test6',
    body: `
      <h1>ZUR ALTEN LATERNE</h1>
      <div class="sub">Oranienburger Stra&szlig;e 41<br>10117 Berlin, Deutschland<br>USt-IdNr. DE812447901</div>
      <hr>
      <table>
        <tr><td>Datum</td><td class="r">03 Sep 2026  20:18</td></tr>
        <tr><td>Tisch</td><td class="r">11  /  Personen: 1</td></tr>
      </table>
      <hr>
      <table>
        <tr><td>1 x Rinderroulade</td><td class="r">28,50</td></tr>
        <tr><td>1 x Kartoffelsuppe</td><td class="r">8,50</td></tr>
        <tr><td>1 x Gemischter Salat</td><td class="r">7,50</td></tr>
        <tr><td>1 x Apfelstrudel</td><td class="r">8,50</td></tr>
        <tr><td>3 x Mineralwasser</td><td class="r">13,50</td></tr>
        <tr><td>2 x Kaffee</td><td class="r">6,00</td></tr>
      </table>
      <hr>
      <table>
        <tr><td>Zwischensumme</td><td class="r">72,50</td></tr>
        <tr><td>Trinkgeld</td><td class="r">10,00</td></tr>
        <tr class="tot"><td>GESAMT EUR</td><td class="r">82,50 &euro;</td></tr>
      </table>
      <div class="note">Alle Preise inkl. MwSt 19%. Keine alkoholischen Getr&auml;nke.</div>
      <hr>
      <table>
        <tr><td>Kartenzahlung</td><td class="r">GENEHMIGT</td></tr>
      </table>
      <div class="foot">RECHNUNG<br>Vielen Dank f&uuml;r Ihren Besuch</div>
    `,
  },

  // Byte-for-byte the same meal as test1: that is the point of the duplicate case.
  { folder: 'test7', body: teamDinner },

  {
    folder: 'test9',
    body: `
      <h1>CORNER & CO COFFEE</h1>
      <div class="sub">231 W Superior St<br>Chicago, IL 60654</div>
      <hr>
      <table>
        <tr><td>Date</td><td class="r">05 Sep 2026  08:26</td></tr>
        <tr><td>Order</td><td class="r">142</td></tr>
      </table>
      <hr>
      <table>
        <tr><td>4 x Filter Coffee</td><td class="r">14.00</td></tr>
        <tr><td>4 x Breakfast Roll</td><td class="r">18.00</td></tr>
      </table>
      <hr>
      <table>
        <tr><td>Subtotal</td><td class="r">32.00</td></tr>
        <tr><td>Tax</td><td class="r">2.00</td></tr>
        <tr class="tot"><td>TOTAL USD</td><td class="r">$34.00</td></tr>
      </table>
      <hr>
      <table>
        <tr><td>VISA ****4417</td><td class="r">APPROVED</td></tr>
      </table>
      <div class="foot">ITEMIZED RECEIPT</div>
    `,
  },
];

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 420, height: 900 }, deviceScaleFactor: 2 });

for (const { folder, body } of cases) {
  const target = join(repoRoot, 'test-cases', folder, 'receipt.png');
  mkdirSync(dirname(target), { recursive: true });

  const html = `<!doctype html><html><head><meta charset="utf-8"><style>${css}</style></head>
    <body><div class="receipt">${body}</div></body></html>`;

  await page.setContent(html, { waitUntil: 'load' });
  await page.locator('.receipt').screenshot({ path: target });
  console.log(`  wrote test-cases/${folder}/receipt.png`);
}

await browser.close();
console.log(`\n${cases.length} receipts written.`);
