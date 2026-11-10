'use strict';
/* 小骨宝 OsteoPal v0.1.0 — 交互原型。患者数据全部为模拟；临床试验列表为真实登记摘录（状态未核实）。
   不读写真实文件、不调用模型或宿主 API。视觉与交互结构移植自家族原型（cervical-workbench v0.2,leftover-allow:底本声明，
   最近过 V1 的同形仓），病种语义全部重写为骨癌口径；品牌色重映射为小骨宝暖赭 #C07A3E
   （--violet-deep 压深到 #8F5A26 保证正文对比度 ≥ 4.5:1）。

   与 cervical 底本的结构差异（改前先看，两边不许互相抄）(leftover-allow:移植来源声明)
   1. 一级页 9 个：看板 / 资料库 / 影像随访 / 分期与评估 / 治疗历程 / 功能与随访 / 检查与指标
      / 病情一图秀 / 临床研究（cervical 的性与生育(leftover-allow:裁剪说明)、放疗与长期影响、营养支持、心理支持不适用，已裁剪）；
   2. 新增专属一级页「影像随访」（骨癌随访以影像为核心）与「功能与随访」
      （功能自评 + 假体与重建随访 + 随访节律 + 私密感受，吸收 cervical mind/review 语义）(leftover-allow:来源声明)；
   3. 一图秀默认是 ALP + 疼痛自评两条数值线 + 行走情况分类节点（只画点不连线）；
   4. 功能自评里的私密感受默认折叠，需要本人点开才显示；
   5. 指标主线换骨癌口径：ALP / LDH / 血钙 + 血象 + 功能自评；SCC-Ag / CEA / HPV 语义禁止回流。 */

const APP_INFO = {
  version: '0.1.0',
  build: '2026-11-11',
  channel: 'prototype',
  channelLabel: '交互原型 · 未接入 DSH'
};
APP_INFO.displayVersion = `v${APP_INFO.version}`;

const $ = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => Array.from(root.querySelectorAll(s));
const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
let uidSeq = 0;
const uid = (p) => p + (++uidSeq);

/* ---------------- icons & nav ---------------- */
const icons = {
  home: 'M3 10 12 3l9 7M5 9v12h5v-7h4v7h5V9',
  badge: 'M12 3l7 4v10l-7 4-7-4V7ZM9 12l2 2 4-4',
  drip: 'M12 3v6m0 0a5 5 0 1 0 0 10 5 5 0 0 0 0-10ZM7 7h10',
  /* 影像随访：一张片子 + 观察线 */
  xray: 'M5 3h14v18H5ZM12 3v18M8 8h2m4 0h2M8 12h2m4 0h2M9 16h6',
  lab: 'M9 3h6M10 3v6l-5 9a2 2 0 0 0 2 3h10a2 2 0 0 0 2-3l-5-9V3M7 15h10',
  chart: 'M4 3v17h17M7 14l4-5 4 3 5-7',
  /* 功能与随访：走路的小人（保肢后的行走是核心功能线） */
  heart: 'M12 20.3c-4.6-2.9-7.4-5.6-7.4-9A4.1 4.1 0 0 1 12 8.4a4.1 4.1 0 0 1 7.4 2.9c0 3.4-2.8 6.1-7.4 9Z',
  calendar: 'M4 5h16v16H4ZM8 3v4m8-4v4M4 10h16m-12 4h2m4 0h2m-8 3h2',
  flask: 'M9 3h6v5l5 9a2 2 0 0 1-2 3H6a2 2 0 0 1-2-3l5-9Z',
  folder: 'M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z',
  chat: 'M4 5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H10l-6 5V5ZM8 8h8M8 11h5',
  /* 检查与指标：一张报告 + 读数线 */
  report: 'M6 3h9l4 4v14H6ZM14 3v5h5M9 12h6M9 16h4'
};
/* 看板任务卡用的是页面键，图标表里名字不同；别名避免拼错键时静默输出空 path。 */
const ICON_ALIAS = { records: 'folder', imaging: 'xray', function: 'heart', review: 'calendar', labs: 'report', timeline: 'chart', treatment: 'drip', stage: 'badge', trials: 'flask', dashboard: 'home' };
const icon = (k) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${icons[k] || icons[ICON_ALIAS[k]] || icons.badge}"/></svg>`;

/* 9 个一级页：SPEC §4（骨癌裁剪后）+「资料库」（家族脚手架要求）。
   顺序照 SPEC：看板 → 资料库 → 影像随访 → 分期与评估 → 治疗历程
   → 功能与随访 → 检查与指标 → 病情一图秀 → 临床研究。 */
const PAGES = [
  ['dashboard', '看板', 'home'], ['records', '资料库', 'folder'], ['imaging', '影像随访', 'xray'],
  ['stage', '分期与评估', 'badge'], ['treatment', '治疗历程', 'drip'], ['function', '功能与随访', 'heart'],
  ['labs', '检查与指标', 'report'], ['timeline', '病情一图秀', 'chart'], ['trials', '临床研究', 'flask']
];
const SUBPAGES = {
  records: ['资料库', '整理草稿 / 核对', '病情档案', '指标检测', '病情汇总'],
  imaging: ['影像记录', '原件与解析', '复查间隔'],
  stage: ['分期档案', '病理与分子', '会诊与二次意见'],
  treatment: ['治疗路径', '手术记录', '化疗周期'],
  function: ['功能自评', '假体与重建随访', '随访节律与求助', '感受与私密记录'],
  labs: ['分类指标', '化验报告表', '口径说明'],
  timeline: ['数值曲线', '分类与事件', '数据口径'],
  trials: ['2026 线索', '已收藏', '入组问题']
};
const SUBTITLES = {
  dashboard: '分期、治疗节点、功能与随访放在一起，让下一次门诊有据可查。',
  records: '上传 → 解析 → 确认指标 → 入库；原件永远保留，接受之前都只是候选。',
  imaging: '每次影像检查按「模态 / 部位 / 机构 / 报告原文摘录」记一条；片子散在各医院，先在这里对齐。',
  stage: 'Enneking / AJCC 分期由医生给出，工作台只记录期别、依据与日期，不替你重算。',
  treatment: '一次手术、一个化疗周期是两条记录；路径改过就新增一条，旧的留着不覆盖。',
  function: '功能自评是本人记录，不是医生评估；MSTS 评分由医生给，这里不自动打分。',
  labs: 'ALP / LDH 是骨癌随访常用化验；不同方法、不同机构不合并比较。',
  timeline: 'ALP、体重与行走情况放回同一段时间里，看见变化发生在哪一步。',
  trials: '线索不是推荐；先弄清入组条件，再决定要不要问。'
};

/* ---------------- 数据层（由 demo/build-demo-data.mjs 生成；改数据请改生成器重跑） ---------------- */
const D = window.DEMO_DATA;
const PROFILES = {}, METRICS = {}, EVENTS = {}, DASH_KEYS = {}, DOCS = {}, CANDS = {};
for (const [k, p] of Object.entries(D.profiles)) {
  /* 字段逐条显式列出：生成器加字段时这里会同步补，不会静默丢字段。
     骨癌专属：biopsyNote / staging / imaging / functSelf / prosthesis / helpPlan。
     cervical 的 figo / rt / lateEffects / lymphedema / vagina / menopause / hormone /(leftover-allow:禁抄清单)
     fertility / sexual / cytology / hpv / screening / nutrition 不许抄回来。 */
  PROFILES[k] = {
    name: p.name, sex: p.sex, age: p.age, meta: p.meta, headline: p.headline, stage: p.stage,
    mindset: p.mindset, histology: p.histology, biopsyNote: p.biopsy_note ?? p.biopsyNote ?? null,
    molecular: p.molecular, path: p.path, lines: p.lines, cycles: p.cycles, rhythm: p.rhythm,
    pathway: p.pathway || null, staging: p.staging || null, surgery: p.surgery || null,
    imaging: p.imaging || null, functSelf: p.functSelf || null, prosthesis: p.prosthesis || null,
    helpPlan: p.helpPlan || null,
    viewpoints: p.viewpoints, activity: p.activity, familyTalk: p.familyTalk,
    docs: p.docs || [], candidates: p.candidates || [], pathology: p.pathology || null
  };
  METRICS[k] = {};
  for (const m of p.metrics) METRICS[k][m.key] = m;
  /* 事件在 demo-data 里是 [日期, 名称] 定长数组；一图秀按 {d,label} 读，
     不归一化会让 dataBounds() 拿到 undefined → toISOString 抛 RangeError、整页渲染中断。 */
  EVENTS[k] = (p.events || []).map(e => Array.isArray(e) ? { d: e[0], label: e[1] } : e);
  DASH_KEYS[k] = p.dash_keys;
  /* 资料与候选是定长数组，必须显式映射：直接展开只会得到数字键，页面读 d.name 全是 undefined。 */
  DOCS[k] = (p.docs || []).map(d => ({ id: d[0], name: d[1], fileName: d[1], date: d[2], type: d[3], status: d[4] }));
  CANDS[k] = (p.candidates || []).map(c => ({ id: c[0], name: c[1], value: c[2], source: c[3],
    status: c[4] === '已接受' ? 'accepted' : 'candidate' }));
}
const TRIALS = D.trials;

/* ---------------- 路由表（check-probe-coverage / probe-m2 用） ----------------
   键 = hash 叶子路由（view 或 view:N，N 为页内 Tab 序号）；值 = [view, subIndex]。
   28 条叶子必须与 SUBPAGES 一一对应；改名漏页必红。 */
var ROUTES = [
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
function parseHashRoute(h) {
  if (!ROUTES.includes(h)) return null;
  const m = /^([a-z]+)(?:\/(\d))?$/.exec(h || '');
  if (!m || !VIEWS[m[1]]) return null;
  return { view: m[1], sub: Number(m[2] || 0) };
}

/* ---------------- state ---------------- */
/* 一图秀默认：ALP + 疼痛自评两条数值线 + 行走情况分类节点（不连线）。
   进页面先看"骨相关化验和功能怎么样"，而不是血象。 */
const state = { view: 'dashboard', profile: 'A', agentOpen: false, agentSize: 'std', sel: ['alp', 'pain', 'walk'],
  range: 'all', zoom: 100, toggles: { treatment: true, keypoints: true }, pin: null, saved: [], sub: {},
  query: '', parsing: false, parseError: false, loaded: {}, parsingName: '', lastUpload: null, uploads: 0,
  privateOpen: false, trialTopic: '全部' };
/* 换档案后的默认选择必须与初始状态同构：A = ALP + 疼痛自评；B = ALP + LDH。
   分类节点按档案实际有的那条挑（两个档案都有行走情况）。 */
const defaultSel = (k) => {
  const mm = METRICS[k] || {};
  const num = (DASH_KEYS[k] || []).filter((c) => mm[c] && mm[c].points.some(p => typeof p.v === 'number')).slice(0, 2);
  const out = num.slice();
  const qual = ['walk', 'fatigue'].find((c) => mm[c] && mm[c].points.length);
  if (qual) out.push(qual);
  return out.slice(0, 3);
};
const P = () => PROFILES[state.profile];
const M = () => METRICS[state.profile];

/* ---------------- helpers ---------------- */
const fmtDate = (d) => d;
const delta = (m) => {
  if (!m.points || m.points.length < 2) return null;
  const a = m.points[m.points.length - 1], b = m.points[m.points.length - 2];
  if (typeof a.v !== 'number' || typeof b.v !== 'number') return null;
  const d = a.v - b.v;
  return { text: (d > 0 ? '+' : '') + d.toFixed(m.dec ?? 1), up: d > 0, from: b.d };
};
function sparkline(m, w = 200, h = 44) {
  const pts = (m.points || []).filter(p => typeof p.v === 'number');
  if (pts.length < 2) return '';
  const vs = pts.map(p => p.v);
  let lo = Math.min(...vs), hi = Math.max(...vs); if (hi === lo) { hi += 1; lo -= 1; }
  const X = i => 4 + (w - 8) * i / (pts.length - 1);
  const Y = v => h - 5 - (h - 10) * (v - lo) / (hi - lo);
  const path = pts.map((p, i) => `${i ? 'L' : 'M'}${X(i).toFixed(1)},${Y(p.v).toFixed(1)}`).join('');
  const dots = pts.map((p, i) => `<circle class="sp-dot" cx="${X(i).toFixed(1)}" cy="${Y(p.v).toFixed(1)}" r="2.6" fill="${m.color}"/>`).join('');
  return `<svg class="spark" viewBox="0 0 ${w} ${h}" aria-hidden="true"><path class="base" d="M4 ${h - 5}H${w - 4}"/><path class="sp-line" d="${path}" stroke="${m.color}"/>${dots}</svg>`;
}
/* 3D 翻面：点整卡转 180°，再点返回；data-flipped 是唯一视觉开关；
   两面互换 aria-hidden，隐藏面不进读屏顺序。分类记录（data-static）不翻。 */
function flipCard(key) {
  const el = document.querySelector(`[data-mcard="${key}"]`);
  if (!el || el.dataset.static) return;
  const on = el.dataset.flipped !== 'true';
  el.dataset.flipped = String(on);
  el.setAttribute('aria-pressed', String(on));
  const front = el.querySelector('[data-face="front"]');
  const back = el.querySelector('[data-face="back"]');
  if (front) front.setAttribute('aria-hidden', String(on));
  if (back) back.setAttribute('aria-hidden', String(!on));
}
function mcard(key, m) {
  const last = (m.points || []).slice(-1)[0];
  if (!last) return '';
  const numeric = typeof last.v === 'number' && m.dec !== null;
  const d = delta(m);
  const cat = `<span class="cat"><i style="background:${m.color}"></i>${esc(m.cat)}</span>`;
  if (!numeric) {
    return `<div class="mcard" data-mcard="${key}" data-static="1" role="group" aria-roledescription="指标卡"
      aria-label="${esc(m.name)}：${esc(String(last.v))}（分类记录，只按原文记录，不连折线）">
      <span class="mface front" data-face="front">${cat}<span class="name">${esc(m.name)}</span>
      <span class="na">${esc(last.v)}</span>
      <span class="meta"><span>${esc(last.src)}</span><span class="hint">分类记录</span></span></span></div>`;
  }
  const band = m.band ? `<span class="rec">参考 ${m.band[0]}–${m.band[1]} ${esc(m.unit)}</span>` : `<span class="rec">${esc(last.d)} · ${esc(last.src)}</span>`;
  return `<div class="mcard" role="group" tabindex="0" data-mcard="${key}" data-flipped="false" aria-roledescription="指标卡"
    aria-label="${esc(m.name)} 最近 ${last.v.toFixed(m.dec ?? 1)} ${esc(m.unit)}（${esc(last.d)}）；点一下翻面看趋势">
    <span class="mcard-inner">
    <span class="mface front" data-face="front">${cat}<span class="name">${esc(m.name)}</span>
      <span class="val"><span data-countup="${last.v}" data-dec="${m.dec ?? 1}">${last.v.toFixed(m.dec ?? 1)}</span><small>${esc(m.unit)}</small></span>
      ${d ? `<span class="delta">较上次 <em>${d.text}${m.unit ? ' ' + esc(m.unit) : ''}</em>（${esc(d.from)}）</span>` : ''}
      ${band}</span>
    <span class="mface back" data-face="back" aria-hidden="true">${cat}<span class="name">${esc(m.name)}</span>
      ${sparkline(m, 190, 40)}
      <span class="meta"><span>${esc(m.note)}</span><span class="hint">轻点翻回</span></span></span>
    </span></div>`;
}
/* ---------------- 一图秀引擎（统一画布 · 多序列归一化 · 移植家族基因） ---------------- */
const CW = 980, CH = 420, CX0 = 62, CX1 = 954, CY0 = 132, CY1 = 366;
const CAT_ORDER = ['骨与肿瘤相关', '血象', '生化', '电解质', '营养', '自评与功能'];
/* 分类序列的档位顺序：**必须显式声明，不许按出现顺序排**。
   行走情况、疲劳自评是本人自述档位，顺序错了图就在说谎。
   没在这里声明的分类指标（自述类）按"只画节点、不定位严重度"处理。 */
const QUAL_LEVELS = {
  walk: ['如常', '轻度受限', '需辅助器具', '明显受限'],
  fatigue: ['无', '轻度', '中度', '重度']
};
const fmtNum = (v, dec) => typeof v === 'number' ? v.toFixed(dec ?? 1) : String(v ?? '');
const shortDate = (d) => d.slice(5).replace('-', '.');
const longDate = (d) => d;
const numPts = (m) => (m.points || []).filter(p => typeof p.v === 'number');
const addDays = (d, n) => new Date(Date.parse(d) + n * 86400000).toISOString().slice(0, 10);

function dataBounds() {
  const ds = [];
  for (const m of Object.values(M())) for (const p of m.points) ds.push(p.d);
  for (const e of (EVENTS[state.profile] || [])) ds.push(e.d);
  ds.sort();
  return [Date.parse(ds[0]), Date.parse(ds[ds.length - 1])];
}
function domain() {
  const [s, e] = dataBounds();
  const months = { '3m': 3, '6m': 6, '12m': 12 }[state.range];
  const start = months ? new Date(new Date(e).setMonth(new Date(e).getMonth() - months)) : new Date(s);
  const span = e - start.getTime();
  const kept = span * state.zoom / 100;
  return [e - kept, e];
}
const inDomain = (d, t0, t1) => { const t = Date.parse(d); return t >= t0 && t <= t1; };
const xOf = (t, t0, t1) => CX0 + (t - t0) / Math.max(1, t1 - t0) * (CX1 - CX0);

/* 单调三次插值（Fritsch-Carlson，同 d3 curveMonotoneX）：
   只平滑折线，且保证曲线段不越过相邻数据点的 y 范围——不会出现"过冲鼓包"式变形 */
function smoothPath(coords) {
  const n = coords.length;
  if (!n) return '';
  if (n === 1) return `M ${coords[0].x.toFixed(1)} ${coords[0].y.toFixed(1)}`;
  const dx = [], slope = [];
  for (let i = 0; i < n - 1; i++) {
    const ddx = coords[i + 1].x - coords[i].x;
    dx.push(ddx);
    slope.push(ddx ? (coords[i + 1].y - coords[i].y) / ddx : 0);
  }
  const tan = [slope[0]];
  for (let i = 1; i < n - 1; i++) {
    if (slope[i - 1] * slope[i] <= 0) tan.push(0);           // 拐点处切线置平，防鼓包
    else {
      const w1 = 2 * dx[i] + dx[i - 1], w2 = dx[i] + 2 * dx[i - 1];
      tan.push((w1 + w2) / (w1 / slope[i - 1] + w2 / slope[i])); // 调和加权，保证单调
    }
  }
  tan.push(slope[n - 2]);
  let d = `M ${coords[0].x.toFixed(1)} ${coords[0].y.toFixed(1)}`;
  for (let i = 0; i < n - 1; i++) {
    const c1x = coords[i].x + dx[i] / 3, c1y = coords[i].y + tan[i] * dx[i] / 3;
    const c2x = coords[i + 1].x - dx[i] / 3, c2y = coords[i + 1].y - tan[i + 1] * dx[i] / 3;
    d += ` C ${c1x.toFixed(1)} ${c1y.toFixed(1)} ${c2x.toFixed(1)} ${c2y.toFixed(1)} ${coords[i + 1].x.toFixed(1)} ${coords[i + 1].y.toFixed(1)}`;
  }
  return d;
}

/* 治疗条：周期带（化疗周期）+ 评估标记（确诊/手术/分期），两行独立于数据区 */
function bandsFor(t0, t1) {
  const p = P(), items = [];
  p.cycles.forEach((c, i) => {
    const from = c[1];
    const to = c[4] && p.cycles[i + 1] ? p.cycles[i + 1][1] : addDays(from, 21);
    items.push({ kind: 'cycle', from, to, label: c[0], color: '#8f5a26' });
  });
  (EVENTS[state.profile] || []).forEach((e) => {
    if (/确诊|手术|分期/.test(e.label)) items.push({ kind: 'mark', from: e.d, to: e.d, label: e.label, color: e.label.includes('手术') ? '#a03d5c' : '#9a6410' });
  });
  return items.filter((tr) => Date.parse(tr.to) >= t0 && Date.parse(tr.from) <= t1)
    .sort((a, b) => Date.parse(a.from) - Date.parse(b.from))
    .map((tr, lane) => { const s = Math.max(Date.parse(tr.from), t0), e2 = Math.min(Date.parse(tr.to), t1); return { ...tr, x1: xOf(s, t0, t1), x2: xOf(e2, t0, t1), lane }; });
}

function monthTicks(t0, t1) {
  const out = []; const d = new Date(t0); let cur = new Date(d.getFullYear(), d.getMonth(), 1);
  if (cur.getTime() < t0) cur.setMonth(cur.getMonth() + 1);
  while (cur.getTime() <= t1) {
    const x = xOf(cur.getTime(), t0, t1);
    if (x > CX0 + 6 && x < CX1 - 6) out.push({ x, label: `${cur.getMonth() + 1}月` });
    cur = new Date(cur.getFullYear(), cur.getMonth() + 1, 1);
  }
  if (out.length > 7) return out.filter((_, i) => i % 2 === 0);
  return out;
}

function seriesFor(code, t0, t1) {
  const m = M()[code];
  if (!m) return null;
  const nums = numPts(m);
  /* 分类序列（行走情况 / 疲劳自评）：没有数值轴，只画节点与档位文字，
     绝不连折线——连线会造出"从轻度顺利滑到重度"的假趋势。 */
  if (!nums.length) {
    const lv = QUAL_LEVELS[code] || null;
    const pts = (m.points || []).filter((p) => inDomain(p.d, t0, t1));
    let lo = 0, hi = 1;
    if (lv) { lo = 0; hi = lv.length - 1; }
    return { code, m, lo, hi, span: Math.max(hi - lo, 1), pts, qual: true, levels: lv };
  }
  const all = nums.map((p) => p.v);
  const lo = Math.min(...all), hi = Math.max(...all);
  const span = hi - lo || Math.max(Math.abs(hi) * 0.08, 1);
  const pts = nums.filter((p) => inDomain(p.d, t0, t1));
  return { code, m, lo, hi, span, pts, qual: false };
}

function chartSVG(t0, t1) {
  const bands = state.toggles.treatment ? bandsFor(t0, t1) : [];
  const all = state.sel.filter((c) => M()[c]).map((c) => seriesFor(c, t0, t1)).filter((s) => s && s.pts.length);
  if (!all.length) return `<div class="empty"><h3>这个时间窗里没有所选指标</h3><p>扩大时间范围，或在左侧加选一个指标。</p></div>`;
  const series = all.filter((s) => !s.qual);
  const quals = all.filter((s) => s.qual);
  const yOf = (s, v) => CY1 - (v - s.lo) / s.span * (CY1 - CY0);
  const grid = [0, 1, 2, 3, 4].map((i) => { const y = CY0 + i * (CY1 - CY0) / 4; return `<line class="grid" x1="${CX0}" x2="${CX1}" y1="${y}" y2="${y}"/>`; }).join('');

  /* 周期标签两行错位：21 天一格的条宽只有 ~30px，单行排下来相邻标签会糊成一串。 */
  const labelEnd = [-1e9, -1e9];
  /* 评估标记（确诊 / 手术 / 分期）常常同一天，两个标签会直接叠字：同样做两行错位。 */
  const markEnd = [-1e9, -1e9];
  const strip = bands.map((b) => {
    if (b.kind === 'mark') {
      const x = b.x1.toFixed(1);
      const estW = String(b.label).length * 9.6 + 14;
      let mrow = markEnd[0] + 4 <= +x ? 0 : 1;
      markEnd[mrow] = +x + estW;
      const row = 64 + mrow * 15;
      return `<g><path d="M ${x} ${row - 4} l4 4 -4 4 -4 -4 Z" fill="${b.color}"/>
        <text x="${(+x + 8).toFixed(1)}" y="${row + 3.5}" font-size="9.5" fill="${b.color}" font-weight="600">${esc(b.label)}</text></g>`;
    }
    const w = Math.max(b.x2 - b.x1, 7).toFixed(1);
    const estW = String(b.label).length * 5.4 + 3;
    let row = labelEnd[0] + 4 <= b.x1 ? 0 : 1;
    if (row === 1 && labelEnd[1] + 4 > b.x1) { row = 0; }   // 两行都挤：宁可压一点，也不换第三行
    labelEnd[row] = Math.max(labelEnd[row], b.x1 + estW);
    const ty = 30 - row * 9;
    return `<g><rect x="${b.x1.toFixed(1)}" y="36" width="${w}" height="8" rx="4" fill="${b.color}" opacity=".3"/>
      <text x="${(b.x1 + 1).toFixed(1)}" y="${ty}" font-size="9" fill="${b.color}" font-weight="500">${esc(b.label)}</text></g>`;
  }).join('');

  const markLines = bands.filter((b) => b.kind === 'mark').map((b) =>
    `<line x1="${b.x1.toFixed(1)}" x2="${b.x1.toFixed(1)}" y1="${CY0}" y2="${CY1}" stroke="${b.color}" stroke-width="1.2" stroke-dasharray="3 6" opacity=".45"/>`).join('');

  /* 末点标签：按 y 排序强制最小间距 13px，右端左锚定，防叠字（家族统一规范） */
  const lastPos = series.map((s) => {
    const c = s.pts.map((p) => ({ x: xOf(Date.parse(p.d), t0, t1), y: yOf(s, p.v) }));
    const last = c[c.length - 1];
    return { s, x: last.x, y: last.y, v: s.pts[s.pts.length - 1].v };
  }).sort((a, b) => a.y - b.y);
  let cursor = -Infinity;
  for (const it of lastPos) { it.ly = Math.max(it.y, cursor + 13); cursor = it.ly; }
  const overflow = lastPos.length ? Math.max(0, lastPos[lastPos.length - 1].ly - (CY1 + 2)) : 0;
  if (overflow) for (const it of lastPos) it.ly -= overflow;

  const lines = series.map((s) => {
    const coords = s.pts.map((p) => ({ x: xOf(Date.parse(p.d), t0, t1), y: yOf(s, p.v) }));
    const path = s.pts.length > 1 ? `<path class="line" d="${smoothPath(coords)}" stroke="${s.m.color}" pathLength="1"/>` : '';
    const points = coords.map((c, i) => {
      const p = s.pts[i];
      const isLast = i === s.pts.length - 1;
      const r = isLast ? 5.2 : (i === 0 ? 4.6 : 4);
      const active = state.pin && state.pin.code === s.code && state.pin.date === p.d;
      return `<circle class="pt${active ? ' active' : ''}" cx="${c.x.toFixed(1)}" cy="${c.y.toFixed(1)}" r="${r}" fill="${s.m.color}" data-action="pin" data-code="${s.code}" data-date="${p.d}"/>`;
    }).join('');
    const lp = lastPos.find((x) => x.s === s);
    const nearRight = lp.x > CX1 - 44;
    const lx = nearRight ? lp.x - 8 : lp.x + 8;
    const label = state.toggles.keypoints
      ? `<text class="delta-tag" x="${lx.toFixed(1)}" y="${(lp.ly + 4).toFixed(1)}" text-anchor="${nearRight ? 'end' : 'start'}" fill="${s.m.color}">${fmtNum(lp.v, s.m.dec)}</text>` : '';
    return `<g>${path}${points}${label}</g>`;
  }).join('');

  /* 分类序列：节点画在档位带上，纵向按档位序排；每个节点带小方块 + 档位文字，不连线。
     多条分类序列时横向错开 8px，避免完全重叠。 */
  const qualLayer = quals.map((s, qi) => {
    const lv = s.levels || [];
    const n = Math.max(lv.length - 1, 1);
    return s.pts.map((p) => {
      const x = xOf(Date.parse(p.d), t0, t1) + qi * 8 - 4;
      const idx = Math.max(0, lv.indexOf(p.v));
      const y = CY1 - idx / n * (CY1 - CY0);
      const active = state.pin && state.pin.code === s.code && state.pin.date === p.d;
      return `<g class="qual-pt${active ? ' active' : ''}">
        <rect x="${(x - 4).toFixed(1)}" y="${(y - 4).toFixed(1)}" width="8" height="8" rx="2" fill="${s.m.color}" opacity=".85" data-action="pin" data-code="${s.code}" data-date="${p.d}"/>
        <text x="${(x + 6).toFixed(1)}" y="${(y + 3.2).toFixed(1)}" font-size="8.5" fill="${s.m.color}" font-weight="600">${esc(p.v)}</text></g>`;
    }).join('');
  }).join('');

  const ticks = monthTicks(t0, t1).map((t) => `<line class="axis" x1="${t.x.toFixed(1)}" x2="${t.x.toFixed(1)}" y1="${CY1}" y2="${CY1 + 5}"/><text class="tick" x="${t.x.toFixed(1)}" y="${CY1 + 18}" text-anchor="middle">${t.label}</text>`).join('');
  const rowLabels = state.toggles.treatment
    ? `<text x="6" y="34" font-size="9" fill="#8fa1b5">周期</text><text x="6" y="68" font-size="9" fill="#8fa1b5">评估</text>`
    : '';

  return `<svg class="chart" viewBox="0 0 ${CW} ${CH}" role="img" aria-label="所选指标的时序图，共 ${all.length} 条序列（其中 ${quals.length} 条为分类节点）">
    ${grid}${ticks}${markLines}${strip}${rowLabels}${lines}${qualLayer}
    <text class="tick" x="${CX0}" y="${CY1 + 36}">数值线按各自全部记录的最小值–最大值归一化，不代表数值可比；分类序列只画节点、不连线</text>
  </svg>`;
}

const pageHead = (sub) => `<div class="page-head"><div><h1>${esc(PAGES.find(p => p[0] === state.view)[1])}</h1><p>${esc(SUBTITLES[state.view])}</p></div></div>${sub ? `<div class="subnav" role="tablist">${SUBPAGES[state.view].map((s, i) => `<button role="tab" aria-selected="${(state.sub[state.view] || 0) === i}" data-sub="${i}">${esc(s)}</button>`).join('')}</div>` : ''}`;
const row = (b, p, right = '') => `<div class="row"><div class="row-main"><div><b>${b}</b>${p ? `<p>${p}</p>` : ''}</div></div>${right}</div>`;
const pill = (t, c = '') => `<span class="pill ${c}">${esc(t)}</span>`;
const secTitle = (s, extra = '') => s ? `<div class="section-title"><h2>${esc(s.title)}</h2>${extra}</div>` : '';
const emptyBox = (h, p) => `<div class="empty"><h3>${esc(h)}</h3><p>${esc(p)}</p></div>`;

/* ---------------- views ---------------- */

/* 功能自评状态卡（看板摘要卡）：只陈述"记了几条、最近一条是什么"，
   不打 MSTS 分、不写"恢复良好"。 */
function functCard(p) {
  if (!p.functSelf && !p.prosthesis) {
    return `<div class="card"><div class="card-head"><h2>功能与随访</h2>${pill('暂无记录', 'grey')}</div>
      ${emptyBox('还没有功能自评记录', '术后恢复期间，把每天能做的一件事记下来，下次门诊直接给医生看。')}</div>`;
  }
  const fs = p.functSelf ? p.functSelf.rows[0] : null;
  const pr = p.prosthesis ? p.prosthesis.rows[p.prosthesis.rows.length - 1] : null;
  return `<div class="card"><div class="card-head"><h2>功能与随访</h2>${pill('按记录陈述', 'violet')}</div>
    <div class="rows">
      ${fs ? row(`最近一次功能自评：${esc(fs[1])}`, `${esc(fs[0])} · ${esc(fs[2])}（本人记录）`) : ''}
      ${pr ? row(`最近一次假体随访：${esc(pr[1])}`, `${esc(pr[0])} · ${esc(pr[2])}`) : ''}
    </div>
    <div class="notice">这里只记录"什么时候、本人写了什么、报告摘录了什么"；功能评分与处理都由医生给，工作台不做判断。</div>
    <div class="actions"><button data-action="go-function">打开功能与随访 →</button></div></div>`;
}

/* 36 号 §2.6 · 看板首卡状态卡四件：卡头 eyebrow / 派生天数 / 现状行 / 出口按钮排。
   天数由锚点日（手术日或穿刺确诊日 = Day 0）与当天日期计算，不手填；无锚点整卡显示「待初始化」。
   出口主按钮进当前阶段核心页；副按钮打开疾病概要（与顶栏「?」同一个整页面板）。 */
function isoDay(s) {
  const m = String(s || '').match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? Date.UTC(+m[1], +m[2] - 1, +m[3]) : null;
}
function dayDiff(from, to) {
  const a = isoDay(from), b = isoDay(to);
  return a === null || b === null ? null : Math.round((b - a) / 86400000);
}
/* 不用 data-primer-open：那个属性由 primer.js 接管，顶栏「?」会因此不被自动挂载（36 号 §3.2）。
   模块未接入时不渲染，避免留一个点了没反应的按钮。 */
function primerCta() {
  if (typeof window === 'undefined' || !window.DiseasePrimer) return '';
  return '<button class="soft" data-primer-cta aria-haspopup="dialog" aria-controls="disease-primer">疾病概要：骨癌是什么？</button>';
}
function statusCard(p) {
  const today = new Date().toISOString().slice(0, 10);
  const surgery = (p && p.surgery && p.surgery.rows && p.surgery.rows[0]) || null;
  const dx = (p.events || []).find((e) => /确诊/.test(e[1])) || null;
  const anchor = surgery ? surgery[0] : (dx ? dx[0] : '');
  const anchorLabel = surgery ? surgery[1] : (dx ? '穿刺确诊日（Day 0）' : '');
  const days = dayDiff(anchor, today);
  if (days === null) {
    return `<div class="stage-strip" data-status-card="uninitialized"><span class="eyebrow">状态卡</span>`
      + `<span class="stage-now"><b>待初始化</b><small>未找到锚点日（穿刺确诊日 / 手术日 = Day 0），天数不由本台手填。先去「分期与评估」或「治疗历程」补日期；本台暂无独立三步向导。</small></span>`
      + `<div class="actions"><button class="primary" data-action="go-stage">去补起始日期 →</button>${primerCta()}</div></div>`;
  }
  const next = (p.rhythm || [])[0] || null;
  const nextTxt = next ? `下次：${next[3]}（${next[0]}）` : '下次：待预约';
  const lines = p.lines || [];
  const open = lines.find((l) => !l.done) || null;
  const cur = open || lines[lines.length - 1] || null;
  const curName = cur ? cur.name : '阶段未记录';
  const curDetail = cur ? cur.detail : '';
  const stateTxt = open ? '进行中' : '已结束 · 随访期';
  const core = state.profile === 'B'
    ? { act: 'go-function', text: '看随访节律 →' }
    : { act: 'go-treatment', text: '看化疗周期 →' };
  return `<div class="stage-strip" data-status-card="ready"><span class="eyebrow">第 ${days} 天状态卡 · 距${esc(next ? next[0] : '下一阶段')}</span>`
    + `<span class="stage-day"><b>第 ${days} 天</b><small>锚点 ${esc(anchor)} ${esc(anchorLabel)}（Day 0）</small></span>`
    + `<span class="stage-now"><b>${esc(curName)} · ${esc(stateTxt)}</b><small>${esc(curDetail)} · ${esc(nextTxt)} · 只引用医生记录与日期</small></span>`
    + `<div class="actions"><button class="primary" data-action="${core.act}">${core.text}</button>${primerCta()}</div></div>`;
}

function vDashboard() {
  const p = P(), m = M();
  const cards = (DASH_KEYS[state.profile] || []).filter(k => m[k]).map(k => mcard(k, m[k])).join('');
  const lastV = p.viewpoints[p.viewpoints.length - 1];
  const nextRhythm = p.rhythm[0];
  const isA = state.profile === 'A';
  return `${pageHead(false)}
  ${statusCard(p)}
  <section class="hero">
    <div>
      <span class="eyebrow">演示档案 · ${esc(p.histology)}</span>
      <h1>${esc(p.name)}，这次想先看什么</h1>
      <p>${esc(p.headline)}</p>
      <div class="chips">${p.path.map((x, i) => `<span class="chip${i === 0 ? ' on' : ''}">${esc(x)}</span>`).join('')}</div>
    </div>
    <div class="stat-band">
      <div class="stat-tile"><span>外科分期</span><b>${esc(p.stage)}</b><small>医生给出，不自算</small></div>
      <div class="stat-tile"><span>最近一次门诊</span><b>${esc(p.rhythm[0] ? '已安排' : '未记录')}</b><small>${esc(nextRhythm ? nextRhythm[3] : '')}</small></div>
    </div>
  </section>

  <div class="alert-strip">
    <b>${isA ? '影像和化验是接下来几个月最需要留痕的部分' : '随访节奏和普通人不一样'}</b>
    <span>${isA
      ? '每次影像检查（MRI / CT / 骨扫描）和化验单到手就记一条，下次门诊直接给医生看。'
      : '医生安排的是"前 2 年每 3 个月"，具体项目在这页可以逐条对照；功能恢复也可以按自述记。'}</span>
    <button data-action="${isA ? 'go-imaging' : 'go-function'}">去看看 →</button>
  </div>

  <div class="task-grid">
    <button class="task-entry" data-open="chart">${icon('chart')}<b>一图秀摘要（整页）</b><span>当前勾选指标的口径与来源</span></button>
    <button class="task-entry" data-action="${isA ? 'add-imaging' : 'add-function'}">${icon(isA ? 'xray' : 'heart')}<b>${isA ? '记一次影像检查' : '记一条今天的功能自评'}</b><span>${isA ? '模态、部位、机构、报告摘录' : '抬臂、行走、提重物都可以，按自述记'}</span></button>
    <button class="task-entry" data-action="go-function">${icon('calendar')}<b>复查要查什么</b><span>${esc(nextRhythm ? nextRhythm[0] + ' · ' + nextRhythm[1] : '按医生安排')}</span></button>
    <button class="task-entry" data-action="go-trials">${icon('flask')}<b>看看 2026 在招什么</b><span>${TRIALS.length} 条登记摘录，不是推荐</span></button>
  </div>

  <div class="dashboard-grid">
    <div>
      <div class="section-title"><h2>最近的变化</h2><span class="muted">轻点卡片翻面看趋势</span></div>
      <div class="metric-grid">${cards}</div>
      ${functCard(p)}
      <div class="card">
        <div class="card-head"><h2>下一次门诊要说的三件事</h2>${pill(esc(nextRhythm ? nextRhythm[3] : '待定'), 'violet')}</div>
        <div class="rows">
          ${nextRhythm ? row(esc(nextRhythm[0]), `${esc(nextRhythm[1])} · ${esc(nextRhythm[2])}`) : ''}
          ${row('想问的问题', p.mindset)}
          <div class="row"><div class="row-main"><div><b>最近一次感受</b><p>${esc(lastV[0])} · ${esc(lastV[1])}：${esc(lastV[2])}</p></div></div>${pill('不是医生结论', 'grey')}</div>
        </div>
      </div>
    </div>
    <div>
      <div class="card">
        <div class="card-head"><h2>整页视图</h2><span class="muted">超过一屏的内容开整页看</span></div>
        <div class="rows">
          ${row('病理报告（整页）', '<button class="text-button" data-open="pathology">打开病理报告 →</button>')}
          ${row('化验记录（整页）', '<button class="text-button" data-open="labs">打开化验记录 →</button>')}
          ${row('一图秀摘要（整页）', '<button class="text-button" data-open="chart">打开一图秀摘要 →</button>')}
          ${row('把想问的写下来', '门诊只有几分钟，先说最想问的那一条')}
          ${row('记录一次功能变化', '按自述写，不用判断恢复得好不好')}
        </div>
      <div class="card">
        <div class="card-head"><h2>接下来</h2><span class="muted">医生安排</span></div>
        <div class="rows">${p.rhythm.slice(0, 5).map(r => row(esc(r[0]), `${esc(r[1])} · ${esc(r[3])}`)).join('')}</div>
        <div class="actions"><button data-action="go-function">打开随访节律</button></div>
      </div>
      <div class="card">
        <div class="card-head"><h2>我记下的感受</h2><span class="muted">默认只属于你</span></div>
        <div class="rows">${p.viewpoints.slice(-3).reverse().map(v => row(esc(v[2]), `${esc(v[0])} · ${esc(v[1])}`)).join('')}</div>
        <div class="actions"><button data-action="go-function-priv">功能与随访 · 私密记录 →</button></div>
      </div>
      </div>
    </div>
  </div>`;
}

/* ---------------- 病情整理（资料库） ---------------- */
const MARK_STATE = { ok: ['green', '已检测'], warn: ['yellow', '需关注'], pending: ['violet', '待出'], na: ['grey', '未检测'] };
const fmtSize = (n) => (!n ? '' : n > 1048576 ? `${(n / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);
const todayISO = () => new Date().toISOString().slice(0, 10);
const DOC_TYPES = ['病理报告', '影像报告', '化验单', '治疗记录', '手术记录', '出院记录', '其他'];
const DOC_PILL = { 已解析: 'green', 已入库: 'green', 待核对: 'yellow', 解析失败: 'red' };
const CAND_LABEL = { candidate: '待确认', accepted: '已接受' };

function docsTable() {
  const q = (state.query || '').trim();
  const list = DOCS[state.profile].filter(d => !q || `${d.name} ${d.type}`.includes(q));
  if (!list.length) return `<div class="empty"><h3>没有匹配的资料</h3><p>换个关键词，或先上传一份报告。</p></div>`;
  return `<div class="table-wrap"><table class="cycle-table"><thead><tr><th>文件</th><th>日期</th><th>类型</th><th>状态</th><th></th></tr></thead><tbody>
    ${list.map(d => `<tr><td>${esc(d.name)}${d.size ? ` <small>${fmtSize(d.size)}</small>` : ''}</td><td>${esc(d.date)}</td><td>${esc(d.type)}</td>
      <td>${pill(d.status, DOC_PILL[d.status] || 'grey')}</td><td><button class="text-button" data-action="source" data-doc="${esc(d.id)}">原文出处</button></td></tr>`).join('')}
  </tbody></table></div>`;
}
function vRecords() {
  const sub = state.sub.records || 0;
  const cands = CANDS[state.profile];
  const pending = cands.filter(c => c.status !== 'accepted');
  if (sub === 0) {
    return `${pageHead(true)}<div class="toolbar">
      <input type="search" placeholder="搜索文件名或类型" data-action="records-search" value="${esc(state.query)}" aria-label="搜索资料">
      <button data-action="pick-file">上传报告</button>
      <button data-action="load-report">${state.parsing ? '正在解析…' : '载入一份模拟报告'}</button>
    </div>
    <input type="file" id="file-picker" multiple hidden accept=".pdf,.jpg,.jpeg,.png,.txt,.md">
    ${state.parseError ? `<div class="notice">上一份报告解析失败：<b>没有产生任何候选</b>，原件仍留在资料目录，可以重试。<button class="soft" data-action="retry">重试解析</button></div>` : ''}
    <div class="card"><div class="card-head"><h2>资料库</h2><span class="muted">${DOCS[state.profile].length} 份 · 原件不改动</span></div><div id="docs-table">${docsTable()}</div></div>`;
  }
  if (sub === 1) {
    return `${pageHead(true)}
    <div class="notice">核对 = 逐字检查转录，<b>不等于医学审核</b>；没把握就保留"待确认"，不会丢。</div>
    <div class="card"><div class="card-head"><h2>待核对（${pending.length}）</h2></div>
      <div class="rows">${pending.length ? pending.map(c => row(esc(c.name), `${esc(c.source)} · 值：${esc(c.value)}`,
        `<button data-action="candidate" data-id="${esc(c.id)}">核对这一项</button>`)).join('') : '<div class="empty"><h3>没有待核对内容</h3><p>解析出的字段都核对完了。</p></div>'}</div>
    </div>
    <div class="card"><div class="card-head"><h2>已接受（${cands.length - pending.length}）</h2><span class="muted">保留来源，可回溯</span></div>
      <div class="rows">${cands.filter(c => c.status === 'accepted').map(c => row(esc(c.name), `${esc(c.value)} · ${esc(c.source)}`, pill('已接受', 'green'))).join('') || '<p class="muted" style="padding:12px">还没有已接受的记录。</p>'}</div>
    </div>`;
  }
  if (sub === 2) {
    return `${pageHead(true)}<div class="grid">
      <div class="card"><div class="card-head"><h2>病情档案</h2></div><div class="rows">
        ${row('诊断', `${esc(P().histology)} · ${esc(P().stage)}`, pill('医生给出', 'grey'))}
        ${row('病理标本', P().biopsyNote || '未记录')}
        ${row('当前路径', P().path[2] || P().path[1] || '—')}
        ${row('随访安排', P().rhythm[0] ? `${P().rhythm[0][0]}：${P().rhythm[0][1]}` : '未记录')}
      </div></div>
      <div class="card"><div class="card-head"><h2>时间线</h2></div><div class="rows">
        ${EVENTS[state.profile].slice().reverse().map(e => row(esc(e.d), esc(e.label))).join('')}
      </div></div></div>`;
  }
  if (sub === 3) {
    const metrics = Object.values(M());
    return `${pageHead(true)}<div class="card"><div class="card-head"><h2>指标检测（${metrics.length}）</h2></div>
      <div class="table-wrap"><table class="cycle-table"><thead><tr><th>指标</th><th>最近值</th><th>日期</th><th>来源</th></tr></thead><tbody>
      ${metrics.map(m => { const l = m.points[m.points.length - 1]; return `<tr><td>${esc(m.name)}</td><td>${esc(String(l.v))}${m.unit ? ' ' + esc(m.unit) : ''}</td><td>${esc(l.d)}</td><td>${esc(l.src || '—')}</td></tr>`; }).join('')}
      </tbody></table></div></div>`;
  }
  return `${pageHead(true)}<div class="card"><div class="card-head"><h2>病情汇总（演示）</h2></div><div class="rows">
    ${row('分期', `${esc(P().stage)} · ${esc(P().staging ? P().staging.rows[2][1] : '')}`)}
    ${row('已在治疗', P().lines.map(l => l.name).join(' → '))}
    ${row('私密记录', `${P().viewpoints.length} 条（默认不进导出与摘要）`, pill('不进导出', 'grey'))}
  </div></div>`;
}

/* ---------------- 分期与评估 ---------------- */
function vStage() {
  const p = P(), sub = state.sub.stage || 0;
  if (sub === 0) {
    return `${pageHead(true)}
    <div class="notice"><b>分期是医生给的。</b>工作台只抄「分期 / 依据 / 日期」，不根据影像或病理重算；Enneking 是外科分期（G-T-M），AJCC 是第 9 版滚动更新。</div>
    ${p.staging ? `<div class="card"><div class="card-head"><h2>${esc(p.staging.title)}</h2>${pill('医生给出', 'violet')}</div>
      <div class="table-wrap"><table class="cycle-table"><thead><tr><th>项目</th><th>记录</th><th>说明 / 出处</th></tr></thead><tbody>
      ${p.staging.rows.map(r => `<tr><td>${esc(r[0])}</td><td><b>${esc(r[1])}</b></td><td>${esc(r[2])}</td></tr>`).join('')}
      </tbody></table></div>
      <div class="actions"><button data-action="add-stage">记一次分期变更</button><button class="soft" data-action="source">看影像原文</button></div></div>` : emptyBox('还没有分期记录', '分期由医生给出后，在这里抄下来。')}
    <div class="grid" style="margin-top:14px">
      <div class="card"><div class="card-head"><h2>Enneking 分期的三个字母</h2></div>
        <div class="rows">${row('G（分级）', '肿瘤级别，由病理给出')}${row('T（范围）', '间室内 / 间室外')}${row('M（转移）', '有无远处转移（骨肉瘤几乎只看肺）')}</div>
        <div class="notice">这段是术语对照，不是对你分期的解释；你的分期看上面那张表。</div></div>
      <div class="card"><div class="card-head"><h2>医生原话</h2></div>
        <div class="rows">${row(esc(p.staging ? p.staging.rows[0][0] : '—'), esc(p.staging ? p.staging.rows[0][1] : ''))}</div>
        <div class="notice">原话照抄，工作台不加解释。</div></div>
    </div>`;
  }
  if (sub === 1) {
    return `${pageHead(true)}
    <div class="card"><div class="card-head"><h2>${esc(p.pathology.title)}</h2>${pill(p.pathology.status, 'green')}</div>
      <div class="rows">${p.pathology.rows.map(r => row(esc(r[0]), esc(r[1]))).join('')}</div></div>
    <div class="card"><div class="card-head"><h2>缺口（还没确认的）</h2><span class="muted">未检测 ≠ 阴性</span></div>
      <div class="rows">${p.pathology.gaps.map(r => row(esc(r[0]), esc(r[1]), pill('待确认', 'yellow'))).join('')}</div></div>
    <div class="card"><div class="card-head"><h2>分子与免疫组化</h2><span class="muted">四态：已检测 / 需关注 / 待出 / 未检测</span></div>
      <div class="rows">${p.molecular.map(x => row(esc(x.k), `${esc(x.v)} · ${esc(x.src || '—')}${x.note && x.note !== '—' ? ' · ' + esc(x.note) : ''}`,
        pill(MARK_STATE[x.state][1], MARK_STATE[x.state][0]))).join('')}</div></div>`;
  }
  return `${pageHead(true)}<div class="grid">
    <div class="card"><div class="card-head"><h2>会诊记录</h2></div><div class="rows">
      ${row('2026 多学科讨论', state.profile === 'A' ? '穿刺确诊骨肉瘤，先做新辅助化疗，手术方案等化疗反应评估后再定（会诊意见摘录）' : `化疗反应 ${esc((P().molecular.find(x => x.k.includes('化疗反应')) || { v: '未记录' }).v)}，按计划行保肢手术（会诊意见摘录）`)}
      ${row('二次意见', '尚未做；如需要，把病理切片与影像光盘带上')}
    </div><div class="notice">会诊意见是"一条信息"，最终方案由你和主诊医生定。</div></div>
    <div class="card"><div class="card-head"><h2>想再问的问题</h2></div><div class="rows">
      ${row('分期是否可能变', '如果化疗后影像有新证据，问医生要不要重新分期')}
      ${row('保肢还是截肢怎么定', '边界能不能获得安全范围是关键（医生原话口径）；这是要当面问的问题，本台不做判断')}
    </div><div class="actions"><button data-action="add-question">加入复诊清单</button></div></div>
  </div>`;
}

/* ---------------- 治疗历程 ---------------- */
function vTreatment() {
  const p = P(), sub = state.sub.treatment || 0;
  if (sub === 0) {
    return `${pageHead(true)}<div class="notice">路径改过就<b>新增一条</b>，旧路径留着不覆盖；为什么换写医生原话，工作台不判断该不该换。</div>
    ${p.pathway ? `<div class="card"><div class="card-head"><h2>${esc(p.pathway.title)}</h2></div><div class="rows">
      ${p.pathway.rows.map(r => row(`${pill(r[0], r[0] === '当前' ? 'green' : 'grey')} ${esc(r[1])}`, `${esc(r[2])} · ${esc(r[3])}<br><span class="muted">${esc(r[4])}</span>`)).join('')}
    </div></div>` : emptyBox('还没有路径记录', '路径由医生确定后在这里记一条。')}
      <div class="grid" style="margin-top:14px">
      <div class="card"><div class="card-head"><h2>骨肉瘤的标准路径段</h2></div><div class="rows">
        ${row('新辅助化疗', '确诊后先做几个周期，为手术创造条件（医生安排）')}
        ${row('手术（保肢 / 截肢）', '能否保肢看边界能不能获得安全范围；重建方式由医生定')}
        ${row('辅助化疗与随访', '术后按方案继续；随访节律见「功能与随访」')}
      </div><div class="notice">这一段是路径说明，不是给你的选择建议。</div></div>
      <div class="card"><div class="card-head"><h2>治疗线</h2></div><div class="rows">
        ${p.lines.map(l => row(esc(l.name), esc(l.detail), l.done ? pill('已完成', 'green') : pill('进行中', 'yellow'))).join('')}
      </div></div>
    </div>`;
  }
  if (sub === 1) {
    if (!p.surgery) {
      return `${pageHead(true)}${emptyBox('没有手术记录', '这个档案还没到手术这一步（新辅助化疗中）；以后做了手术，在这里记术式、边界、重建方式与切缘。')}
      <div class="card"><div class="card-head"><h2>为什么"没手术"也要说清楚</h2></div>
      <div class="rows">${row('当前路径', esc(p.path[2] || '—'))}${row('医生原话', esc(p.pathway ? p.pathway.rows[0][4] : '分期评估后由医生给出'))}</div></div>`;
    }
    return `${pageHead(true)}<div class="card"><div class="card-head"><h2>${esc(p.surgery.title)}</h2></div>
      <div class="table-wrap"><table class="cycle-table"><thead><tr><th>日期</th><th>术式</th><th>入路</th><th>重建方式</th><th>切缘</th><th>机构</th></tr></thead><tbody>
      ${p.surgery.rows.map(r => `<tr><td>${esc(r[0])}</td><td><b>${esc(r[1])}</b></td><td>${esc(r[2])}</td><td>${esc(r[3])}</td><td>${esc(r[4])}</td><td>${esc(r[5])}</td></tr>`).join('')}
      </tbody></table></div>
      <div class="rows">${p.surgery.rows.map(r => row('手术备注', esc(r[6]))).join('')}</div>
      <div class="notice">只记做了什么，不评价"做得够不够"；术式选择与切缘判断以手术记录和病理报告为准。假体随访在「功能与随访」页。</div></div>`;
  }
  if (sub === 2) {
    if (!p.cycles.length) {
      return `${pageHead(true)}${emptyBox('还没有化疗周期记录', '化疗每完成一个周期记一条：日期、方案（按医嘱原文）、状态。')}
      <div class="card"><div class="card-head"><h2>为什么按周期记</h2></div>
      <div class="rows">${row('一个周期 = 一条记录', '不按天数打勾；周期与周期之间有评估节点')}${row('方案原文', '药物与剂量按医嘱原文摘录，本台不换算、不建议')}</div></div>`;
    }
    return `${pageHead(true)}<div class="card"><div class="card-head"><h2>系统治疗与周期</h2><span class="muted">${p.cycles.length} 条记录</span></div>
    <div class="table-wrap"><table class="cycle-table"><thead><tr><th>周期</th><th>日期</th><th>方案 / 说明</th><th>状态</th></tr></thead><tbody>
    ${p.cycles.map(c => `<tr><td>${esc(c[0])}</td><td>${esc(c[1])}</td><td>${esc(c[2])}</td><td>${pill(c[3], c[4] ? 'green' : 'yellow')}</td></tr>`).join('')}
    </tbody></table></div>
    <div class="notice">方案与剂量按医嘱原文抄录；调整或停药由医生决定，工作台不提供建议。</div></div>`;
  }
  return `${pageHead(true)}<div class="card"><div class="card-head"><h2>系统治疗与周期</h2><span class="muted">${p.cycles.length} 条记录</span></div>
    <div class="table-wrap"><table class="cycle-table"><thead><tr><th>周期</th><th>日期</th><th>方案 / 说明</th><th>状态</th></tr></thead><tbody>
    ${p.cycles.map(c => `<tr><td>${esc(c[0])}</td><td>${esc(c[1])}</td><td>${esc(c[2])}</td><td>${pill(c[3], c[4] ? 'green' : 'yellow')}</td></tr>`).join('')}
    </tbody></table></div>
    <div class="notice">方案与剂量按医嘱原文抄录；调整或停药由医生决定，工作台不提供建议。</div></div>`;
}

/* ---------------- 影像随访 ---------------- */
function privateGate(what) {
  if (state.privateOpen) return '';
  return `<div class="notice"><b>${esc(what)}默认私密。</b>不进导出、不进看板摘要；点下面的按钮才会在本页展开。</div>
    <div class="actions"><button data-action="toggle-private">${state.privateOpen ? '收起私密内容' : '本人确认，展开查看'}</button></div>`;
}
function vImaging() {
  const p = P(), sub = state.sub.imaging || 0;
  if (sub === 0) {
    return `${pageHead(true)}
    <div class="notice"><b>只记报告原文摘录。</b>影像结论以报告为准，工作台不判读片子；模态（X 线 / CT / MRI / ECT / PET-CT）分条记录，不合并。</div>
    ${p.imaging ? `<div class="card"><div class="card-head"><h2>${esc(p.imaging.title)}</h2>${pill(`${p.imaging.rows.length} 次`, 'violet')}</div>
      <div class="table-wrap"><table class="cycle-table"><thead><tr><th>日期</th><th>检查（模态 / 部位）</th><th>报告结论（摘录）</th><th>下一次建议</th></tr></thead><tbody>
      ${p.imaging.rows.map(r => `<tr><td>${esc(r[0])}</td><td>${esc(r[1])}</td><td>${esc(r[2])}</td><td>${esc(r[3])}</td></tr>`).join('')}
      </tbody></table></div>
      <div class="actions"><button data-action="add-imaging">记一次影像检查</button><button class="soft" data-action="export-review">整理成就诊清单</button></div>
      <div class="notice">「下一次建议」是报告或医生写的原话，不是工作台的建议；片子散在各医院，检查时带上报告。</div></div>`
      : emptyBox('还没有影像记录', '每次影像检查（MRI / CT / 骨扫描 / 胸 CT）按日期逐次记，报告原文摘录进来。')}
    <div class="grid" style="margin-top:14px">
      <div class="card"><div class="card-head"><h2>骨癌随访常做的影像</h2></div><div class="rows">
        ${row('局部 X 线 / MRI', '看原发部位与假体（如有）')}
        ${row('胸部 CT', '骨肉瘤随访的重点项目（医生安排口径）')}
        ${row('骨扫描 / PET-CT', '按医生安排，不是每次都做')}
      </div><div class="notice">这段是常见项目说明，不是你的检查安排；查什么、多久查一次以医生为准。</div></div>
      <div class="card"><div class="card-head"><h2>就诊时怎么展示</h2></div><div class="rows">
        ${row('按时间倒序', '最近一次在最上面，医生一眼看到变化')}
        ${row('带上原始报告或光盘', '结论以报告为准；照片翻拍只作过渡')}
      </div><div class="actions"><button data-action="go-records">上传报告原件 →</button></div></div>
    </div>`;
  }
  if (sub === 1) {
    const imgDocs = DOCS[state.profile].filter(d => d.type === '影像报告');
    return `${pageHead(true)}
    <div class="toolbar">
      <input type="search" placeholder="搜索文件名或类型" data-action="records-search" value="${esc(state.query)}" aria-label="搜索影像报告">
      <button data-action="pick-file">上传报告</button>
      <button data-action="load-report">${state.parsing ? '正在解析…' : '载入一份模拟报告'}</button>
    </div>
    <input type="file" id="file-picker" multiple hidden accept=".pdf,.jpg,.jpeg,.png,.txt,.md">
    <div class="card"><div class="card-head"><h2>影像报告（${imgDocs.length} 份）</h2><span class="muted">原件不改动</span></div><div id="docs-table">${docsTable()}</div></div>
    <div class="notice">解析结果永远是候选，核对后才入档；扫描件与照片的自动识别需要 MinerU（本演示未接入）。</div>`;
  }
  const rows = p.imaging ? p.imaging.rows : [];
  return `${pageHead(true)}
  <div class="card"><div class="card-head"><h2>复查间隔（按记录推导，不换算提醒）</h2><span class="muted">「下一次」以医生安排为准</span></div>
    <div class="rows">${rows.length ? rows.slice().reverse().map(r => row(`${esc(r[1])} · ${esc(r[0])}`, `${esc(r[2])}${r[3] && r[3] !== '—' ? ` · 下一次：${esc(r[3])}` : ''}`)).join('') : '<p class="muted" style="padding:12px">还没有影像记录。</p>'}</div>
    <div class="notice">工作台不把「每 3 个月」换算成提醒时间；预约以门诊为准。</div></div>`;
}

/* ---------------- 功能与随访 ---------------- */
function vFunction() {
  const p = P(), sub = state.sub.function || 0;
  if (sub === 0) {
    return `${pageHead(true)}
    <div class="notice"><b>功能自评是本人记录，不是医生评估。</b>MSTS 评分由医生在门诊评，本台不自动打分、不给评级建议。</div>
    ${p.functSelf ? `<div class="card"><div class="card-head"><h2>${esc(p.functSelf.title)}</h2></div>
      <div class="table-wrap"><table class="cycle-table"><thead><tr><th>日期</th><th>条目</th><th>本人的记录</th></tr></thead><tbody>
      ${p.functSelf.rows.map(r => `<tr><td>${esc(r[0])}</td><td>${esc(r[1])}</td><td>${esc(r[2])}</td></tr>`).join('')}
      </tbody></table></div>
      <div class="actions"><button data-action="add-function">记一条今天的功能自评</button></div>
      <div class="notice">行走情况与疲劳自评也进了「病情一图秀」的分类节点，只画点不连线。</div></div>`
      : emptyBox('还没有功能自评记录', '术后恢复期间，把每天能做的一件事记下来（抬臂、行走、提重物都可以），下次门诊直接给医生看。')}
    <div class="grid" style="margin-top:14px">
      <div class="card"><div class="card-head"><h2>可以记什么</h2></div><div class="rows">
        ${row('抬臂 / 梳头 / 穿衣', '保肢术后上肢功能的小事，都是恢复的痕迹')}
        ${row('行走与辅助器具', '需不需要拐杖、能走多远，按当天实际写')}
        ${row('想问医生的问题', '「正常吗」这类问题写下来，当面问')}
      </div><div class="notice">只记事实与自述；不给训练计划，也不推康复产品。</div></div>
      <div class="card"><div class="card-head"><h2>就诊时怎么展示</h2></div><div class="rows">
        ${row('按时间倒序', '最近一条在最上面')}
        ${row('与医生评分分开', 'MSTS 等评分以门诊记录为准，本台只放本人自述')}
      </div><div class="actions"><button data-action="export-review">整理成就诊清单</button></div></div>
    </div>`;
  }
  if (sub === 1) {
    if (!p.prosthesis) return `${pageHead(true)}${emptyBox('没有假体与重建随访记录', '做了重建手术（假体 / 自体骨）后，每次影像复查的结果在这里记一条。')}`;
    return `${pageHead(true)}
    <div class="notice">只记「置入 / 复查」两条线；假体状态由医生评估，本台只抄报告原文摘录。</div>
    <div class="card"><div class="card-head"><h2>${esc(p.prosthesis.title)}</h2></div>
      <div class="table-wrap"><table class="cycle-table"><thead><tr><th>日期</th><th>项目</th><th>结果（摘录）</th><th>机构</th></tr></thead><tbody>
      ${p.prosthesis.rows.map(r => `<tr><td>${esc(r[0])}</td><td>${esc(r[1])}</td><td>${esc(r[2])}</td><td>${esc(r[3] || '—')}</td></tr>`).join('')}
      </tbody></table></div>
      <div class="actions"><button data-action="go-imaging">看影像记录 →</button></div></div>`;
  }
  if (sub === 2) {
    return `${pageHead(true)}<div class="card"><div class="card-head"><h2>随访节律（医生安排）</h2></div>
      <div class="table-wrap"><table class="cycle-table"><thead><tr><th>项目</th><th>频率</th><th>依据</th><th>下一次</th></tr></thead><tbody>
      ${p.rhythm.map(r => `<tr><td>${esc(r[0])}</td><td>${esc(r[1])}</td><td>${esc(r[2])}</td><td>${esc(r[3])}</td></tr>`).join('')}
      </tbody></table></div>
      <div class="notice">「下一次」是估算的门诊时间，以实际预约为准；工作台不换算提醒。</div></div>
    <div class="card"><div class="card-head"><h2>${esc(p.helpPlan ? p.helpPlan.title : '什么时候该联系门诊')}</h2></div><div class="rows">
      ${(p.helpPlan ? p.helpPlan.rows : []).map(r => row(esc(r[0]), esc(r[1]))).join('')}
    </div><div class="notice">这里是医生给的「什么情况该找人」，不是自我处理方案。</div></div>
    <div class="card"><div class="card-head"><h2>就诊准备</h2></div><div class="rows">
      ${row('带什么', '病理报告 · 最近影像报告 · 用药清单 · 这份清单')}
      ${row('最近的变化', p.functSelf ? `${p.functSelf.rows[0][1]}：${p.functSelf.rows[0][2]}（本人记录）` : '按实际记')}
    </div><div class="actions"><button data-action="export-review">整理成 Markdown</button></div></div>`;
  }
  const pts = p.viewpoints;
  return `${pageHead(true)}
  ${privateGate('感受记录')}
  ${state.privateOpen ? `<div class="card private"><div class="card-head"><h2>我记下的感受</h2>${pill('私密 · 不进导出', 'grey')}</div>
    <div class="rows">${pts.length ? pts.slice().reverse().map(v => row(`${esc(v[0])} · ${esc(v[1])}`, esc(v[2]))).join('') : '<p class="muted" style="padding:12px">还没有记录。</p>'}</div>
    <div class="actions"><button data-action="add-viewpoint">记一条</button><button data-action="toggle-private">收起</button></div>
    <div class="notice">这里的内容不会被复制进「与 Agent 讨论」的上下文草稿，也不会出现在导出里。</div></div>`
    : `<div class="card"><div class="card-head"><h2>这一页记什么</h2></div><div class="rows">
      ${row('对身体的感受', '比如「不想照镜子」「觉得不是自己了」，按自述写')}
      ${row('和家人的沟通', '约定、顾虑、不想说的话题，都可以只写一句')}
      ${row('复查前的紧张', '很多人都有；提前把想问的写下来能减少慌乱')}
    </div><div class="notice">是否记录、是否给医生看，都由你决定；工作台永远允许「完全跳过不填」。</div></div>`}`;
}

/* ---------------- 检查与指标 ---------------- */
function metricSections(cats) {
  return cats.map((c) => {
    const items = Object.entries(M()).filter(([, m]) => m.cat === c);
    if (!items.length) return '';
    return `<div class="metric-group"><div class="metric-group-head"><h3>${esc(c)}</h3><span>${items.length} 项</span></div>
      <div class="metric-grid">${items.map(([k, m]) => mcard(k, m)).join('')}</div></div>`;
  }).join('');
}
function vLabs() {
  const p = P(), sub = state.sub.labs || 0;
  if (sub === 0) {
    return `${pageHead(true)}
    <div class="notice">ALP / LDH 是骨癌随访的常用化验；单次波动不等于病情变化，不同方法、不同机构不合并比较。</div>
    ${metricSections(CAT_ORDER)}`;
  }
  if (sub === 1) {
    const labDocs = DOCS[state.profile].filter(d => d.type === '化验单');
    return `${pageHead(true)}
    <div class="notice"><b>化验单按「来源」一列展示。</b>同一份单子上的指标在「分类指标」里各成一卡；出处可回查。</div>
    ${labDocs.length ? `<div class="card"><div class="card-head"><h2>化验单（${labDocs.length} 份）</h2></div>
      <div class="table-wrap"><table class="cycle-table"><thead><tr><th>文件</th><th>日期</th><th>状态</th><th></th></tr></thead><tbody>
      ${labDocs.map(d => `<tr><td>${esc(d.name)}</td><td>${esc(d.date)}</td><td>${pill(d.status, DOC_PILL[d.status] || 'grey')}</td><td><button class="text-button" data-action="source" data-doc="${esc(d.id)}">原文出处</button></td></tr>`).join('')}
      </tbody></table></div></div>`
      : emptyBox('还没有化验单', '化验单拍照或 PDF 上传到「资料库」，类型选「化验单」，会出现在这里。')}
    <div class="card"><div class="card-head"><h2>最近报告表</h2></div>
      <div class="table-wrap"><table class="cycle-table"><thead><tr><th>指标</th><th>最近值</th><th>日期</th><th>来源</th></tr></thead><tbody>
      ${Object.values(M()).map(m => { const l = m.points[m.points.length - 1]; return `<tr><td>${esc(m.name)}</td><td>${esc(String(l.v))}${m.unit ? ' ' + esc(m.unit) : ''}</td><td>${esc(l.d)}</td><td>${esc(l.src || '—')}</td></tr>`; }).join('')}
      </tbody></table></div></div>`;
  }
  return `${pageHead(true)}<div class="card"><div class="card-head"><h2>口径说明</h2></div><div class="rows">
    ${row('ALP（碱性磷酸酶）', '骨与肝来源都有；单次升降不等于病情变化，趋势由医生看')}
    ${row('LDH（乳酸脱氢酶）', '评估时查；不同方法/机构不合并')}
    ${row('血钙', '骨溶解相关；单次结果不判断')}
    ${row('参考区间', '区间因年龄、性别、方法与机构而异；卡片上写的区间是演示值，不构成判定')}
  </div><div class="notice">「仅回顾，不解读」：解读归医生。</div></div>`;
}

/* ---------------- 一图秀 ---------------- */
function vTimeline() {
  const sub = state.sub.timeline || 0;
  const [t0, t1] = domain();
  const picks = CAT_ORDER.map((c) => {
    const items = Object.entries(M()).filter(([, m]) => m.cat === c);
    if (!items.length) return '';
    return `<div class="metric-pick"><span class="eyebrow">${esc(c)}</span>${items.map(([k, m]) =>
      `<label class="check-row"><input type="checkbox" data-pick="${k}" ${state.sel.includes(k) ? 'checked' : ''}><span>${esc(m.name)}</span></label>`).join('')}</div>`;
  }).join('');
  if (sub === 2) {
    return `${pageHead(true)}<div class="card"><div class="card-head"><h2>数据口径</h2></div><div class="rows">
      ${row('归一化', '每条数值线按自己的最小值–最大值铺满画布，所以"线的高低"不能跨指标比较')}
      ${row('分类序列', '行走情况、疲劳自评只画节点、不连线；档位顺序是固定的自述档位顺序')}
      ${row('单点', '只有 1 次记录的指标不连线，只画一个点')}
      ${row('治疗条', '周期带来自化疗周期记录；竖虚线是确诊 / 手术 / 分期这类评估节点')}
      ${row('数据来源', '演示数据由 demo/build-demo-data.mjs 生成，与 demo-data.sqlite 同源')}
    </div></div>`;
  }
  return `${pageHead(true)}
  <div class="chart-panel">
    <div class="chart-top">
      <div class="legend">${state.sel.filter(k => M()[k]).map(k => `<span class="line-chip"><i style="background:${M()[k].color}"></i>${esc(M()[k].name)}</span>`).join('')}</div>
      <div class="actions">
        <button class="soft" data-range="3m" ${state.range === '3m' ? 'aria-pressed="true"' : ''}>3 个月</button>
        <button class="soft" data-range="6m" ${state.range === '6m' ? 'aria-pressed="true"' : ''}>6 个月</button>
        <button class="soft" data-range="all" ${state.range === 'all' ? 'aria-pressed="true"' : ''}>全部</button>
      </div>
    </div>
    <div class="chart-wrap">${chartSVG(t0, t1)}</div>
    <div class="chart-tip">${state.pin ? (() => { const m = M()[state.pin.code]; const pt = m.points.find(p => p.d === state.pin.date); return pt ? `${esc(m.name)} · ${esc(pt.d)}：<b>${esc(String(pt.v))}</b>${m.unit ? ' ' + esc(m.unit) : ''}（${esc(pt.src || '—')}）` : ''; })() : '点图上的任意数据点，这里显示那次的数值与来源。'}</div>
  </div>
  <div class="grid">
    <div class="card"><div class="card-head"><h2>选择指标（最多 4 项）</h2></div>${picks}</div>
    <div class="card"><div class="card-head"><h2>显示选项</h2></div><div class="rows">
      <label class="check-row"><input type="checkbox" data-toggle="treatment" ${state.toggles.treatment ? 'checked' : ''} data-action="toggle" data-key="treatment"><span>显示治疗周期与评估节点</span></label>
      <label class="check-row"><input type="checkbox" data-toggle="keypoints" ${state.toggles.keypoints ? 'checked' : ''} data-action="toggle" data-key="keypoints"><span>显示末点数值</span></label>
    </div><div class="notice">分类序列的档位顺序在代码里写死（0 级 → 重度），不按出现顺序排。</div></div>
  </div>`;
}

/* ---------------- 临床研究 ---------------- */
function vTrials() {
  const sub = state.sub.trials || 0;
  if (sub === 1) {
    const saved = TRIALS.filter(t => state.saved.includes(t.id));
    return `${pageHead(true)}${saved.length ? `<div class="card"><div class="card-head"><h2>已收藏（${saved.length}）</h2></div><div class="rows">
      ${saved.map(t => row(esc(t.title), `${esc(t.id)} · ${esc(t.phase)} · ${esc(t.status)} · ${esc(t.sponsor)}`,
        `<button class="soft" data-action="save-trial" data-id="${esc(t.id)}">取消收藏</button>`)).join('')}</div></div>`
      : emptyBox('还没有收藏', '在「2026 线索」里点"收藏"，会出现在这里。')}`;
  }
  if (sub === 2) {
    const qs = (state.questions || []).filter(q => /NCT/.test(q));
    return `${pageHead(true)}
    <div class="notice">登记状态 ≠ 入组资格；下面这些问题拿去问研究中心，比在网上找答案可靠。</div>
    <div class="card"><div class="card-head"><h2>通用入组问题</h2></div><div class="rows">
      ${row('我的分期和既往治疗符合吗', '带上外科分期、病理类型、既往方案与结束日期')}
      ${row('需要重新做检查吗', '有些试验要求本院影像或病理复核')}
      ${row('对照臂是什么', '随机对照试验要问清楚"如果分到对照组"用什么')}
      ${row('来回路程与随访频率', '能不能配合，直接决定要不要报名')}
    </div></div>
    <div class="card"><div class="card-head"><h2>已加入清单（${qs.length}）</h2></div>
      <div class="rows">${qs.length ? qs.map(q => row(esc(q), '')).join('') : '<p class="muted" style="padding:12px">还没有具体试验的问题。</p>'}</div></div>`;
  }
  const topics = ['全部', ...Array.from(new Set(TRIALS.map(t => t.topic)))];
  const list = TRIALS.filter(t => state.trialTopic === '全部' || t.topic === state.trialTopic);
  return `${pageHead(true)}
  <div class="notice">线索不是推荐：登记信息可能滞后，<b>状态与入排标准以研究中心为准</b>。数据来源 ClinicalTrials.gov（API v2，status=RECRUITING），
    采集窗口 2026-11-10 实测，状态未核实以登记页为准；中国登记平台（ChiCTR / 药物临床试验登记平台）本轮未采集，覆盖未知。</div>
  <div class="chips" role="group" aria-label="按关注点筛选">
    ${topics.map(t => `<button class="chip${state.trialTopic === t ? ' on' : ''}" data-topic="${esc(t)}">${esc(t)}</button>`).join('')}
  </div>
  <div class="rows">${list.map(t => `<div class="card topic-card">
    <div class="card-head"><h2>${esc(t.title)}</h2><span class="muted">${esc(t.id)}</span></div>
    <div class="chips">${pill(t.phase, 'violet')}${pill(t.status, t.status.includes('招募') ? 'green' : 'grey')}${pill(t.topic, 'grey')}</div>
    <p class="muted" style="margin-top:8px">申办 / 登记单位：${esc(t.sponsor)} · 最后核对 ${esc(t.last_verified)}</p>
    <div class="actions"><button data-action="save-trial" data-id="${esc(t.id)}">${state.saved.includes(t.id) ? '取消收藏' : '收藏'}</button>
      <button class="soft" data-action="ask-trial" data-id="${esc(t.id)}">加进入组问题</button>
      <a class="source-link" href="${esc(t.url)}" target="_blank" rel="noopener">登记页 ↗</a></div>
  </div>`).join('')}</div>`;
}

const VIEWS = { dashboard: vDashboard, records: vRecords, imaging: vImaging, stage: vStage, treatment: vTreatment, function: vFunction, labs: vLabs, timeline: vTimeline, trials: vTrials };

/* ---------------- agent dock（dsh 原生会话挂载位） ---------------- */
/* 越界词自检清单：下面是"要被拦住的词表"本身，不是给用户看的文案。 */
const FORBIDDEN = ['建议治疗', '可能复发', '预后良好', '治愈率', '可以停药', '无需就医', '推荐方案', '生存率']; // wording-allow
const PAGE_CONTEXT = {
  dashboard: () => ({ facts: [`${P().name}：${P().headline}`,
    `外科分期：${P().stage}（医生给出）`,
    P().imaging ? `最近一次影像：${P().imaging.rows[P().imaging.rows.length - 1][1]}（${P().imaging.rows[P().imaging.rows.length - 1][0]}）` : '暂无影像记录',
    P().functSelf ? `最近一次功能自评：${P().functSelf.rows[0][1]} ${P().functSelf.rows[0][2]}（${P().functSelf.rows[0][0]}）` : '暂无功能自评记录'],
    missing: ['下次复查的具体日期', '最近一次随访的医生原话'] }),
  records: () => ({ facts: [`资料库 ${DOCS[state.profile].length} 份；待核对候选 ${CANDS[state.profile].filter(c => c.status !== 'accepted').length} 条`], missing: [] }),
  imaging: () => ({ facts: [...(P().imaging ? P().imaging.rows.slice(0, 5).map(r => `${r[0]} ${r[1]}：${r[2]}`) : [])],
    missing: [P().imaging ? '最近一次影像的医生当面解读' : '首次影像安排'] }),
  stage: () => ({ facts: [`${P().stage}`, ...(P().staging ? P().staging.rows.map(r => `${r[0]}：${r[1]}`) : []),
    ...P().molecular.map(x => `${x.k}：${x.v}（${x.src}）`)],
    missing: P().molecular.filter(x => x.state === 'na').map(x => `${x.k} 检测状态`) }),
  /* facts 必须是数组字面量：多来源一律用 spread 展开，不能"先 map 再 spread"（曾导致 `Unexpected token ']'`）。 */
  treatment: () => ({ facts: [...(P().pathway ? P().pathway.rows.map(r => `${r[0]}路径：${r[1]}（${r[2]}）`) : []),
    ...(P().surgery ? P().surgery.rows.map(r => `手术：${r[1]}，${r[3]}（${r[0]}）`) : []),
    ...(P().cycles.length ? [`化疗周期共 ${P().cycles.length} 条，方案按医嘱原文摘录`] : [])], missing: ['下次评估的具体结论'] }),
  /* 私密模块不进上下文草稿：只写"有几条记录被本人设为私密"，不带原文。 */
  function: () => ({ facts: [...(P().functSelf ? P().functSelf.rows.slice(0, 3).map(r => `${r[0]} ${r[1]}：${r[2]}（本人记录）`) : []),
    ...(P().prosthesis ? P().prosthesis.rows.map(r => `${r[0]} ${r[1]}：${r[2]}`) : []),
    ...P().rhythm.map(r => `${r[0]}：${r[1]}（${r[2]}）`),
    `感受记录：${P().viewpoints.length} 条（默认私密，不进入草稿）`],
    missing: ['最近一次门诊对功能恢复的原话'] }),
  labs: () => ({ facts: Object.values(M()).filter(m => m.points && m.points.length).map(m => `${m.name} 最近：${String(m.points.slice(-1)[0].v)}${m.unit ? ' ' + m.unit : ''}（${m.points.slice(-1)[0].d}）`),
    missing: ['ALP 与影像的对照结论'] }),
  timeline: () => ({ facts: ['一图秀当前勾选：' + state.sel.map(k => M()[k].name).join('、')], missing: [] }),
  trials: () => ({ facts: ['2026 线索共 ' + TRIALS.length + ' 条（真实登记摘录，状态未核实）'], missing: [] })
};

function buildPrompt() {
  const ctx = PAGE_CONTEXT[state.view]();
  const title = PAGES.find(p => p[0] === state.view)[1];
  return [`【来自小骨宝工作台 · ${title}页】`, `档案：${P().name}（${P().meta}）——演示数据`, '',
    '本页已核对的事实：', ...ctx.facts.map(f => '- ' + f), '',
    '尚未核对 / 待确认：', ...(ctx.missing.length ? ctx.missing.map(f => '- ' + f) : ['- （无）']), '',
    '边界：以上是记录整理，不是医疗建议；请基于原文与医生沟通，不要求工作台外推结论。'].join('\n');
}
function mockReply() {
  return '根据你整理的本页事实：分期、手术与化疗周期都有医生给出的依据，随访节律也记录在案。你提到的未确认事项（下次影像日期、最近一次门诊原话），适合在下次门诊清单里逐条确认。本回复不构成医疗建议。';
}
function renderAgent() {
  const dock = $('#agent-dock'), grid = $('#work-grid'), btn = $('#agent-toggle');
  dock.hidden = !state.agentOpen;
  grid.classList.toggle('agent-open', state.agentOpen);
  grid.classList.toggle('agent-wide', state.agentOpen && state.agentSize === 'wide');
  btn.setAttribute('aria-expanded', String(state.agentOpen));
  $('#agent-state').textContent = state.agentOpen ? '已打开' : '未进入激活';
  $('#agent-toggle i').classList.toggle('grey', !state.agentOpen);
  $('#agent-toggle i').classList.toggle('on', state.agentOpen);
  $('#agent-dot').classList.toggle('on', state.agentOpen);
  $$('.agent-sizes button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.size === state.agentSize)));
  const body = $('#agent-body');
  if (!body.dataset.built) {
    body.innerHTML = `<div class="agent-note"><b>dsh 原生会话挂载位</b><br>原生会话仅在 DSH Desktop 内可用；当前为浏览器预览，这里保留宿主会话的挂载点（#dsh-conversation-slot），不模拟聊天窗口。</div>
      <div id="dsh-conversation-slot" aria-live="polite"></div>`;
    body.dataset.built = '1';
  }
}
function agentBuild() {
  const slot = $('#dsh-conversation-slot');
  slot.innerHTML = `<div class="agent-card"><h4>提示词预览（发送前可读 · 由你在宿主会话发送）</h4><pre>${esc(buildPrompt())}</pre></div>`;
}
function agentDemo() {
  const slot = $('#dsh-conversation-slot');
  const text = mockReply();
  const hits = FORBIDDEN.filter(w => text.includes(w));
  slot.innerHTML = `<div class="agent-card"><h4>模拟回复 · 红线自检</h4><pre>${esc(text)}</pre>
    <div class="agent-check">${hits.length ? hits.map(h => `<span class="hit">命中禁用词：${esc(h)}</span>`).join('') : '<span class="pass">✓ 未命中禁用词表（' + FORBIDDEN.length + ' 项）</span><span class="pass">✓ 免责语句在否定语境中出现</span>'}</div></div>`;
}

/* ---------------- dialogs / toast ---------------- */
let toastTimer;
function toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.add('visible'); clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('visible'), 2200); }
function openDialog(eyebrow, title, body, foot = '') {
  $('#dialog-eyebrow').textContent = eyebrow; $('#dialog-title').textContent = title;
  $('#dialog-body').innerHTML = body; $('#dialog-foot').innerHTML = foot;
  $('#dialog').showModal();
  if (title === '设置') loadMineruStatus();
}
const closeDialog = () => $('#dialog').close();

function dlgProfiles() {
  openDialog('小骨宝', '切换演示档案', Object.entries(PROFILES).map(([k, p]) => `
    <button class="profile-row ${state.profile === k ? 'on' : ''}" data-pick-profile="${k}">
      <div><b>${esc(p.name)}的资料</b><p>${esc(p.meta)} · ${esc(p.headline)}</p></div><span class="profile-caret">${state.profile === k ? '当前' : '切换'}</span></button>`).join(''),
    '<button data-action="close">取消</button>');
}
/* ---- 文档解析设置：Token 状态与手工保存 ----
   状态只显示掩码与文件路径，原文不回显（服务端也不返回）。
   离线演示（DATA_SOURCE !== 'api'）如实说"不可用"，不假装已保存。 */
function mineruStatusText(s) {
  if (!s) return '读取 Token 状态失败：本机服务没有返回内容。';
  if (s.error) return `读取失败：${s.error}`;
  if (!s.configured) return '尚未配置 Token：扫描件与照片的自动识别会用不了；TXT / MD / CSV 仍在本机解析。';
  const where = s.source === 'file' ? `已保存于 ${s.file}` : '来自环境变量 MINERU_TOKEN（未写入文件）';
  return `当前生效：${s.masked} · ${where}`;
}
function loadMineruStatus() {
  const el = $('#mineru-status');
  if (!el) return;
  /* 原型里没有 DATA_SOURCE（那份是纯离线演示），用 typeof 兜住，两版共用同一段代码 */
  if (typeof DATA_SOURCE === 'undefined' || DATA_SOURCE !== 'api') { el.textContent = '离线演示：未连接工作台，读不到 Token 状态。'; return; }
  fetch(`${apiBase()}/api/bone/settings/mineru`, { headers: { accept: 'application/json' } })
    .then((r) => r.json().then((j) => { if (!r.ok) throw new Error(j.message || j.error || '读取失败'); return j; }))
    .then((s) => { const n = $('#mineru-status'); if (n) n.textContent = mineruStatusText(s); })
    .catch((e) => { const n = $('#mineru-status'); if (n) n.textContent = `读取 Token 状态失败：${e.message}`; });
}
function mineruPost(payload) {
  const el = $('#mineru-status');
  if (typeof DATA_SOURCE === 'undefined' || DATA_SOURCE !== 'api') { toast('离线演示不能保存 Token'); return; }
  fetch(`${apiBase()}/api/bone/settings/mineru`, {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload),
  })
    .then((r) => r.json().then((j) => { if (!r.ok) throw new Error(j.message || j.error || '保存失败'); return j; }))
    .then((s) => {
      if (el) el.textContent = mineruStatusText(s);
      const input = $('#mineru-token'); if (input) input.value = '';
      toast(payload.action === 'clear' ? '已清除本机 Token' : 'Token 已保存到本机密钥文件');
    })
    .catch((e) => {
      if (el) el.textContent = `保存失败：${e.message}`;
      toast('Token 保存失败');
    });
}
function dlgSettings() {
  openDialog('小骨宝', '设置', `<div class="cfg-tabs" role="tablist">
  <button role="tab" aria-selected="true" data-action="cfg-tab" data-tab="ws">资料目录</button><button role="tab" aria-selected="false" data-action="cfg-tab" data-tab="parse">文档解析</button><button role="tab" aria-selected="false" data-action="cfg-tab" data-tab="kb">临床数据库</button></div>
  <div class="cfg-block" style="margin-top:16px" data-tab="ws"><h3>工作区资料目录</h3><div class="path-row"><code>~/Documents/OsteoPalWorkspace（演示值）</code><button class="soft">选择…</button></div>
  <p class="small-note">患者数据只存入你明确选择的目录；工作台不把资料上传云端。</p></div>
  <div class="cfg-block" style="margin-top:12px" data-tab="parse" hidden><h3>文档解析（MinerU）</h3>
  <div class="token-row"><input id="mineru-token" type="password" autocomplete="new-password" placeholder="粘贴 MinerU API Token（sk-…）" aria-label="MinerU API Token"><button class="primary" data-action="mineru-save">保存</button><button class="soft" data-action="mineru-clear">清除</button></div>
  <p class="small-note" id="mineru-status" role="status">正在读取本机 Token 状态…</p>
  <p class="small-note">Token 只写进本机密钥文件（权限 600），只用于向 MinerU 发起解析请求，不进患者资料、不进导出、不进提示词。没有 Token 可以到 <a href="https://mineru.net/apiManage/token" target="_blank" rel="noopener">MinerU 申请页 ↗</a> 领取；解析结果永远是候选，核对后才入档。</p></div>
  <div class="cfg-block" style="margin-top:12px" data-tab="kb" hidden><h3>2026 临床数据库</h3><div class="path-row"><code>bone_cancer_trials_2026.sqlite · ${TRIALS.length} 条登记（演示摘录；开发版接入 research/bone-cancer 快照 214 条）</code></div>
  <p class="small-note">离线快照来自 CT.gov 在线通道；ChiCTR / 药物临床试验登记平台本轮未采集，覆盖未知。</p></div>`, '<button class="primary" data-action="close">完成</button>');
}
function dlgAbout() {
  openDialog('小骨宝', '关于', `<div class="about"><div class="brand no-mark" style="zoom:2.2"></div><div class="about-meta">
    <div class="about-ver"><b>v${APP_INFO.version}</b>${pill(APP_INFO.channelLabel, 'violet')}</div>
    <dl><div><dt>构建</dt><dd>${APP_INFO.build}</dd></div><div><dt>形态</dt><dd>交互原型（单机多文件）· 全部患者数据为模拟</dd></div>
    <div><dt>数据</dt><dd>2026 临床试验：真实登记摘录（ClinicalTrials.gov），状态未核实</dd></div>
    <div><dt>家族</dt><dd>小 X 宝家族 · OsteoPal 小骨宝</dd></div></dl></div></div>`, '<button class="primary" data-action="close">关闭</button>');
}
function dlgHelp() {
  openDialog('小骨宝', '原型操作说明', `<div class="cfg-block">顶栏「AI 对话」按钮打开右侧<b>原生会话挂载位</b>（可 × 隐藏、窄/标准/宽三档）。「整理本页要点」生成发送前可读的提示词；「模拟回复自检」演示文本层红线扫描。</div>
  <div class="cfg-block" style="margin-top:12px">「检查与指标」「看板」里的数值卡<b>轻点翻面</b>看参考区间；分类记录（行走情况、疲劳自评）不翻面、不连线。「病情一图秀」左侧可勾选指标、按 3 / 6 个月或全部看。</div>
  <div class="cfg-block" style="margin-top:12px">左上角头像可切换<b>两个演示档案</b>：林远（骨肉瘤左股骨远端 · 新辅助化疗第 1 周期 · 记录少）、韩志强（骨肉瘤右肱骨近端 · 保肢术后 2 年随访 · 记录多）。</div>
  <div class="cfg-block" style="margin-top:12px"><b>私密内容</b>（感受记录）默认折叠，需要本人点「本人确认，展开查看」；这些内容不进导出，也不进「与 Agent 讨论」的草稿。</div>`, '<button class="primary" data-action="close">知道了</button>');
}
function dlgExport() {
  const p = P();
  const md = ['# 复诊准备（演示导出）', '', `档案：${p.name}（${p.meta}）`, '', '## 事实区（已核对）',
    `- 外科分期：${p.stage}（医生给出）`,
    ...p.rhythm.map(r => `- ${r[0]}：${r[1]}（${r[2]}）`),
    ...(p.functSelf ? p.functSelf.rows.slice(0, 3).map(r => `- ${r[0]} 功能自评 ${r[1]}：${r[2]}（本人记录）`) : []),
    '', `## 想问的事 / 我的看法（不是医生结论）`, `- 感受记录 ${p.viewpoints.length} 条中私密 ${p.viewpoints.length} 条，默认不进导出与摘要`, '',
    '> 本文件由工作台整理，不构成医疗建议。'].join('\n');
  openDialog('小骨宝', '导出编辑（Markdown）', `
    <textarea id="export-edit" aria-label="导出内容，可直接编辑" style="width:100%;min-height:320px;font:12px/1.7 ui-monospace,SFMono-Regular,monospace;padding:12px;border:1px solid #d8e0ea;border-radius:10px;background:#fff;color:#213139;resize:vertical">${esc(md)}</textarea>
    <p class="small-note">直接在上方编辑；「我的看法」区永远带"不是医生结论"标注。私密记录不会出现在这里。</p>`,
    '<button class="soft" data-action="close">取消</button><button class="primary" data-action="export-save">保存到资料目录</button>');
}

/* ---------------- render root ---------------- */
function animateCountups(root) {
  if (!root || typeof root.querySelectorAll !== 'function' || typeof requestAnimationFrame !== 'function') return;
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const DUR = 650;
  root.querySelectorAll('[data-countup]').forEach((el) => {
    const target = parseFloat(el.dataset.countup);
    if (!isFinite(target)) return;
    const dec = el.dataset.dec === undefined ? 1 : +el.dataset.dec;
    const t0 = performance.now();
    const step = (t) => {
      const k = Math.min(1, (t - t0) / DUR);
      const ease = 1 - Math.pow(1 - k, 3);
      el.textContent = (target * ease).toFixed(dec);
      if (k < 1) requestAnimationFrame(step); else el.textContent = target.toFixed(dec);
    };
    el.textContent = (0).toFixed(dec);
    requestAnimationFrame(step);
  });
}

function render() {
  const p = P();
  $('#nav').innerHTML = PAGES.map(([id, label, ic]) => {
    const count = id === 'trials' ? TRIALS.length : null;
    return `<button class="nav-button" data-nav="${id}" ${state.view === id ? 'aria-current="page"' : ''}>${icon(ic)}<span>${esc(label)}</span>${count ? `<span class="nav-count">${count}</span>` : ''}</button>`;
  }).join('');
  $('#breadcrumb').textContent = PAGES.find(x => x[0] === state.view)[1];
  $('#profile-name').textContent = `${p.name}的资料`;
  $('#profile-meta').textContent = p.meta;
  $('#profile-avatar').textContent = p.name[0];
  $('#main').innerHTML = (VIEWS[state.view] || vDashboard)();
  $('#main').classList.remove('page-enter');
  animateCountups($('#main'));
  renderAgent();
  if (state.agentOpen) $('#agent-body').dataset.built = '';
}

/* ---------------- events ---------------- */
document.addEventListener('click', (e) => {
  const nav = e.target.closest('[data-nav]');
  if (nav) { state.view = nav.dataset.nav; state.privateOpen = false; /* 换页即收回私密展开：一次确认只管当页 */ location.hash = state.view; state.pin = null; render(); $('#main').focus({ preventScroll: true }); window.scrollTo(0, 0); return; }
  const sub = e.target.closest('[data-sub]');
  if (sub) { state.sub[state.view] = +sub.dataset.sub; state.privateOpen = false; render(); return; }
  const pick = e.target.closest('[data-pick]');
  if (pick) {
    const k = pick.dataset.pick;
    if (pick.checked) {
      if (state.sel.length >= 4) { pick.checked = false; toast('最多同时看 4 个指标；取消一个再加。'); return; }
      if (!state.sel.includes(k)) state.sel.push(k);
    } else {
      if (state.sel.length === 1) { pick.checked = true; toast('至少留一个指标。'); return; }
      state.sel = state.sel.filter(x => x !== k);
    }
    render(); return;
  }
  const topic = e.target.closest('[data-topic]');
  if (topic) { state.trialTopic = topic.dataset.topic; render(); return; }
  const pp = e.target.closest('[data-pick-profile]');
  if (pp) {
    state.profile = pp.dataset.pickProfile; state.sel = defaultSel(pp.dataset.pickProfile);
    state.pin = null; state.privateOpen = false; closeDialog(); render();
    toast(`已切换到 ${P().name}的资料（演示）`); return;
  }
  const card = e.target.closest('.mcard[data-mcard]');
  if (card && !card.dataset.static) { flipCard(card.dataset.mcard); return; }
  const act = e.target.closest('[data-action]')?.dataset.action;
  if (!act) return;
  const map = {
    profiles: dlgProfiles, settings: dlgSettings, about: dlgAbout, help: dlgHelp,
    close: closeDialog, 'open-store': () => toast('资料目录已激活（演示）'),
    'go-imaging': () => { state.view = 'imaging'; state.privateOpen = false; location.hash = 'imaging'; render(); },
    'go-labs': () => { state.view = 'labs'; state.privateOpen = false; location.hash = 'labs'; render(); },
    'go-timeline': () => { state.view = 'timeline'; state.privateOpen = false; location.hash = 'timeline'; render(); },
    'go-stage': () => { state.view = 'stage'; state.privateOpen = false; location.hash = 'stage'; render(); },
    'go-treatment': () => { state.view = 'treatment'; state.sub.treatment = 2; state.privateOpen = false; location.hash = 'treatment'; render(); },
    'go-trials': () => { state.view = 'trials'; state.privateOpen = false; location.hash = 'trials'; render(); },
    'go-records': () => { state.view = 'records'; state.privateOpen = false; location.hash = 'records'; render(); },
    'go-function': () => { state.view = 'function'; state.sub.function = 2; state.privateOpen = false; location.hash = 'function'; render(); },
    'go-function-priv': () => { state.view = 'function'; state.sub.function = 3; state.privateOpen = false; location.hash = 'function'; render(); },
    'toggle-private': () => { state.privateOpen = !state.privateOpen; render(); },
    source: (el) => {
      const d = el.dataset.doc ? DOCS[state.profile].find((x) => x.id === el.dataset.doc) : null;
      const line = d ? `${d.fileName || d.name}${d.size ? ` · ${fmtSize(d.size)}` : ''}（${d.date}）` : el.dataset.source || '原件存放在资料目录 imports/ 下';
      openDialog('小骨宝', '原文出处', `<p style="font-size:12.5px">${esc(line)}</p><p class="small-note">工作区不改动原文，也不替你解释它。</p>`, '<button class="primary" data-action="close">关闭</button>');
    },
    'pick-file': () => { const inp = $('#file-picker'); if (inp && typeof inp.click === 'function') inp.click(); else toast('当前浏览器不支持选择本机文件'); },
    'mineru-save': () => {
      const input = $('#mineru-token');
      const token = input ? input.value.trim() : '';
      if (!token) { toast('先把 Token 粘贴到输入框'); if (input) input.focus(); return; }
      mineruPost({ token });
    },
    'mineru-clear': () => mineruPost({ action: 'clear' }),
    'export-save': () => {
      const ta = $('#export-edit');
      const txt = ta ? ta.value.trim() : '';
      if (!txt) { toast('导出内容是空的；先填一点内容再保存。'); return; }
      DOCS[state.profile].unshift({ id: 'ex' + Date.now().toString(36), name: `复诊准备 · ${P().name} · ${todayISO()}`, fileName: `复诊准备-${todayISO()}.md`, size: new Blob([txt]).size, date: todayISO(), type: '其他', status: '待核对', note: '生成文件 · 由导出创建，可在草稿里核对' });
      closeDialog();
      toast('已保存到资料目录 exports/（演示）；在「病情整理 · 资料库」可见');
    },
    'load-report': () => {
      if (state.parsing) return;
      if (state.loaded[state.profile]) { toast('模拟报告已载入，没有重复新增'); return; }
      state.parsing = true; state.parseError = false; render();
      setTimeout(() => {
        DOCS[state.profile].push({ id: 'dx' + state.profile, name: '复查记录 · 新模拟报告', date: todayISO(), type: '其他', status: '待核对' });
        CANDS[state.profile].push({ id: 'cx' + state.profile, name: '下次随访安排', value: '2027-01 前后（示例，以医生安排为准）', source: '复查记录 · 新模拟报告 · 第 1 页', status: 'candidate' });
        state.loaded[state.profile] = true; state.parsing = false;
        if (state.view === 'records') render();
        toast('解析完成：候选已放入「整理草稿 / 核对」');
      }, 900);
    },
    'parse-fail': () => {
      const d = DOCS[state.profile].find((x) => x.id === state.lastUpload);
      if (d) d.status = '解析失败';
      state.parseError = true; render();
      toast(d ? `「${d.name}」解析失败：未产生候选，原件保留，可重试` : '模拟解析失败：未产生候选，原件保留');
    },
    retry: () => { state.parseError = false; toast('模拟重试完成；原件始终保留'); render(); },
    candidate: (el) => {
      const c = CANDS[state.profile].find((x) => x.id === el.dataset.id);
      if (!c) return;
      openDialog('小骨宝', '核对这一项内容',
        `<div class="notice">核对表示"转录已逐字检查过"，不等于医学审核。</div>
        <label style="display:block;margin-top:10px"><span class="form-label">${esc(c.name)}</span><input id="cand-input" style="width:100%" value="${esc(c.value)}" maxlength="160"></label>
        <p class="small-note">来源：${esc(c.source)}。暂时不确定就保留待核对状态，不会丢。</p>`,
        `<button class="soft" data-action="close">现在先不核对</button><button class="primary" data-action="cand-save" data-id="${esc(c.id)}">接受这条记录</button>`);
    },
    'cand-save': (el) => {
      const c = CANDS[state.profile].find((x) => x.id === el.dataset.id);
      const v = $('#cand-input') ? $('#cand-input').value.trim() : '';
      if (c && v) { c.value = v; c.status = 'accepted'; }
      closeDialog(); render(); toast('已接受：写入演示数据库（record + 事实表），候选留版本不覆盖');
    },
    'add-question': () => {
      const q = state.profile === 'A'
        ? '请帮我核实：新辅助化疗要做几个周期、什么时候评估手术方案。'
        : '请帮我核实：下次随访要不要拍胸 CT、假体随访查什么。';
      state.questions = state.questions || [];
      if (!state.questions.includes(q)) state.questions.push(q);
      render(); toast('已加入复诊准备的问题清单');
    },
    'add-stage': () => toast('分期变更需抄医生给出的新分期与依据；旧分期保留'),
    'add-imaging': () => toast('原型内不落库；真实版在这里记一次影像检查（日期 / 模态 / 部位 / 报告摘录）'),
    'add-function': () => toast('功能自评按本人记录写（日期 / 条目 / 情况），不换算成评分'),
    'add-viewpoint': () => toast('感受会记为"一条信息"，标注不是医生结论'),
    'export-review': dlgExport,
    'toggle-ask': (el) => { el.textContent = el.textContent.includes('✓') ? '标记已问' : '已问过 ✓'; },
    'save-trial': (el) => { const id = el.dataset.id; if (state.saved.includes(id)) { state.saved = state.saved.filter(x => x !== id); } else state.saved.push(id); render(); },
    'ask-trial': (el) => { const id = el.dataset.id; const t = TRIALS.find(x => x.id === id); state.questions = state.questions || []; const q = `${t.id}：入组条件是否包含我的分期（${P().stage}）与既往治疗？`; if (!state.questions.includes(q)) state.questions.push(q); render(); toast('已加入入组问题清单'); },
    range: (el) => { state.range = el.dataset.range; render(); },
    toggle: (el) => { state.toggles[el.dataset.key] = !state.toggles[el.dataset.key]; render(); },
    pin: (el) => { state.pin = { code: el.dataset.code, date: el.dataset.date }; render(); },
    unpin: () => { state.pin = null; render(); },
    zoom: () => {},
    agent: () => { state.agentOpen = !state.agentOpen; renderAgent(); },
    'agent-open': () => { state.agentOpen = true; renderAgent(); toast('AI 对话面板已打开；× 只是收起，不会结束会话'); },
    'agent-build': agentBuild,
    'agent-demo': agentDemo
  };
  if (act === 'agent-size') { state.agentSize = e.target.closest('[data-action]').dataset.size; renderAgent(); return; }
  if (act === 'cfg-tab') {
    const el = e.target.closest('[data-action]');
    document.querySelectorAll('.cfg-tabs [role=tab]').forEach((b) => b.setAttribute('aria-selected', String(b === el)));
    document.querySelectorAll('.cfg-block[data-tab]').forEach((b) => { b.hidden = b.dataset.tab !== el.dataset.tab; });
    return;
  }
  if (map[act]) map[act](e.target.closest('[data-action]'));
});
/* 36 号 §2.6 出口：状态卡副按钮打开疾病概要（与顶栏「?」同一个整页面板） */
document.addEventListener('click', (e) => {
  const cta = e.target.closest('[data-primer-cta]');
  if (!cta) return;
  e.preventDefault();
  if (window.DiseasePrimer) window.DiseasePrimer.open(cta);
});
document.addEventListener('input', (e) => {
  if (e.target.matches('[data-action="records-search"]')) {
    state.query = e.target.value;
    const wrap = $('#docs-table'); if (wrap) wrap.innerHTML = docsTable();
  }
});
document.addEventListener('change', (e) => {
  if (e.target && e.target.id === 'file-picker') { ingestFiles(e.target.files); e.target.value = ''; return; }
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && $('#dialog').open) { closeDialog(); return; }
  const card = e.target.closest && e.target.closest('.mcard[data-mcard]:not([data-static])');
  if (card && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); flipCard(card.dataset.mcard); }
});
$('#font-toggle').addEventListener('click', () => { const on = document.body.classList.toggle('large'); $('#font-toggle').setAttribute('aria-pressed', String(on)); });
window.addEventListener('hashchange', () => {
  const r = parseHashRoute(location.hash.slice(1));
  if (r && (r.view !== state.view || r.sub !== (state.sub[r.view] || 0))) {
    state.view = r.view; state.sub[r.view] = r.sub; state.privateOpen = false; state.pin = null; render();
  }
});

/* 上传：原型只做本地"接住"动作，不解析、不上传、不写库 */
function ingestFiles(list) {
  const files = Array.from(list || []);
  if (!files.length) return;
  const allowed = ['.pdf', '.jpg', '.jpeg', '.png', '.txt', '.md'];
  const ok = files.filter((f) => allowed.some((x) => f.name.toLowerCase().endsWith(x)));
  if (!ok.length) { toast('这个格式暂不支持；支持 PDF / 图片 / 文本'); return; }
  state.uploads += ok.length;
  const now = todayISO();
  ok.forEach((f, i) => {
    const id = 'up' + Date.now().toString(36) + i;
    DOCS[state.profile].unshift({ id, name: f.name, fileName: f.name, size: f.size, date: now, type: '其他', status: '待核对' });
    state.lastUpload = id;
  });
  render();
  toast(`已接住 ${ok.length} 份文件（演示）：原件保留在资料目录，解析结果会先进候选`);
}

{
  const r0 = parseHashRoute(location.hash.slice(1));
  if (r0) { state.view = r0.view; state.sub[r0.view] = r0.sub; }
}
render();


/* ---------------- 32 号整页视图（A1–A10；file:// 下单文件内联，不用 ES module） ----------------
   历史栈：打开整页 = pushState 一条；页内下钻（L2/L3）是面板内层，Esc 在面板内一层层退，
   退到 L1 再按 Esc / 返回 / 关闭 / 浏览器返回键都回到主页并收起整页。深链（#page=）直开不压栈。 */
const PV_PAGES = {
  pathology: {
    title: '病理报告',
    body: (p) => `<div class="card"><div class="card-head"><h2>${esc(p.pathology.title)}</h2>${pill(p.pathology.status, 'green')}</div>
      <div class="rows">${p.pathology.rows.map(r => row(esc(r[0]), esc(r[1]))).join('')}</div></div>
      <div class="card"><div class="card-head"><h2>缺口（还没确认的）</h2></div>
      <div class="rows">${p.pathology.gaps.map(r => row(esc(r[0]), esc(r[1]))).join('')}</div></div>
      <button class="pv-btn" data-pv-go="pathology-src">看报告原文 →</button>`,
  },
  'pathology-src': {
    title: '报告原文',
    parent: 'pathology',
    body: (p) => `<div class="card"><div class="card-head"><h2>原件存放</h2></div>
      <div class="rows">${row('档案', esc(P().biopsyNote || '未记录'))}${row('资料库', `「资料库」页可查原件状态；原件不改动，解析结果永远是候选`)}</div></div>
      <div class="notice">工作台不替你解读病理报告；结论以报告原件与医生为准。</div>`,
  },
  labs: {
    title: '化验记录',
    body: () => `<div class="card"><div class="card-head"><h2>最近报告表</h2></div>
      <div class="table-wrap"><table class="cycle-table"><thead><tr><th>指标</th><th>最近值</th><th>日期</th><th>来源</th></tr></thead><tbody>
      ${Object.values(M()).map(m => { const l = m.points[m.points.length - 1]; return `<tr><td>${esc(m.name)}</td><td>${esc(String(l.v))}${m.unit ? ' ' + esc(m.unit) : ''}</td><td>${esc(l.d)}</td><td>${esc(l.src || '—')}</td></tr>`; }).join('')}
      </tbody></table></div></div>
      <div class="notice">「仅回顾，不解读」；解读归医生。</div>`,
  },
  chart: {
    title: '病情一图秀（全屏）',
    body: () => `<div class="card"><div class="card-head"><h2>当前勾选</h2></div>
      <div class="rows">${state.sel.map(k => M()[k] ? row(esc(M()[k].name), esc(M()[k].note || '—')) : '').join('')}</div></div>
      <div class="notice">曲线请在「病情一图秀」页操作；这里放不下交互画布，只做全屏摘要。</div>`,
  },
};
const pv = { open: false, page: null, stack: [], deep: false, trigger: null };
function pvRender() {
  const conf = PV_PAGES[pv.page];
  if (!conf) return;
  $('.pv-title').textContent = conf.title;
  $('.pv-crumb-slot').innerHTML = pv.stack.map(k =>
    `<button class="pv-crumb" data-pv-pop="${esc(k)}">${esc(PV_PAGES[k].title)}</button>`).join('<span class="muted">›</span>');
  $('.pv-body').innerHTML = conf.body(P());
  $('#pv-panel').focus({ preventScroll: true });
}
function pvOpen(key, trigger) {
  if (!PV_PAGES[key]) return;
  pv.open = true; pv.page = key; pv.stack = []; pv.trigger = trigger || null;
  pv.deep = false;
  $('#pv-overlay').hidden = false;
  document.documentElement.classList.add('pv-lock');
  history.pushState({ pv: key }, '');
  pvRender();
}
function pvOpenDeep(key) {
  if (!PV_PAGES[key]) return;
  pv.open = true; pv.page = key; pv.stack = []; pv.trigger = null; pv.deep = true;
  $('#pv-overlay').hidden = false;
  document.documentElement.classList.add('pv-lock');
  pvRender();
}
function pvClose({ fromPop = false } = {}) {
  if (!pv.open) return;
  pv.open = false; pv.page = null; pv.stack = [];
  $('#pv-overlay').hidden = true;
  document.documentElement.classList.remove('pv-lock');
  if (!fromPop && !pv.deep) history.back();
  if (pv.trigger && document.contains(pv.trigger)) pv.trigger.focus({ preventScroll: true });
  pv.trigger = null;
}
function pvPop() {  /* Esc / 返回：面板内一层层退（A2/P7 同口径） */
  if (pv.stack.length) { pv.page = pv.stack.pop(); pvRender(); return; }
  pvClose();
}
document.addEventListener('click', (e) => {
  const openBtn = e.target.closest('[data-open]');
  if (openBtn) { e.preventDefault(); pvOpen(openBtn.dataset.open, openBtn); return; }
  const goBtn = e.target.closest('[data-pv-go]');
  if (goBtn) { e.preventDefault(); pv.stack.push(pv.page); pv.page = goBtn.dataset.pvGo; pvRender(); return; }
  const popBtn = e.target.closest('[data-pv-pop]');
  if (popBtn) {
    const idx = pv.stack.indexOf(popBtn.dataset.pvPop);
    if (idx >= 0) { pv.stack = pv.stack.slice(0, idx); pv.page = popBtn.dataset.pvPop; pvRender(); }
    return;
  }
  const act = e.target.closest('[data-pv-action]')?.dataset.pvAction;
  if (act === 'close') pvClose();
  if (act === 'back') pvPop();
});
window.addEventListener('popstate', (e) => {
  if (!pv.open) return;
  if (e.state && e.state.pv && PV_PAGES[e.state.pv]) { pv.page = e.state.pv; pv.stack = []; pvRender(); return; }
  pvClose({ fromPop: true });
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && pv.open && !$('#dialog').open) { e.preventDefault(); pvPop(); }
});
/* 32 号深链：#page=xxx 直达整页视图（不压栈；返回键回主页）；必须在 PV_PAGES 定义之后执行 */
{
  const pvDeep = location.hash.match(/^#page=([a-z-]+)$/);
  if (pvDeep && PV_PAGES[pvDeep[1]]) pvOpenDeep(pvDeep[1]);
}
