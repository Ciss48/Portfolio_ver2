import puppeteer from 'puppeteer';
import { mkdir, readdir } from 'fs/promises';
import { join } from 'path';

const url = process.argv[2] || 'http://localhost:3000';
const label = process.argv[3] || '';
const dir = './temporary screenshots';

await mkdir(dir, { recursive: true });
const files = await readdir(dir);
const nums = files.map(f => parseInt(f.match(/screenshot-(\d+)/)?.[1])).filter(Boolean);
const next = (nums.length ? Math.max(...nums) : 0) + 1;
const name = label ? `screenshot-${next}-${label}.png` : `screenshot-${next}.png`;

const browser = await puppeteer.launch({
  headless: 'new',
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
});
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });
await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });

// Scroll through the page to trigger IntersectionObserver animations
await page.evaluate(async () => {
  const delay = ms => new Promise(r => setTimeout(r, ms));
  const step = 300;
  for (let y = 0; y <= document.body.scrollHeight; y += step) {
    window.scrollTo(0, y);
    await delay(80);
  }
  window.scrollTo(0, document.body.scrollHeight);
  await delay(300);
  window.scrollTo(0, 0);
  await delay(200);
});
await new Promise(r => setTimeout(r, 600));

await page.screenshot({ path: join(dir, name), fullPage: true });
await browser.close();
console.log(`Saved: ${join(dir, name)}`);
