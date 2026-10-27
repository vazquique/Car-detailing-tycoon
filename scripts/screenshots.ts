// Visual review: opens the production build on emulated touch phones and saves screenshots.
// Usage: npm run build && npm run shots   (add --soak to also play 3 minutes at ×20 and check the console)
import { chromium, type Browser, type Page } from 'playwright';
import { preview } from 'vite';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import type { TabId } from '../src/store/uiStore';

const ROOT = resolve(import.meta.dirname, '..');
const OUT = resolve(ROOT, 'screenshots');
const SIZES = [
  { name: '360x780', width: 360, height: 780 },
  { name: '390x844', width: 390, height: 844 },
  { name: '430x932', width: 430, height: 932 },
];

const problems: string[] = [];

// window.__cdt is declared in src/ui/debugApi.ts (only present with ?debug=1).

async function newPage(
  browser: Browser,
  width: number,
  height: number,
  tutorialDone: boolean,
): Promise<Page> {
  const ctx = await browser.newContext({
    viewport: { width, height },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });
  await ctx.addInitScript((done: boolean) => {
    localStorage.setItem(
      'cdt-settings',
      JSON.stringify({
        sound: false,
        vibration: false,
        daySummary: true,
        reducedMotion: false,
        tutorialDone: done,
        tutorialPrices: done,
      }),
    );
  }, tutorialDone);
  const page = await ctx.newPage();
  page.on('console', (m) => {
    if (m.type() === 'error' || m.type() === 'warning')
      problems.push(`[${width}x${height}] console ${m.type()}: ${m.text()}`);
  });
  page.on('pageerror', (e) => problems.push(`[${width}x${height}] pageerror: ${e.message}`));
  return page;
}

async function open(page: Page, url: string): Promise<void> {
  await page.goto(url);
  await page.waitForFunction(() => !!window.__cdt);
  await page.waitForTimeout(600);
}

async function shot(page: Page, dir: string, name: string): Promise<void> {
  await page.waitForTimeout(500);
  // Celebrations and toasts are moments, not states: clear them so each capture shows its screen.
  await page.evaluate(() => window.__cdt?.ui.setState({ celebrations: [], toasts: [] }));
  await page.waitForTimeout(250);
  await page.screenshot({ path: resolve(dir, `${name}.png`) });
}

async function scrubHalf(page: Page): Promise<void> {
  const bay = page.locator('[data-tutorial="owner-bay"]');
  await bay.waitFor();
  const box = await bay.boundingBox();
  if (!box) return;
  await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
  await page.waitForTimeout(700);
  const canvas = page.locator('canvas[style*="touch-action: none"]');
  const cb = await canvas.boundingBox();
  if (!cb) return;
  // A partial pass with the finger (mouse events become pointer events too).
  await page.mouse.move(cb.x + cb.width * 0.3, cb.y + cb.height * 0.2);
  await page.mouse.down();
  for (let i = 0; i < 6; i++) {
    await page.mouse.move(
      cb.x + cb.width * (i % 2 ? 0.3 : 0.7),
      cb.y + cb.height * (0.2 + i * 0.06),
      { steps: 5 },
    );
  }
  await page.mouse.up();
}

async function main(): Promise<void> {
  const soakOnly = process.argv.includes('--soak-only');
  const soak = soakOnly || process.argv.includes('--soak');
  const server = await preview({
    root: ROOT,
    preview: { port: 4319, strictPort: false, open: false },
    logLevel: 'error',
  });
  const base = server.resolvedUrls?.local[0] ?? 'http://localhost:4319/';
  const url = `${base}?debug=1`;
  const browser = await chromium.launch();
  try {
    for (const size of soakOnly ? [] : SIZES) {
      const dir = resolve(OUT, size.name);
      mkdirSync(dir, { recursive: true });

      // 1. First launch with the tutorial.
      let page = await newPage(browser, size.width, size.height, false);
      await open(page, url);
      await shot(page, dir, '01-inicio-tutorial');
      await page.waitForTimeout(3000);
      await shot(page, dir, '02-tutorial-toca-el-auto');
      await page.context().close();

      // 2. Garage with cars in progress, then the mini-game halfway.
      page = await newPage(browser, size.width, size.height, true);
      await open(page, url);
      await page.evaluate(() => {
        window.__cdt?.debug.stage('garage');
        window.__cdt?.debug.advance(6);
      });
      await shot(page, dir, '03-cochera-en-proceso');
      await scrubHalf(page);
      await shot(page, dir, '04-minijuego-a-la-mitad');
      await page.context().close();

      // 3. The six tabs (Local in the neighborhood, mid game).
      page = await newPage(browser, size.width, size.height, true);
      await open(page, url);
      await page.evaluate(() => {
        window.__cdt?.debug.stage('nave');
        window.__cdt?.debug.advance(20);
      });
      for (const tab of [
        'workshop',
        'services',
        'staff',
        'upgrades',
        'marketing',
        'business',
      ] as TabId[]) {
        await page.evaluate((t) => window.__cdt?.ui.getState().setTab(t), tab);
        await shot(page, dir, `05-pestana-${tab}`);
      }
      await page.evaluate(() => window.__cdt?.ui.getState().setTab(null));
      await shot(page, dir, '06-nave-llena');
      // Day summary.
      await page.evaluate(() => window.__cdt?.debug.endDay());
      await page.waitForTimeout(3400);
      await shot(page, dir, '07-resumen-del-dia');
      await page.context().close();

      // 4. Premium studio and the franchise screen.
      page = await newPage(browser, size.width, size.height, true);
      await open(page, url);
      await page.evaluate(() => {
        window.__cdt?.debug.stage('franchise');
        window.__cdt?.debug.advance(15);
      });
      await shot(page, dir, '08-estudio-premium');
      await page.evaluate(() => window.__cdt?.ui.getState().openModal({ kind: 'franchise' }));
      await shot(page, dir, '09-franquicia');
      await page.evaluate(() => window.__cdt?.ui.getState().openModal({ kind: 'settings' }));
      await shot(page, dir, '10-ajustes');
      await page.context().close();
      console.log(`Capturas listas: ${size.name}`);
    }

    // Landscape: "rotate your phone" notice.
    if (!soakOnly) {
      const land = await newPage(browser, 844, 390, true);
      await open(land, url);
      await shot(land, OUT, 'horizontal-gira-tu-celular');
      await land.context().close();
    }

    if (soak) {
      console.log('Jugando 3 minutos a ×20...');
      const page = await newPage(browser, 390, 844, true);
      await open(page, url);
      await page.evaluate(() => window.__cdt?.debug.speed(20));
      const tabs: (TabId | null)[] = [
        'workshop',
        'services',
        'staff',
        'upgrades',
        'marketing',
        'business',
        null,
      ];
      const end = Date.now() + 180_000;
      let i = 0;
      while (Date.now() < end) {
        const bays = page.locator('[data-bay]');
        const n = await bays.count();
        if (n > 0) {
          const box = await bays.nth(i % n).boundingBox();
          if (box) await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height * 0.4);
        }
        if (i % 15 === 0)
          await page.evaluate(
            (t) => window.__cdt?.ui.getState().setTab(t),
            tabs[(i / 15) % tabs.length] ?? null,
          );
        // Close the mini-game if a tap opened it.
        const auto = page.getByText('Que se termine solo');
        if (await auto.count())
          await auto
            .first()
            .click({ timeout: 1000 })
            .catch(() => undefined);
        await page.waitForTimeout(400);
        i++;
      }
      await shot(page, OUT, 'soak-final');
      await page.context().close();
    }
  } finally {
    await browser.close();
    await new Promise<void>((r) => server.httpServer.close(() => r()));
  }
  if (problems.length > 0) {
    console.log('Problemas en la consola:');
    for (const p of problems) console.log(' -', p);
    process.exitCode = 1;
  } else {
    console.log('Sin errores ni advertencias en la consola.');
  }
}

void main();
