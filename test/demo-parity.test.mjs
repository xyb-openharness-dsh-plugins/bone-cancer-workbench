/**
 * demo 数据同源校验（3.1）
 *
 * 为什么要有这个测试：`demo/demo-data.sqlite` 与 `prototypes/v0.2/demo-data.js`
 * 是**同一份数据的两份产物**，一个给 3.2 的接口用，一个给原型用。
 * 食管癌那轮靠人眼比过两次，第三次就漏了一个标题列——标题对不上，
 * 原型里那一节就整块消失，而且不报错。
 *
 * 这里做的是逐项相等断言：分节标题 / 行数 / 指标元数据 / 数据点 / 试验条数。
 * 另外钉住骨癌口径里最容易被写错的两条（私密默认、无肿瘤标志物语义）。
 *
 * 用法：node --disable-warning=ExperimentalWarning --test test/demo-parity.test.mjs
 */
import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const DB = join(ROOT, 'demo/demo-data.sqlite');
const JS = join(ROOT, 'prototypes/v0.2/demo-data.js');

/* demo-data.js 是给浏览器用的（挂 window），这里给个假 window 把它取出来。 */
function loadDemoData() {
  const code = readFileSync(JS, 'utf8');
  const sandbox = { window: {} };
  new Function('window', code)(sandbox.window);
  assert.ok(sandbox.window.DEMO_DATA, 'demo-data.js 没有产出 window.DEMO_DATA');
  return sandbox.window.DEMO_DATA;
}

const data = loadDemoData();
const db = new DatabaseSync(DB);
const keys = Object.keys(data.profiles);

test('两个档案的标量字段与 subjects 表一致', () => {
  const rows = db.prepare('SELECT profile_key, name, stage, histology, biopsy_note, dash_keys FROM subjects ORDER BY profile_key').all();
  assert.equal(rows.length, keys.length, 'subjects 行数与 demo-data 档案数不一致');
  for (const row of rows) {
    const p = data.profiles[row.profile_key];
    assert.ok(p, `demo-data 里没有档案 ${row.profile_key}`);
    assert.equal(p.name, row.name);
    assert.equal(p.stage, row.stage, '分期必须是标量文字（医生给出，不能被分节对象覆盖成 [object Object]）');
    assert.equal(typeof p.stage, 'string');
    assert.equal(p.histology, row.histology);
    assert.equal(p.biopsyNote, row.biopsy_note);
    assert.deepEqual(p.dash_keys, JSON.parse(row.dash_keys));
  }
});

test('分节标题逐条一致（section_titles 表 vs demo-data 的分节对象）', () => {
  for (const k of keys) {
    const p = data.profiles[k];
    const jsSections = Object.entries(p)
      .filter(([, v]) => v && Array.isArray(v.rows))
      .map(([key, v]) => ({ key, title: v.title, n: v.rows.length }))
      .sort((a, b) => (a.key < b.key ? -1 : a.key > b.key ? 1 : 0)); // 与 SQLite 的 BINARY 排序一致（大小写敏感）
    const dbSections = db.prepare('SELECT key, title FROM section_titles WHERE profile_key = ? ORDER BY key').all(k);
    assert.equal(jsSections.length, dbSections.length, `${k} 分节数不一致：js ${jsSections.length} / db ${dbSections.length}`);
    for (let i = 0; i < jsSections.length; i += 1) {
      assert.equal(jsSections[i].key, dbSections[i].key, `${k} 第 ${i + 1} 节 key 不一致`);
      assert.equal(jsSections[i].title, dbSections[i].title, `${k}.${jsSections[i].key} 标题不一致（标题错了这一节在原型里会整块消失）`);
    }
  }
});

test('指标元数据与 metrics 表一致，且分类指标不带 unit', () => {
  for (const k of keys) {
    const p = data.profiles[k];
    const rows = db.prepare('SELECT key, name, unit, cat, color, dec, kind, band_low, band_high FROM metrics WHERE profile_key = ? ORDER BY key').all(k);
    assert.equal(rows.length, p.metrics.length, `${k} 指标数不一致`);
    const byKey = new Map(p.metrics.map((m) => [m.key, m]));
    for (const row of rows) {
      const m = byKey.get(row.key);
      assert.ok(m, `${k} demo-data 缺指标 ${row.key}`);
      assert.equal(m.name, row.name);
      assert.equal(m.cat, row.cat);
      assert.equal(m.dec, row.dec);
      /* kind 是库侧口径：数值=numeric、分类=qual；js 侧契约不写 kind */
      assert.equal(row.kind, row.dec === null ? 'qual' : 'numeric');
      assert.equal(m.unit ?? null, row.unit, `${k}.${row.key} 单位不一致`);
      const band = row.band_low === null ? null : [row.band_low, row.band_high];
      assert.deepEqual(m.band ?? null, band, `${k}.${row.key} 参考范围不一致`);
      if (row.dec === null) {
        assert.equal(row.unit, null, `${k}.${row.key} 是分类指标，unit 必须是 NULL 而不是空字符串`);
        assert.notEqual(row.kind, 'numeric');
      } else {
        assert.equal(row.kind, 'numeric');
      }
    }
  }
});

test('数据点数量与类型一致，数值/文字互斥', () => {
  for (const k of keys) {
    for (const m of data.profiles[k].metrics) {
      const rows = db.prepare('SELECT v_num, v_text FROM metric_points WHERE profile_key = ? AND metric_key = ? ORDER BY d, ord').all(k, m.key);
      assert.equal(rows.length, m.points.length, `${k}.${m.key} 点数不一致`);
      for (let i = 0; i < rows.length; i += 1) {
        const js = m.points[i].v;
        if (typeof js === 'number') {
          assert.equal(rows[i].v_text, null, `${k}.${m.key} 第 ${i + 1} 点：数值指标不得写 v_text`);
          assert.equal(rows[i].v_num, js);
        } else {
          assert.equal(rows[i].v_num, null, `${k}.${m.key} 第 ${i + 1} 点：分类指标不得写 v_num`);
          assert.equal(rows[i].v_text, js);
        }
      }
    }
  }
});

test('口径 E（骨癌）：骨与肿瘤相关指标只有 ALP/LDH，无肿瘤标志物语义', () => {
  const has = (k, key) => data.profiles[k].metrics.some((m) => m.key === key);
  for (const k of keys) {
    assert.ok(has(k, 'alp'), `${k} 应有碱性磷酸酶 ALP`);
    assert.ok(!has(k, 'scc') && !has(k, 'cea') && !has(k, 'ca125'), `${k} 不得出现肿瘤标志物（SCC/CEA/CA125）语义`);
    for (const m of data.profiles[k].metrics) {
      if (m.cat === '自评与功能' && m.dec === null) assert.equal(m.unit, undefined, `${k}.${m.key} 分类自评指标不得带 unit`);
    }
  }
});

test('口径 D（骨癌）：viewpoints 默认私密；帮助计划是医生原话占位', () => {
  /* 骨癌没有 vagina/sexual 表（ cervical 语义不许回流，leftover-allow：裁剪声明）；私密内容 = viewpoints，
     读模型默认不返回原文，三出口显式过滤（见 dsh/readmodels.js）。 */
  assert.ok(Array.isArray(data.profiles.A.viewpoints) && data.profiles.A.viewpoints.length > 0, 'A 档案应有感受记录');
  assert.ok(Array.isArray(data.profiles.A.helpPlan.rows), 'A 档案应有医生行动计划占位');
  assert.ok(/联系/.test(data.profiles.A.helpPlan.rows[0][1]), '行动计划是「若出现 X 联系 Y」式原话，不是分期判定');
});

test('试验表：条数与 nct_id 一致，都有 topic 与 last_verified', () => {
  const rows = db.prepare('SELECT nct_id, title, topic, last_verified FROM trials ORDER BY nct_id').all();
  assert.equal(rows.length, data.trials.length, 'trials 条数不一致');
  const jsIds = data.trials.map((t) => t.id).sort();
  assert.deepEqual(rows.map((r) => r.nct_id), jsIds);
  for (const row of rows) {
    assert.match(row.nct_id, /^NCT\d{8}$/);
    assert.ok(row.topic, `${row.nct_id} 缺 topic，筛选标签会空`);
    assert.match(row.last_verified, /^\d{4}-\d{2}-\d{2}$/, `${row.nct_id} 缺核对日期`);
  }
});

test('定长数组契约：events / docs / candidates 是数组而不是对象', () => {
  for (const k of keys) {
    const p = data.profiles[k];
    assert.ok(Array.isArray(p.events), `${k}.events 必须是 [日期, 名称] 定长数组`);
    assert.ok(p.events.every((e) => Array.isArray(e) && e.length === 2));
    assert.ok(Array.isArray(p.docs), `${k}.docs 必须是定长数组`);
    assert.ok(p.docs.every((d) => Array.isArray(d) && d.length === 5), `${k}.docs 每行必须 5 个值 [id, 名称, 日期, 类型, 状态]`);
    assert.ok(Array.isArray(p.candidates));
    assert.ok(p.candidates.every((c) => Array.isArray(c) && c.length === 5), `${k}.candidates 每行必须 5 个值`);
  }
});

test('演示档案的分期与肺转评估来自医生，不是工作台自算', () => {
  for (const k of keys) {
    const p = data.profiles[k];
    assert.ok(p.staging && p.staging.rows.length, `${k} 缺分期分节`);
    const items = p.staging.rows.map((r) => r[0]);
    assert.ok(items.some((x) => x.includes('Enneking')), `${k} 分节里必须有 Enneking 外科分期一行`);
    assert.ok(items.some((x) => x.includes('肺转移')), `${k} 必须记录肺转移评估口径`);
  }
});

test('治疗单元：一次手术/一个周期各一条，不按天数打勾（32 号口径）', () => {
  const cycleCols = db.prepare('PRAGMA table_info(cycles)').all().map((c) => c.name);
  assert.ok(!cycleCols.some((c) => /day|dose_total/i.test(c)), 'cycles 不得有 day_* 或合成剂量列');
  const surgeryCols = db.prepare('PRAGMA table_info(surgery_rows)').all().map((c) => c.name);
  for (const col of ['procedure', 'approach', 'recon', 'margins']) {
    assert.ok(surgeryCols.includes(col), `surgery_rows.${col} 是骨癌手术记录三段口径的一部分`);
  }
});

test('影像只存报告摘录，没有判读枚举列（口径 C 骨癌版）', () => {
  const cols = db.prepare('PRAGMA table_info(imaging_rows)').all().map((c) => c.name);
  assert.ok(cols.includes('finding'), 'imaging_rows 必须有 finding（报告原文摘录）');
  assert.ok(!cols.some((c) => /is_normal|is_abnormal|flag|verdict/i.test(c)), 'imaging_rows 不得有判读枚举列');
});

test('分类指标的档位顺序在原型里显式声明，且覆盖数据里出现的全部取值', () => {
  /* 按出现顺序排会让图说谎（"轻度"排在"0 级"上面）。档位表写在 prototypes/v0.2/app.js，
     这里把它抠出来，逐个分类指标核对：档位必须声明、且包含数据里出现过的每个值。 */
  const src = readFileSync(join(ROOT, 'prototypes/v0.2/app.js'), 'utf8');
  const m = src.match(/const QUAL_LEVELS = \{([\s\S]*?)\n\};/);
  assert.ok(m, 'app.js 里找不到 QUAL_LEVELS');
  const levels = {};
  for (const line of m[1].split('\n')) {
    const hit = line.match(/^\s*(\w+):\s*\[(.*)\],?\s*$/);
    if (!hit) continue;
    levels[hit[1]] = [...hit[2].matchAll(/'([^']*)'/g)].map((x) => x[1]);
  }
  for (const k of keys) {
    for (const mm of data.profiles[k].metrics) {
      if ((mm.kind ?? 'numeric') === 'numeric') continue;  // js 侧数值指标省略 kind
      const lv = levels[mm.key];
      assert.ok(lv, `${k}.${mm.key} 是分类指标，但 QUAL_LEVELS 没有声明档位顺序`);
      for (const p of mm.points) {
        assert.ok(lv.includes(p.v), `${k}.${mm.key} 的值「${p.v}」不在 QUAL_LEVELS 里，节点会掉到 0 档`);
      }
    }
  }
});
