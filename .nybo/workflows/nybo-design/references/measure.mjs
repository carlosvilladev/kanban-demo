#!/usr/bin/env node
/**
 * measure.mjs — gate numérico del skill nybo-design.
 *
 * Mide el render real (getComputedStyle + getBoundingClientRect) contra
 * design/design.spec.json y produce un delta-report con correcciones exactas.
 * El LLM nunca es el gate: este script lo es.
 *
 * Uso:
 *   node measure.mjs --url http://localhost:3000 [--spec design/design.spec.json]
 *                    [--out design/delta-report.json] [--log design/fidelity-log.jsonl]
 *                    [--iteration N]
 *
 * Exit codes: 0 = PASS · 1 = FAIL (hay deltas) · 2 = error de uso/entorno
 * Requiere: npm i -D playwright && npx playwright install chromium
 */
import { readFileSync, writeFileSync, appendFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { chromium } from 'playwright';

function arg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`);
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}

const url = arg('url');
const specPath = resolve(arg('spec', 'design/design.spec.json'));
const outPath = resolve(arg('out', 'design/delta-report.json'));
const logPath = resolve(arg('log', 'design/fidelity-log.jsonl'));
const iteration = Number(arg('iteration', '0'));

if (!url) {
  console.error('Falta --url <dev-server-url>');
  process.exit(2);
}

const spec = JSON.parse(readFileSync(specPath, 'utf8'));
if (!Array.isArray(spec.nodes) || spec.nodes.length === 0) {
  console.error(`Spec sin nodos: ${specPath}`);
  process.exit(2);
}

const viewport = spec.viewport ?? { width: 1440, height: 900 };
const TOL = {
  exact: spec.tolerance?.px ?? 1,
  estimated: spec.tolerance?.estimatedPx ?? 3,
  colorChannel: spec.tolerance?.colorChannel ?? 3,
};

// ---------- helpers de comparación ----------
const round2 = (n) => Math.round(n * 100) / 100;

function parsePx(v) {
  const m = /^(-?\d+(?:\.\d+)?)px$/.exec(String(v).trim());
  return m ? parseFloat(m[1]) : null;
}

function parseColor(v) {
  const s = String(v).trim().toLowerCase();
  let m = /^#([0-9a-f]{3})$/.exec(s);
  if (m) {
    const [r, g, b] = m[1].split('').map((c) => parseInt(c + c, 16));
    return [r, g, b, 1];
  }
  m = /^#([0-9a-f]{6})([0-9a-f]{2})?$/.exec(s);
  if (m) {
    const h = m[1];
    return [
      parseInt(h.slice(0, 2), 16),
      parseInt(h.slice(2, 4), 16),
      parseInt(h.slice(4, 6), 16),
      m[2] ? parseInt(m[2], 16) / 255 : 1,
    ];
  }
  m = /^rgba?\(([^)]+)\)$/.exec(s);
  if (m) {
    const p = m[1].split(/[\s,\/]+/).filter(Boolean).map(Number);
    return [p[0], p[1], p[2], p[3] ?? 1];
  }
  return null;
}

const normWeight = (v) => ({ normal: '400', bold: '700' }[String(v).toLowerCase()] ?? String(v));

function compareValue(prop, expected, actual, tolPx) {
  if (actual === undefined || actual === null) {
    return { pass: false, expected, actual: 'undefined' };
  }
  if (typeof expected === 'number' && typeof actual === 'number') {
    const delta = round2(actual - expected);
    return { pass: Math.abs(delta) <= tolPx, expected, actual: round2(actual), delta: `${delta >= 0 ? '+' : ''}${delta}px` };
  }
  const ep = parsePx(expected), ap = parsePx(actual);
  if (ep !== null && ap !== null) {
    const delta = round2(ap - ep);
    return { pass: Math.abs(delta) <= tolPx, expected, actual, delta: `${delta >= 0 ? '+' : ''}${delta}px` };
  }
  const ec = parseColor(expected), ac = parseColor(actual);
  if (ec && ac) {
    const maxCh = Math.max(...[0, 1, 2].map((i) => Math.abs(ec[i] - ac[i])));
    const alphaOk = Math.abs(ec[3] - ac[3]) <= 0.02;
    return { pass: maxCh <= TOL.colorChannel && alphaOk, expected, actual, delta: `maxChannelΔ=${maxCh}` };
  }
  let e = String(expected).trim().toLowerCase();
  let a = String(actual).trim().toLowerCase();
  if (prop === 'fontWeight') { e = normWeight(e); a = normWeight(a); }
  if (prop === 'fontFamily') {
    return { pass: a.includes(e.replace(/['"]/g, '')), expected, actual };
  }
  return { pass: e === a, expected, actual };
}

// ---------- medición en el browser ----------
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
  // Esperar webfonts. NOTA: string plano a evaluate(), no función — evita el
  // name-mangling de tsx (__name is not defined) si alguien corre esto via tsx.
  await page.evaluate('document.fonts ? document.fonts.ready.then(() => true) : true');
  await page.waitForTimeout(250); // settle

  const probes = spec.nodes.map((n) => ({
    id: n.id,
    selector: n.selector || `[data-design-id="${n.id}"]`,
    styleProps: Object.keys(n.expect?.styles ?? {}),
    children: n.expect?.children ?? null,
  }));

  const measured = await page.evaluate(`(() => {
    const probes = ${JSON.stringify(probes)};
    const r2 = (n) => Math.round(n * 100) / 100;
    const out = {};
    for (const p of probes) {
      const el = document.querySelector(p.selector);
      if (!el) { out[p.id] = { missing: true }; continue; }
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      const styles = {};
      for (const prop of p.styleProps) styles[prop] = cs[prop];
      const children = {};
      if (p.children) for (const sel of Object.keys(p.children)) children[sel] = el.querySelectorAll(sel).length;
      out[p.id] = {
        rect: { x: r2(r.x), y: r2(r.y), width: r2(r.width), height: r2(r.height),
                top: r2(r.top), right: r2(r.right), bottom: r2(r.bottom), left: r2(r.left) },
        styles, children,
      };
    }
    return out;
  })()`);

  // ---------- comparación ----------
  const checks = [];
  const failures = [];
  const record = (node, property, result, fix) => {
    checks.push({ node, property, pass: result.pass });
    if (!result.pass) {
      failures.push({ node, property, expected: result.expected, actual: result.actual, delta: result.delta ?? null, fix });
    }
  };

  for (const node of spec.nodes) {
    const tolPx = node.confidence === 'estimated' ? TOL.estimated : TOL.exact;
    const m = measured[node.id];
    if (!m || m.missing) {
      checks.push({ node: node.id, property: 'presence', pass: false });
      failures.push({
        node: node.id, property: 'presence', expected: 'elemento presente', actual: 'NOT FOUND', delta: null,
        fix: `Agregar data-design-id="${node.id}" al elemento que implementa este nodo`,
      });
      continue;
    }
    for (const [k, v] of Object.entries(node.expect?.box ?? {})) {
      record(node.id, `box.${k}`, compareValue(k, v, m.rect[k], tolPx),
        `Ajustar ${k} de [data-design-id="${node.id}"]: actual ${m.rect[k]}px, spec ${v}px`);
    }
    for (const [k, v] of Object.entries(node.expect?.styles ?? {})) {
      record(node.id, `styles.${k}`, compareValue(k, v, m.styles[k], tolPx),
        `Setear ${k}: ${v} en [data-design-id="${node.id}"] (actual: ${m.styles[k]})`);
    }
    for (const [sel, count] of Object.entries(node.expect?.children ?? {})) {
      const actual = m.children?.[sel] ?? 0;
      record(node.id, `children(${sel})`,
        { pass: actual === count, expected: count, actual, delta: `${actual - count >= 0 ? '+' : ''}${actual - count}` },
        `Debe haber exactamente ${count} "${sel}" dentro de [data-design-id="${node.id}"]; hay ${actual}`);
    }
    for (const gap of node.gaps ?? []) {
      const other = measured[gap.to];
      if (!other || other.missing) {
        record(node.id, `gap(${gap.edge})→${gap.to}`,
          { pass: false, expected: `${gap.px}px`, actual: 'nodo destino ausente' },
          `Agregar data-design-id="${gap.to}" al nodo destino`);
        continue;
      }
      let actual;
      switch (gap.edge) {
        case 'bottom-to-top': actual = other.rect.top - m.rect.bottom; break;
        case 'right-to-left': actual = other.rect.left - m.rect.right; break;
        case 'left-align':    actual = Math.abs(other.rect.left - m.rect.left); break;
        case 'top-align':     actual = Math.abs(other.rect.top - m.rect.top); break;
        default: actual = NaN;
      }
      actual = round2(actual);
      const delta = round2(actual - gap.px);
      record(node.id, `gap(${gap.edge})→${gap.to}`,
        { pass: Number.isFinite(actual) && Math.abs(delta) <= tolPx, expected: `${gap.px}px`, actual: `${actual}px`, delta: `${delta >= 0 ? '+' : ''}${delta}px` },
        `Gap ${gap.edge} de [${node.id}] a [${gap.to}]: actual ${actual}px, spec ${gap.px}px`);
    }
  }

  // ---------- reporte ----------
  const report = {
    url, spec: specPath, viewport, iteration,
    timestamp: new Date().toISOString(),
    summary: { checks: checks.length, failed: failures.length, pass: failures.length === 0 },
    failures,
  };
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, JSON.stringify(report, null, 2));
  appendFileSync(logPath, JSON.stringify({
    iteration, t: report.timestamp, failed: failures.length,
    keys: failures.map((f) => `${f.node}.${f.property}${f.delta ? `:${f.delta}` : ''}`),
  }) + '\n');

  const ok = failures.length === 0;
  console.log(`\nFIDELITY GATE — ${ok ? 'PASS' : 'FAIL'} (${checks.length - failures.length}/${checks.length} checks) · iteración ${iteration}`);
  for (const f of failures) {
    console.log(`  ✗ ${f.node} · ${f.property} → esperado ${JSON.stringify(f.expected)}, actual ${JSON.stringify(f.actual)}${f.delta ? ` (Δ ${f.delta})` : ''}`);
  }
  console.log(`\nReporte: ${outPath}`);
  process.exitCode = ok ? 0 : 1;
} finally {
  await browser.close();
}
