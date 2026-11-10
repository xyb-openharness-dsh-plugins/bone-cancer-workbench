#!/usr/bin/env node
/**
 * 全量路由渲染探针（M2 闸口 · 改编自 templates/probe-all-routes.mjs）
 * 穷举 prototypes/v0.2/app.js 的 ROUTES 全部叶子 × 两套演示档案，逐路由断言
 * 「渲染非空 + 页头档案名」，并做 A/B 切档不串档的可见证据断言。产出截图与 report.json。
 * 用法：node scripts/probe-m2.mjs --url http://127.0.0.1:8321/prototypes/v0.2/index.html
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { existsSync } from 'node:fs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SHOTS = join(ROOT, 'docs', 'shots', 'm2');
mkdirSync(join(SHOTS, 'A'), { recursive: true });
mkdirSync(join(SHOTS, 'B'), { recursive: true });
const args = process.argv.slice(2);
const argOf = (n) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : null };

/* 与 prototypes/v0.2/app.js 的 ROUTES 一一对应（check-probe-coverage 会核对） */
const ROUTES = [
  'dashboard',
  'records', 'records/1', 'records/2', 'records/3', 'records/4',
  'imaging', 'imaging/1', 'imaging/2',
  'stage', 'stage/1', 'stage/2',
  'treatment', 'treatment/1', 'treatment/2',
  'function', 'function/1', 'function/2', 'function/3',
  'labs', 'labs/1', 'labs/2',
  'timeline', 'timeline/1', 'timeline/2',
  'trials', 'trials/1', 'trials/2'
];

function findChrome() {
  return [process.env.CHROME_PATH, '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/Applications/Chromium.app/Contents/MacOS/Chromium']
    .filter(Boolean).find(p => existsSync(p)) || null;
}

async function main() {
  const require = createRequire('/Users/qinxiaoqiang/.workbuddy/binaries/node/workspace/');
  const puppeteer = require('puppeteer-core')
  const base = argOf('--url') || 'http://127.0.0.1:8321/prototypes/v0.2/index.html'
  const browser = await puppeteer.launch({
    executablePath: findChrome(), headless: 'new',
    args: ['--no-sandbox', '--disable-dev-shm-usage']
  })
  const page = await browser.newPage()
  await page.setViewport({ width: 1440, height: 940 })
  const report = { screenshots: 0, errors: [], assertions: {}, routeResults: [] }
  try {
    await page.goto(base, { waitUntil: 'networkidle0' })
    const booted = await page.evaluate(() => !!document.querySelector('#nav .nav-button'))
    if (!booted) report.errors.push('原型未启动：#nav 无按钮')

    for (const prof of ['A', 'B']) {
      await page.evaluate(() => { location.hash = '#dashboard'; })
      await new Promise(r => setTimeout(r, 200))
      await page.click('#profile-btn'); await new Promise(r => setTimeout(r, 250))
      const picked = await page.evaluate((p) => {
        const b = [...document.querySelectorAll('[data-pick-profile]')].find(x => x.dataset.pickProfile === p);
        if (!b) return false; b.click(); return true;
      }, prof)
      if (!picked) report.errors.push(`档案 ${prof}：切换入口未命中`)
      await new Promise(r => setTimeout(r, 300))
      const profName = await page.evaluate(() => (document.getElementById('profile-name') || { textContent: '' }).textContent.trim())
      report.assertions[`name_${prof}`] = profName
      if (!profName) report.errors.push(`档案 ${prof}：页头未显示档案名`)
      for (const route of ROUTES) {
        await page.evaluate((r) => { location.hash = '#' + r; window.dispatchEvent(new Event('hashchange')); }, route)
        await new Promise(r => setTimeout(r, 200))
        const mainLen = await page.evaluate(() => document.getElementById('main') ? document.getElementById('main').innerHTML.length : 0)
        if (!(mainLen > 200)) report.errors.push(`${prof}/${route}: 渲染过空（innerHTML=${mainLen}）`)
        report.routeResults.push({ profile: prof, route, mainLen })
        await page.screenshot({ path: join(SHOTS, prof, `${route.replace('/', '__')}.png`) })
        report.screenshots += 1
      }
    }
    const na = report.assertions.name_A, nb = report.assertions.name_B;
    if (!na || !nb) report.errors.push(`A/B 页头不可用：${na} / ${nb}`)
    else if (na === nb) report.errors.push(`A/B 档案页头相同（${na}）——两套数据未生效或串档`)
  } catch (err) {
    report.errors.push(`probe crashed: ${err.message}`)
  } finally {
    writeFileSync(join(SHOTS, 'report.json'), JSON.stringify(report, null, 1));
    console.log(`routes walked: ${report.routeResults.length}  screenshots: ${report.screenshots}  errors: ${report.errors.length}`);
    for (const e of report.errors.slice(0, 20)) console.log(`FAIL ${e}`);
    await browser.close();
    process.exit(report.errors.length ? 1 : 0);
  }
}
main().catch(e => { console.error('探针自身出错：', e); process.exit(2) })
