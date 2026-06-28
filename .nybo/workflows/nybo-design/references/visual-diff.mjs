#!/usr/bin/env node
/**
 * visual-diff.mjs — gate visual FINAL del skill nybo-design.
 *
 * Se corre SOLO después de que el gate numérico (measure.mjs) pasa.
 * Atrapa lo que los números no ven: sombras, gradientes, bordes, assets,
 * antialiasing. Compara screenshot del render vs design/reference.png.
 *
 * Uso:
 *   node visual-diff.mjs --url http://localhost:3000 --ref design/reference.png
 *                        [--spec design/design.spec.json] [--selector "[data-design-id=root]"]
 *                        [--out design/visual-diff.png] [--max-ratio 0.01] [--threshold 0.1]
 *
 * Exit codes: 0 = PASS · 1 = FAIL · 2 = error (ej. dimensiones distintas)
 * Requiere: npm i -D playwright pixelmatch pngjs
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { chromium } from 'playwright';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';

function arg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`);
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}

const url = arg('url');
const refPath = resolve(arg('ref', 'design/reference.png'));
const specPath = resolve(arg('spec', 'design/design.spec.json'));
const selector = arg('selector', null);
const outPath = resolve(arg('out', 'design/visual-diff.png'));
const maxRatio = Number(arg('max-ratio', '0.01'));
const threshold = Number(arg('threshold', '0.1'));

if (!url) { console.error('Falta --url'); process.exit(2); }
if (!existsSync(refPath)) { console.error(`No existe la referencia: ${refPath}`); process.exit(2); }

const spec = existsSync(specPath) ? JSON.parse(readFileSync(specPath, 'utf8')) : {};
const viewport = spec.viewport ?? { width: 1440, height: 900 };

const browser = await chromium.launch();
try {
  const page = await browser.newPage({
    viewport: { width: viewport.width, height: viewport.height },
    deviceScaleFactor: viewport.deviceScaleFactor ?? 1,
  });
  await page.goto(url, { waitUntil: 'load', timeout: 30000 });
  if (spec.readySelector) await page.waitForSelector(spec.readySelector, { timeout: 15000 });
  await page.addStyleTag({
    content: '*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important}',
  });
  await page.evaluate('document.fonts ? document.fonts.ready.then(() => true) : true');
  await page.waitForTimeout(250);

  const shot = selector
    ? await page.locator(selector).screenshot()
    : await page.screenshot({ fullPage: false });

  const actual = PNG.sync.read(shot);
  const ref = PNG.sync.read(readFileSync(refPath));

  if (actual.width !== ref.width || actual.height !== ref.height) {
    console.error(
      `Dimensiones distintas: render ${actual.width}x${actual.height} vs referencia ${ref.width}x${ref.height}.\n` +
      `Exportar la referencia desde Figma a escala 1x con el mismo ancho del viewport del spec, ` +
      `o usar --selector para capturar solo el frame equivalente.`
    );
    process.exit(2);
  }

  const diff = new PNG({ width: ref.width, height: ref.height });
  const diffPixels = pixelmatch(ref.data, actual.data, diff.data, ref.width, ref.height, { threshold });
  const ratio = diffPixels / (ref.width * ref.height);
  writeFileSync(outPath, PNG.sync.write(diff));

  const ok = ratio <= maxRatio;
  console.log(
    `\nVISUAL GATE — ${ok ? 'PASS' : 'FAIL'} · diff ${(ratio * 100).toFixed(3)}% ` +
    `(máx ${(maxRatio * 100).toFixed(2)}%) · ${diffPixels} px distintos\nDiff visual: ${outPath}`
  );
  process.exitCode = ok ? 0 : 1;
} finally {
  await browser.close();
}
