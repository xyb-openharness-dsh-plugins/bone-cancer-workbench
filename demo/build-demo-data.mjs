/* 小骨宝 OsteoPal · 演示数据生成器（唯一数据源）
   产出：demo/demo-data.sqlite（可 SQL 查询）+ prototypes/v0.2/demo-data.js（原型只读数据层）
   原则：全部患者数据为虚构模拟；trials 表为真实登记摘录（ClinicalTrials.gov API v2，
         2026-11-10 实测，状态未核实，以登记页为准）。
   运行：node demo/build-demo-data.mjs  —— 改数据只改这里，两个产物一起重生成。

   两种用法：
   1. 直接跑（CLI）：写上面两个产物；
   2. 被 import：只拿到 `buildDemoProfiles()` 返回的纯数据，一个字节都不碰磁盘
      —— 开发版的 `dsh/demo.js` 靠它把演示档案写进本机 sqlite。

   继承家族踩过的坑（改前必读）：
   - **分节标题进 section_titles 表**，不在 subjects 上排 *_title 列；
   - **INSERT 一律写显式列名**，禁止 `INSERT INTO t VALUES (?,?,…)`；
   - **分类指标不写 unit**（必须缺键，不是 unit:'' 也不是 unit:null 后再补）；
   - **events / docs / candidates 是定长数组**：events=[日期,名称]、
     docs=[id,名称,日期,类型,状态]、candidates=[id,名称,值,来源,状态]；
   - **两套档案覆盖面不对称是故意的**：A（刚确诊）没有手术/周期/假体记录，
     不要为了"对称"给 A 补上；B（长期随访）没有的项也不补。
*/
import { DatabaseSync } from 'node:sqlite';
import { writeFileSync, realpathSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const P2 = join(ROOT, 'prototypes/v0.2');

/* ---------- 基础 ---------- */

const pts = (arr) => arr.map(([d, v, src]) => ({ d, v, src }));

const CAT_COLOR = {
  '骨与肿瘤相关': '#8f5a26', '血象': '#a03d5c', '生化': '#8a6b1f', '电解质': '#2f6f66',
  '营养': '#6a55b8', '自评与功能': '#c25746',
};
const cat = (c) => ({ cat: c, color: CAT_COLOR[c] });

/* 同屏最多 3–4 条线，必须靠色相区分：骨相关偏赭、血象偏玫、生化偏金、电解质偏青、
   营养偏紫、自评与功能偏砖红/紫红。 */
const KEY_COLOR = {
  alp: '#8f5a26', ldh: '#a8701f', pain: '#c25746',
  hgb: '#a03d5c', wbc: '#c2687f', anc: '#8f2d4a', lym: '#d495a6', plt: '#b3556e',
  alt: '#8a6b1f', ast: '#a8862f', cr: '#6d5320',
  ca: '#2f6f66', k: '#4d9187', na: '#5fa39a',
  wt: '#6a55b8', alb: '#9382d4', walk: '#6a55b8', fatigue: '#9382d4',
};

/* ---------- 档案 A：刚确诊（穿刺病理刚回，新辅助化疗第 1 周期刚开始；记录少、多处未知） ---------- */

const DA = ['2026-10-22', '2026-11-03', '2026-11-05'];
const LA = ['确诊时', '化疗第 1 周期前', '化疗第 1 周期中'];
const zipA = (vals) => pts(DA.slice(0, vals.length).map((d, i) => [d, vals[i], LA[i]]));

const metricsA = () => [
  { key: 'alp', name: '碱性磷酸酶 ALP', unit: 'U/L', dec: 0, band: [30, 120], note: '骨与肝来源都有；单次升降不等于病情变化', ...cat('骨与肿瘤相关'),
    points: zipA([186, 178]) },
  { key: 'hgb', name: '血红蛋白', unit: 'g/L', dec: 0, band: [130, 175], note: '男性参考区间；不同医院方法不同，不合并', ...cat('血象'),
    points: zipA([138, 131]) },
  { key: 'wbc', name: '白细胞', unit: '10⁹/L', dec: 1, band: [3.5, 9.5], note: '化疗第 1 周期中，按医生安排复查', ...cat('血象'),
    points: zipA([5.6]) },
  { key: 'pain', name: '疼痛自评', unit: '分', dec: 0, band: [0, 10], note: '本人自评 0–10；不是医生评估', ...cat('自评与功能'),
    points: zipA([6, 4, 3]) },
  { key: 'walk', name: '行走情况', dec: null, note: '本人自述；分类记录只按原文记，不连折线', ...cat('自评与功能'),
    points: zipA(['明显受限', '需辅助器具']) },
  { key: 'fatigue', name: '疲劳自评', dec: null, note: '本人自述；分类记录不连线', ...cat('自评与功能'),
    points: zipA(['无', '轻度']) },
  { key: 'ca', name: '血钙', unit: 'mmol/L', dec: 2, band: [2.11, 2.52], note: '单次结果不判断', ...cat('电解质'),
    points: zipA([2.28]) },
  { key: 'wt', name: '体重', unit: 'kg', dec: 1, band: null, note: '只记数值与日期', ...cat('营养'),
    points: zipA([72.4, 71.6]) },
  { key: 'ldh', name: '乳酸脱氢酶 LDH', unit: 'U/L', dec: 0, band: [120, 250], note: '评估时查；单点不连线', ...cat('骨与肿瘤相关'),
    points: zipA([268]) },
];

/* ---------- 档案 B：长期随访（确诊 2 年：新辅助 3 周期 → 保肢手术 → 辅助 3 周期 → 随访中；记录多） ---------- */

const DB = ['2024-09-10', '2024-09-24', '2024-10-15', '2024-11-05', '2024-12-28', '2025-01-16',
  '2025-02-06', '2025-02-27', '2025-03-20', '2025-04-10', '2025-05-06', '2025-06-03',
  '2025-07-10', '2025-09-15', '2025-12-10', '2026-03-11', '2026-07-08', '2026-11-02'];
const LB = ['确诊时', '新辅助 C1', '新辅助 C2', '新辅助 C3', '化疗中评估', '手术日',
  '辅助 C4', '辅助 C5', '辅助 C6', '辅助 C6 后', '辅助 C6 后', '辅助 C6 后',
  '术后半年', '随访', '随访', '随访', '随访', '最近一次复查'];
const zipB = (vals) => pts(DB.slice(0, vals.length).map((d, i) => [d, vals[i], LB[i]]));

const metricsB = () => [
  { key: 'alp', name: '碱性磷酸酶 ALP', unit: 'U/L', dec: 0, band: [30, 120], note: '骨与肝来源都有；单次升降不等于病情变化', ...cat('骨与肿瘤相关'),
    points: zipB([312, 298, 245, 196, 172, 158, 149, 141, 132, 128, 121, 116, 112, 108, 104, 102, 99, 97]) },
  { key: 'ldh', name: '乳酸脱氢酶 LDH', unit: 'U/L', dec: 0, band: [120, 250], note: '评估时查；不同方法不合并', ...cat('骨与肿瘤相关'),
    points: zipB([286, 252, 218, 190, 176, 165, 158, 149, 145, 138, 132, 128]) },
  { key: 'hgb', name: '血红蛋白', unit: 'g/L', dec: 0, band: [130, 175], note: '男性参考区间；不同医院方法不同，不合并', ...cat('血象'),
    points: zipB([146, 132, 118, 104, 112, 121, 98, 102, 106, 112, 118, 124, 130, 134, 136, 138, 139, 140]) },
  { key: 'wbc', name: '白细胞', unit: '10⁹/L', dec: 1, band: [3.5, 9.5], note: '化疗期间最低点按医生安排处理', ...cat('血象'),
    points: zipB([6.8, 5.2, 3.8, 2.4, 3.6, 5.1, 2.1, 2.8, 3.4, 4.6, 5.2, 5.8, 6.2, 6.0, 6.4, 6.2, 6.6, 6.3]) },
  { key: 'anc', name: '中性粒细胞', unit: '10⁹/L', dec: 2, band: [1.8, 6.3], note: '偏低时治疗可能推迟；阈值以医生为准【待核】', ...cat('血象'),
    points: zipB([4.1, 3.0, 2.0, 1.1, 1.8, 3.0, 0.9, 1.3, 1.9, 2.6, 3.1, 3.5, 3.8, 3.6, 3.9, 3.7, 4.0, 3.8]) },
  { key: 'plt', name: '血小板', unit: '10⁹/L', dec: 0, band: [125, 350], note: '—', ...cat('血象'),
    points: zipB([248, 226, 198, 166, 182, 208, 142, 158, 176, 196, 212, 224, 232, 236, 240, 238, 242, 244]) },
  { key: 'alt', name: 'ALT', unit: 'U/L', dec: 0, band: [9, 50], note: '—', ...cat('生化'),
    points: zipB([24, 31, 42, 55, 46, 33, 38, 44, 36, 29, 26, 25, 24, 23, 24, 25, 24, 23]) },
  { key: 'ast', name: 'AST', unit: 'U/L', dec: 0, band: [15, 40], note: '—', ...cat('生化'),
    points: zipB([22, 28, 37, 48, 41, 30, 34, 39, 32, 27, 25, 24, 23, 22, 23, 24, 22, 22]) },
  { key: 'cr', name: '肌酐', unit: 'μmol/L', dec: 0, band: [57, 111], note: '含铂方案（顺铂）期间关注；大剂量甲氨蝶呤水化期间按医嘱查', ...cat('生化'),
    points: zipB([78, 82, 88, 95, 86, 80, 92, 88, 83, 79, 77, 76, 77, 78, 77, 78, 79, 78]) },
  { key: 'ca', name: '血钙', unit: 'mmol/L', dec: 2, band: [2.11, 2.52], note: '骨溶解相关；单次结果不判断', ...cat('电解质'),
    points: zipB([2.18, 2.24, 2.31, 2.28, 2.26, 2.32]) },
  { key: 'wt', name: '体重', unit: 'kg', dec: 1, band: null, note: '只记数值与日期', ...cat('营养'),
    points: zipB([81.2, 79.8, 77.6, 75.1, 74.2, 72.8, 70.5, 69.8, 69.2, 69.6, 70.2, 71.1, 72.0, 72.4, 72.8, 73.0, 73.2, 73.1]) },
  { key: 'alb', name: '白蛋白', unit: 'g/L', dec: 0, band: [40, 55], note: '化疗期间进食差时下降常见', ...cat('营养'),
    points: zipB([44, 41, 37, 34, 36, 39, 33, 35, 37, 40, 41, 42, 43, 44, 44, 45, 45, 45]) },
  { key: 'pain', name: '疼痛自评', unit: '分', dec: 0, band: [0, 10], note: '本人自评 0–10；不是医生评估', ...cat('自评与功能'),
    points: zipB([7, 5, 4, 3, 3, 2, 6, 5, 4, 3, 2, 2, 1, 1, 1, 1, 1, 1]) },
  { key: 'walk', name: '行走情况', dec: null, note: '本人自述；分类记录只按原文记，不连折线', ...cat('自评与功能'),
    points: zipB(['明显受限', '需辅助器具', '需辅助器具', '轻度受限', '轻度受限', '轻度受限', '如常', '如常', '如常']) },
  { key: 'fatigue', name: '疲劳自评', dec: null, note: '本人自述；分类记录不连线', ...cat('自评与功能'),
    points: zipB(['重度', '中度', '中度', '轻度', '轻度', '无', '中度', '轻度', '轻度', '无', '无', '无', '无', '无', '无', '无', '无', '无']) },
];

/* ---------- 档案 ---------- */

const PROFILE_A = {
  name: '林远', sex: '男', age: 19, meta: '骨肉瘤（左股骨远端，普通型）· 大学生',
  headline: '左股骨远端骨肉瘤（穿刺确诊 2026-10-22），新辅助化疗第 1 周期进行中；分期与手术方案待医生给出',
  stage: '待医生给出', mindset: '最担心这条腿以后还能不能跑步，想把每次复查的问题提前写下来',
  histology: '骨肉瘤（普通型，成骨型为主）',
  biopsyNote: '穿刺活检 2026-10-22（左股骨远端）',
  events: [
    ['2026-10-22', '确诊（穿刺活检）'],
    ['2026-11-02', '分期评估（MRI+骨扫描+胸CT）'],
    ['2026-11-05', '新辅助化疗第 1 周期开始'],
  ],
  dash_keys: ['alp', 'pain', 'hgb'],
  path: ['骨肉瘤', '分期待医生给出', '新辅助化疗（第 1 周期）'],
  activity: '腿不方便，最近改成上肢拉力器和坐姿锻炼',
  familyTalk: '和妈妈说好：复查结果一起看；跑步的事等医生说完再想',
  molecular: [
    { k: '肿瘤类型', v: '骨肉瘤（普通型，成骨型为主）', src: '穿刺病理 2026-10-22', state: 'ok', note: '—' },
    { k: 'MDM2 扩增', v: '未检测', src: '—', state: 'na', note: '是否需要送检问医生' },
    { k: 'H3F3A（骨巨细胞瘤鉴别）', v: '未检测', src: '—', state: 'na', note: '影像与病理已鉴别，医生未开' },
  ],
  lines: [
    { name: '一线 · 新辅助化疗', detail: '大剂量甲氨蝶呤 + 多柔比星 + 顺铂（MAP，医嘱原文摘录；周期数按医生安排）', done: false },
  ],
  cycles: [],
  rhythm: [
    ['化疗评估', '每 2 个周期', '医生安排', '2026-11-19 前后'],
  ],
  pathway: null,
  staging: {
    title: '分期记录（医生给出，只抄不判）',
    rows: [
      ['Enneking 外科分期', '待医生给出（穿刺后未正式分期）', '2026-11-02 门诊问'],
      ['AJCC 第 9 版', '待医生给出', '—'],
      ['部位', '左股骨远端（MRI 2026-10-25）', '报告原文摘录'],
      ['肺转移评估', '胸部 CT 未见明确转移灶（报告原文摘录 2026-10-26）', '—'],
    ],
  },
  pathology: {
    title: '穿刺病理（2026-10-22）', status: '已出',
    rows: [
      ['病理类型', '骨肉瘤（普通型，成骨型为主）'],
      ['活检部位', '左股骨远端'],
      ['取样方式', '穿刺活检（通道由骨肿瘤组设计，为最终手术做准备——医生原话）'],
    ],
    gaps: [
      ['分子检测', '尚未送检（是否需要问医生）'],
      ['化疗反应病理评估', '尚未手术，不适用'],
    ],
  },
  surgery: null,
  imaging: {
    title: '影像检查记录',
    rows: [
      ['2026-10-25', 'MRI 左股骨（平扫+增强）', '左股骨远端骨质破坏伴软组织肿块，约 7.5×6.0 cm（报告原文摘录）', '—', '原件未取得（手机翻拍）'],
      ['2026-10-26', '胸部 CT（基线）', '双肺未见明确转移灶（报告原文摘录）', '按医嘱复查', '—'],
      ['2026-10-27', '全身骨扫描（ECT）', '左股骨远端放射性浓聚；其余骨骼未见明显异常（报告原文摘录）', '—', '—'],
    ],
  },
  functSelf: null,
  prosthesis: null,
  helpPlan: {
    title: '什么时候联系门诊（医生给的行动计划原话，演示值）',
    rows: [
      ['发热超过 38℃', '化疗期间白细胞低时容易感染；按医生给的电话联系病房'],
      ['突发胸闷气促', '立即就诊（医生原话）'],
    ],
  },
  viewpoints: [
    ['2026-11-06', '夜里', '担心化疗掉头发，更担心这条腿以后还能不能跑步'],
    ['2026-11-08', '和妈妈聊了', '她说先治好再想别的；跑步的事我记下来了，等医生说完再说'],
  ],
  docs: [
    ['doc-a1', '穿刺病理报告', '2026-10-22', '病理报告', '已入库'],
    ['doc-a2', '左股骨 MRI 报告（照片翻拍，无原件）', '2026-10-25', '影像报告', '待核对'],
    ['doc-a3', '胸部 CT 报告', '2026-10-26', '影像报告', '已核对'],
    ['doc-a4', '化疗知情同意书', '日期不详', '治疗记录', '已入库'],
  ],
  candidates: [
    ['cand-a1', '下次化疗日期', '2026-11-12（待护士站确认）', '化疗知情同意书 · 第 2 页', 'candidate'],
    ['cand-a2', 'ALP 本次结果', '178 U/L', '化验单 2026-11-03 · 第 1 页', 'candidate'],
  ],
};

const PROFILE_B = {
  name: '韩志强', sex: '男', age: 38, meta: '骨肉瘤（右肱骨近端，普通型）· 术后 2 年随访中',
  headline: '右肱骨近端骨肉瘤：新辅助化疗 3 周期 → 保肢手术（肿瘤型人工关节）→ 辅助化疗 3 周期，2025-09 起每 3 个月随访',
  stage: 'Enneking ⅡB（医生给出）', mindset: '每次复查前最紧张胸 CT，想把「查什么、什么时候查」提前理清楚',
  histology: '骨肉瘤（普通型）',
  biopsyNote: '穿刺活检 2024-09-10；手术切除标本 2025-01-20',
  events: [
    ['2024-09-10', '确诊（穿刺活检）'],
    ['2024-09-20', '分期评估'],
    ['2024-09-24', '新辅助化疗开始'],
    ['2025-01-16', '手术（保肢+肿瘤型人工关节）'],
    ['2025-02-06', '辅助化疗开始'],
    ['2025-06-20', '化疗结束'],
    ['2026-11-02', '最近一次随访复查'],
  ],
  dash_keys: ['alp', 'ldh', 'wt'],
  path: ['骨肉瘤', 'Enneking ⅡB', '辅助化疗已结束', '随访期'],
  activity: '右肩活动度恢复了大约八成；每周游泳两次（医生说可以）',
  familyTalk: '和爱人说好：随访结果两人一起看；孩子只说「爸爸的胳膊治好了」',
  molecular: [
    { k: '肿瘤类型', v: '骨肉瘤（普通型）', src: '手术切除标本病理 2025-01-20', state: 'ok', note: '—' },
    { k: '化疗反应（坏死率）', v: '92%（医生记录原文）', src: '手术切除标本病理 2025-01-20', state: 'ok', note: '由医生评估，本台只抄原文' },
    { k: 'MDM2 扩增', v: '未检测', src: '—', state: 'na', note: '普通型骨肉瘤不常规送检（医生原话）' },
    { k: 'TP53', v: '未检测', src: '—', state: 'na', note: '—' },
  ],
  lines: [
    { name: '一线 · 新辅助化疗（MAP 3 周期）', detail: '大剂量甲氨蝶呤 + 多柔比星 + 顺铂（2024-09-24 → 2024-11-05，医嘱原文摘录）', done: true },
    { name: '手术治疗 · 保肢（广泛切除+肿瘤型人工关节）', detail: '右肱骨近端（2025-01-16）；切缘阴性（病理）', done: true },
    { name: '一线 · 辅助化疗（MAP 3 周期）', detail: '2025-02-06 → 2025-06-03（医嘱原文摘录）', done: true },
    { name: '随访期', detail: '每 3 个月：局部影像 + 胸部 CT + 化验（医生安排）', done: false },
  ],
  cycles: [
    ['MAP-C1', '2024-09-24', '甲氨蝶呤+多柔比星+顺铂（医嘱原文摘录）', '已完成', true],
    ['MAP-C2', '2024-10-15', '同上；白细胞最低', '已完成', true],
    ['MAP-C3', '2024-11-05', '同上；新辅助化疗结束', '已完成', true],
    ['MAP-C4', '2025-02-06', '辅助化疗第 1 周期（术后）', '已完成', true],
    ['MAP-C5', '2025-02-27', '同上', '已完成', true],
    ['MAP-C6', '2025-03-20', '同上', '已完成', true],
    ['MAP-C6+1', '2025-04-10', '术后辅助收尾（医嘱原文摘录）', '已完成', true],
    ['MAP-C6+2', '2025-05-06', '同上', '已完成', true],
    ['MAP-C6+3', '2025-06-03', '辅助化疗结束', '已完成', true],
  ],
  rhythm: [
    ['局部 X 线 / CT', '每 3 个月（术后 1–2 年）', '医生安排（中文指南口径：1–2 年每 3 个月）', '2026-12-10 前后'],
    ['胸部 CT', '每 3 个月（前 2 年）', '监测肺转移（医生安排；胸 CT 为首选口径）', '2026-12-10 前后'],
    ['ALP / LDH 等化验', '每次复查', '医生安排', '2026-12-10 前后'],
    ['肢体功能评估', '每 3 个月', '医生安排（MSTS 由医生评）', '2027-01 前后'],
  ],
  pathway: {
    title: '治疗路径（当前 / 既往）',
    rows: [
      ['既往', '新辅助化疗（MAP 3 周期）', '2024-09-24 → 2024-11-05', '为保肢手术创造条件', '医生原话：化疗反应好，肿块缩小'],
      ['既往', '保肢手术：广泛切除 + 肿瘤型人工关节（右肱骨近端）', '2025-01-16', '切缘阴性（病理）', '—'],
      ['既往', '辅助化疗（MAP 3 周期）', '2025-02-06 → 2025-06-03', '术后继续', '—'],
      ['当前', '定期随访', '2025-09 起', '每 3 个月', '—'],
    ],
  },
  staging: {
    title: '外科分期（医生给出，只抄不判）',
    rows: [
      ['Enneking 外科分期', 'ⅡB 期（医生给出，2024-09-20）', 'G2 / T2 / M0'],
      ['AJCC 第 9 版', 'Ⅱ 期（医生给出）', '骨肿瘤章节滚动更新中，以医生记录为准'],
      ['部位', '右肱骨近端', 'MRI 2024-09-18'],
      ['肺转移评估', '基线及历次胸 CT 均未见转移（报告原文摘录）', '—'],
    ],
  },
  pathology: {
    title: '手术切除标本病理（2025-01-20）', status: '已出',
    rows: [
      ['病理类型', '骨肉瘤（普通型）'],
      ['肿瘤大小', '8.2 cm（病理原文）'],
      ['切缘', '阴性'],
      ['化疗反应（坏死率）', '92%（医生记录原文）'],
    ],
    gaps: [
      ['分子检测', 'MDM2 / TP53 未常规送检（医生原话：普通型骨肉瘤不常规做）'],
    ],
  },
  surgery: {
    title: '手术记录（2025-01-16）',
    rows: [
      ['2025-01-16', '右肱骨近端骨肉瘤广泛切除术（保肢）', '前外侧入路', '肿瘤型人工关节（反置式）重建', '切缘阴性', '省肿瘤医院', '手术时长 4.2 h（记录原文）；腋神经保留'],
    ],
  },
  imaging: {
    title: '影像检查记录',
    rows: [
      ['2024-09-12', 'X 线 右肱骨', '右肱骨近端溶骨性破坏，可见骨膜反应（报告原文摘录）', '—', '—'],
      ['2024-09-18', 'MRI 右肱骨（平扫+增强）', '髓腔内肿瘤，软组织肿块约 6.8×5.5 cm；腋神经血管未受累（报告原文摘录）', '—', '—'],
      ['2024-09-20', '全身骨扫描（ECT）', '右肱骨近端放射性浓聚；其余骨骼未见明显异常（报告原文摘录）', '—', '—'],
      ['2024-09-21', '胸部 CT（基线）', '双肺未见明确转移灶（报告原文摘录）', '按医嘱定期复查', '—'],
      ['2024-12-28', '胸 CT + 右肱骨 X 线（化疗中评估）', '原发灶缩小；双肺未见转移（报告原文摘录；化疗反应由医生评估）', '2025-06 起每 3 个月', '—'],
      ['2025-07-10', 'X 线 右肩（术后）', '假体位置良好，未见松动（报告原文摘录）', '2026-01 复查', '—'],
      ['2026-01-09', '胸 CT + X 线', '双肺未见转移；假体位置良好（报告原文摘录）', '2026-07 复查', '—'],
      ['2026-07-08', '胸 CT + X 线', '双肺未见转移；假体位置良好（报告原文摘录）', '2026-12 前后（医生安排）', '—'],
    ],
  },
  functSelf: {
    title: '功能自评（本人记录，不是医生评估）',
    rows: [
      ['2025-03-10', '抬臂', '能抬到与肩平，梳头还有点难'],
      ['2025-05-02', '梳头', '可以自己梳头了'],
      ['2025-08-15', '提重物', '超过 3 kg 会酸'],
      ['2026-01-20', '日常活动', '穿衣做饭都正常；游泳开始上手'],
      ['2026-07-10', '力量', '和左边比大约八成'],
    ],
  },
  prosthesis: {
    title: '假体与重建随访',
    rows: [
      ['2025-01-16', '肿瘤型人工关节（右肩，反置式）', '初次置入（手术记录原文摘录）', '省肿瘤医院'],
      ['2025-07-10', 'X 线复查', '假体位置良好，无松动（报告原文摘录）', '—'],
      ['2026-07-08', 'X 线复查', '假体位置良好，无松动、无磨损迹象（报告原文摘录）', '—'],
    ],
  },
  helpPlan: {
    title: '什么时候联系门诊（医生给的行动计划原话，演示值）',
    rows: [
      ['发热超过 38℃', '化疗期间按医生给的电话联系病房'],
      ['术区突然红肿热痛', '联系手术组门诊'],
      ['突发胸闷气促', '立即就诊或拨打 120（医生原话）'],
    ],
  },
  viewpoints: [
    ['2025-01-20', '术后', '第一次看自己的伤口，有点不敢认；护士帮了我'],
    ['2025-07-12', '复查前', '胸 CT 前一晚睡不好，结果没事；下次想提前把问题写下来'],
    ['2026-07-09', '复查后', '两年了，学会把「问什么」提前列出来，门诊不慌了'],
  ],
  docs: [
    ['doc-b1', '穿刺病理报告', '2024-09-10', '病理报告', '已入库'],
    ['doc-b2', '手术记录', '2025-01-16', '手术记录', '已入库'],
    ['doc-b3', '手术切除标本病理', '2025-01-20', '病理报告', '已核对'],
    ['doc-b4', '出院记录', '2025-01-24', '出院记录', '已入库'],
    ['doc-b5', '化疗记录（新辅助 3 周期）', '2024-11-08', '治疗记录', '已核对'],
    ['doc-b6', '化疗记录（辅助 3 周期）', '2025-06-05', '治疗记录', '已核对'],
    ['doc-b7', '胸 CT 报告（最近一次）', '2026-07-08', '影像报告', '已核对'],
    ['doc-b8', 'X 线报告（假体随访）', '2026-07-08', '影像报告', '已核对'],
    ['doc-b9', '化验单（2026-11-02）', '2026-11-02', '化验单', '待核对'],
  ],
  candidates: [
    ['cand-b1', '下次随访日期', '2026-12-10 前后（待预约确认）', '门诊预约单 · 第 1 页', 'candidate'],
    ['cand-b2', 'ALP 本次结果', '97 U/L', '化验单 2026-11-02 · 第 1 页', 'candidate'],
  ],
};

/* ---------- 临床试验：真实登记摘录（CT.gov API v2，2026-11-10 实测；状态未核实，以登记页为准） ---------- */

const TRIAL_ROWS = [
  ['NCT07479732', 'Apatinib Combined With Liposomal Irinotecan for Refractory or Metastatic Osteosarcoma（阿帕替尼联合脂质体伊立替康治疗难治/转移性骨肉瘤）', 'Ⅰ/Ⅱ期', '招募中', "Peking University People's Hospital（北京大学人民医院）", '骨肉瘤靶向', '2026-11-10'],
  ['NCT07878364', 'Treatment Patterns and Survival Outcomes in High-Grade Osteosarcoma: A Multicenter Retrospective Study（高级别骨肉瘤治疗模式与生存结局多中心回顾）', '观察性', '招募中', 'MedPacto, Inc.', '骨肉瘤真实世界', '2026-11-10'],
  ['NCT07194044', "Metastatic Ewing's Trial Testing Schedule Enhancement to Improve Outcomes（转移性尤文肉瘤给药节奏优化）", 'Ⅰ期', '招募中', 'H. Lee Moffitt Cancer Center and Research Institute', '尤文肉瘤', '2026-11-10'],
  ['NCT06387485', 'A Study to Evaluate the Utilization of 3D Printed Models in Pre-Operative Planning（3D 打印模型用于术前规划）', '观察性', '招募中', 'Ricoh USA, Inc.', '术前规划', '2026-11-10'],
  ['NCT04851119', 'Tegavivint for the Treatment of Recurrent or Refractory Solid Tumors, Including Lymphomas and Desmoid Tumors（Tegavivint 治疗复发/难治实体瘤）', 'Ⅰ/Ⅱ期', '招募中', "Children's Oncology Group", '广谱实体瘤', '2026-11-10'],
  ['NCT05492682', 'START: Safety and Anti-Tumor Activity of PeptiCRAd-1 in Treatment of Cancer（PeptiCRAd-1 溶瘤免疫治疗）', 'Ⅰ期', '招募中', 'Valo Therapeutics Oy', '溶瘤免疫', '2026-11-10'],
].map(([id, title, phase, status, sponsor, topic, last_verified]) => ({
  id, title, phase, status, sponsor, topic, last_verified, url: 'https://clinicaltrials.gov/study/' + id,
}));

/* ---------- 组装 ---------- */

function assemble(P, metricsFn) {
  const metrics = metricsFn().map((m) => ({
    ...m, color: KEY_COLOR[m.key] || m.color, band: m.band ?? null,
  }));
  const { ...rest } = P;
  return { ...rest, metrics };
}

const DATA = {
  profiles: { A: assemble(PROFILE_A, metricsA), B: assemble(PROFILE_B, metricsB) },
  trials: TRIAL_ROWS,
};

/* 分节：键 → 对象。读模型按 section_titles 的 key 取回并加 title。 */
const SECTION_KEYS = ['staging', 'pathology', 'pathway', 'surgery', 'imaging', 'functSelf', 'prosthesis', 'helpPlan'];

/* ---------- 纯数据出口（不碰磁盘） ---------- */

export function buildDemoProfiles() {
  return { profiles: DATA.profiles, trials: DATA.trials, meta: buildMeta() };
}

function buildMeta() {
  return [
    ['disclaimer', '全部患者数据为虚构模拟，仅供原型演示；trials 表为真实登记摘录，登记状态未核实'],
    ['generated_at', new Date().toISOString()],
    ['source', 'demo/build-demo-data.mjs（唯一数据源）'],
    ['subjects', '2'],
    ['window', '2024-09-10..2026-11-08'],
    ['window_label', '演示数据覆盖 2024-09-10 → 2026-11-08（档案 B 约 26 个月；档案 A 2026-10-22 起）'],
    ['views', '9'],
    ['metrics_rows', String(Object.values(DATA.profiles).reduce((a, p) => a + p.metrics.length, 0))],
    ['points_rows', String(Object.values(DATA.profiles).reduce((a, p) => a + p.metrics.reduce((b, m) => b + m.points.length, 0), 0))],
    ['trials', String(DATA.trials.length)],
    ['trial_window', '2026-11-10（CT.gov API v2 实测；status=RECRUITING）'],
  ];
}

function isDirectRun() {
  const entry = process.argv[1];
  if (!entry) return false;
  try {
    return realpathSync(resolve(entry)) === realpathSync(fileURLToPath(import.meta.url));
  } catch {
    return false;
  }
}

/* ---------- 产 1：SQLite ---------- */

function writeSqlite() {
  const db = new DatabaseSync(join(ROOT, 'demo/demo-data.sqlite'));
  db.exec(`
/* 这张表的结构必须与 schema/0001_initial.sql 逐列一致（check-demo-columns 比对）。
   改动顺序：先改 schema/0001_*.sql（或新增 0002），再改这里。
   骨癌裁剪：宫颈族的 rt / fertility / menopause / cytology / hpv / nutrition / screening 系列不建表；
   新增 funct_self_rows（功能自评）、prosthesis_rows（假体与重建随访）、help_rows（医生行动计划原话）。 */
DROP TABLE IF EXISTS metric_points; DROP TABLE IF EXISTS metrics; DROP TABLE IF EXISTS molecular;
DROP TABLE IF EXISTS events; DROP TABLE IF EXISTS rhythm; DROP TABLE IF EXISTS cycles;
DROP TABLE IF EXISTS treatment_lines; DROP TABLE IF EXISTS stage_rows; DROP TABLE IF EXISTS pathology_rows;
DROP TABLE IF EXISTS pathway_rows; DROP TABLE IF EXISTS surgery_rows; DROP TABLE IF EXISTS imaging_rows;
DROP TABLE IF EXISTS funct_self_rows; DROP TABLE IF EXISTS prosthesis_rows; DROP TABLE IF EXISTS help_rows;
DROP TABLE IF EXISTS viewpoints; DROP TABLE IF EXISTS trials; DROP TABLE IF EXISTS subjects;
DROP TABLE IF EXISTS section_titles; DROP TABLE IF EXISTS demo_meta; DROP TABLE IF EXISTS documents;
DROP TABLE IF EXISTS candidate_fields; DROP TABLE IF EXISTS profile_meta;

CREATE TABLE subjects (
  profile_key TEXT PRIMARY KEY, name TEXT, sex TEXT, age INTEGER, meta TEXT, headline TEXT,
  stage TEXT, mindset TEXT, histology TEXT, biopsy_note TEXT,
  dash_keys TEXT, path TEXT, activity TEXT, family_talk TEXT
);
CREATE TABLE section_titles (profile_key TEXT, key TEXT, title TEXT, ord INTEGER, PRIMARY KEY (profile_key, key));
CREATE TABLE metrics (
  profile_key TEXT, key TEXT, name TEXT, unit TEXT, cat TEXT, color TEXT, dec INTEGER,
  kind TEXT, band_low REAL, band_high REAL, note TEXT, PRIMARY KEY (profile_key, key)
);
CREATE TABLE metric_points (
  profile_key TEXT, metric_key TEXT, d TEXT, v_num REAL, v_text TEXT, src TEXT, ord INTEGER,
  PRIMARY KEY (profile_key, metric_key, d, ord)
);
CREATE TABLE molecular (profile_key TEXT, k TEXT, v TEXT, src TEXT, state TEXT, note TEXT, ord INTEGER);
CREATE TABLE events (profile_key TEXT, d TEXT, label TEXT);
CREATE TABLE rhythm (profile_key TEXT, item TEXT, freq TEXT, guideline TEXT, next TEXT, ord INTEGER);
CREATE TABLE cycles (profile_key TEXT, name TEXT, date TEXT, drugs TEXT, status TEXT, done INTEGER, ord INTEGER);
CREATE TABLE treatment_lines (profile_key TEXT, name TEXT, detail TEXT, done INTEGER, ord INTEGER);
CREATE TABLE stage_rows (profile_key TEXT, item TEXT, value TEXT, note TEXT, ord INTEGER);
CREATE TABLE pathology_rows (profile_key TEXT, kind TEXT, a TEXT, b TEXT, ord INTEGER);
CREATE TABLE pathway_rows (profile_key TEXT, phase TEXT, name TEXT, window TEXT, detail TEXT, note TEXT, ord INTEGER);
CREATE TABLE surgery_rows (profile_key TEXT, d TEXT, procedure TEXT, approach TEXT, recon TEXT, margins TEXT, institution TEXT, note TEXT, ord INTEGER);
CREATE TABLE imaging_rows (profile_key TEXT, d TEXT, kind TEXT, finding TEXT, next TEXT, note TEXT, ord INTEGER);
CREATE TABLE funct_self_rows (profile_key TEXT, d TEXT, item TEXT, detail TEXT, ord INTEGER);
CREATE TABLE prosthesis_rows (profile_key TEXT, d TEXT, item TEXT, finding TEXT, institution TEXT, ord INTEGER);
CREATE TABLE help_rows (profile_key TEXT, trigger_text TEXT, action_text TEXT, ord INTEGER);
CREATE TABLE viewpoints (profile_key TEXT, d TEXT, mood TEXT, text TEXT, ord INTEGER);
CREATE TABLE trials (nct_id TEXT PRIMARY KEY, title TEXT, phase TEXT, status TEXT, sponsor TEXT, url TEXT, topic TEXT, last_verified TEXT);
CREATE TABLE documents (profile_key TEXT, id TEXT, name TEXT, date TEXT, type TEXT, status TEXT, ord INTEGER, PRIMARY KEY (profile_key, id));
CREATE TABLE candidate_fields (profile_key TEXT, id TEXT, name TEXT, value TEXT, source TEXT, status TEXT, ord INTEGER, PRIMARY KEY (profile_key, id));
CREATE TABLE demo_meta (k TEXT PRIMARY KEY, v TEXT);
CREATE TABLE profile_meta (profile_key TEXT, k TEXT, v TEXT, PRIMARY KEY (profile_key, k));

CREATE INDEX idx_points  ON metric_points (profile_key, metric_key);
CREATE INDEX idx_stage   ON stage_rows    (profile_key, ord);
CREATE INDEX idx_docs    ON documents     (profile_key);
CREATE INDEX idx_imaging ON imaging_rows  (profile_key, d);
`);

  const insSubject = db.prepare(`INSERT INTO subjects
    (profile_key, name, sex, age, meta, headline, stage, mindset, histology, biopsy_note,
     dash_keys, path, activity, family_talk)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`);
  const insSectionTitle = db.prepare('INSERT INTO section_titles (profile_key, key, title, ord) VALUES (?,?,?,?)');
  const insProfileMeta = db.prepare('INSERT INTO profile_meta (profile_key, k, v) VALUES (?,?,?)');
  const insMetric = db.prepare(`INSERT INTO metrics
    (profile_key, key, name, unit, cat, color, dec, kind, band_low, band_high, note)
    VALUES (?,?,?,?,?,?,?,?,?,?,?)`);
  const insPoint = db.prepare(`INSERT INTO metric_points
    (profile_key, metric_key, d, v_num, v_text, src, ord) VALUES (?,?,?,?,?,?,?)`);
  const insMolecular = db.prepare('INSERT INTO molecular (profile_key, k, v, src, state, note, ord) VALUES (?,?,?,?,?,?,?)');
  const insEvent = db.prepare('INSERT INTO events (profile_key, d, label) VALUES (?,?,?)');
  const insRhythm = db.prepare('INSERT INTO rhythm (profile_key, item, freq, guideline, next, ord) VALUES (?,?,?,?,?,?)');
  const insCycle = db.prepare('INSERT INTO cycles (profile_key, name, date, drugs, status, done, ord) VALUES (?,?,?,?,?,?,?)');
  const insLine = db.prepare('INSERT INTO treatment_lines (profile_key, name, detail, done, ord) VALUES (?,?,?,?,?)');
  const insStage = db.prepare('INSERT INTO stage_rows (profile_key, item, value, note, ord) VALUES (?,?,?,?,?)');
  const insPathology = db.prepare('INSERT INTO pathology_rows (profile_key, kind, a, b, ord) VALUES (?,?,?,?,?)');
  const insPathway = db.prepare('INSERT INTO pathway_rows (profile_key, phase, name, window, detail, note, ord) VALUES (?,?,?,?,?,?,?)');
  const insSurgery = db.prepare(`INSERT INTO surgery_rows
    (profile_key, d, procedure, approach, recon, margins, institution, note, ord) VALUES (?,?,?,?,?,?,?,?,?)`);
  const insImaging = db.prepare('INSERT INTO imaging_rows (profile_key, d, kind, finding, next, note, ord) VALUES (?,?,?,?,?,?,?)');
  const insFunctSelf = db.prepare('INSERT INTO funct_self_rows (profile_key, d, item, detail, ord) VALUES (?,?,?,?,?)');
  const insProsthesis = db.prepare('INSERT INTO prosthesis_rows (profile_key, d, item, finding, institution, ord) VALUES (?,?,?,?,?,?)');
  const insHelp = db.prepare('INSERT INTO help_rows (profile_key, trigger_text, action_text, ord) VALUES (?,?,?,?)');
  const insViewpoint = db.prepare('INSERT INTO viewpoints (profile_key, d, mood, text, ord) VALUES (?,?,?,?,?)');
  const insDoc = db.prepare('INSERT INTO documents (profile_key, id, name, date, type, status, ord) VALUES (?,?,?,?,?,?,?)');
  const insCandidate = db.prepare('INSERT INTO candidate_fields (profile_key, id, name, value, source, status, ord) VALUES (?,?,?,?,?,?,?)');

  /* 一图秀泳道用的事件：demo 里 events 存 [日期,名称] 定长数组（在 profile 本体上）。
     没有事件就没有泳道，这是空态不是错误。 */
  for (const [k, p] of Object.entries(DATA.profiles)) {
    insSubject.run(k, p.name, p.sex, p.age, p.meta, p.headline, p.stage, p.mindset,
      p.histology, p.biopsyNote,
      JSON.stringify(p.dash_keys), JSON.stringify(p.path), p.activity, p.familyTalk);

    SECTION_KEYS.forEach((key, i) => {
      if (p[key] && p[key].title) insSectionTitle.run(k, key, p[key].title, i);
    });

    for (const m of p.metrics) {
      /* 分类指标：unit 必须 NULL（口径：不写空串）；dec 为 null 时 kind 记 'qual' */
      insMetric.run(k, m.key, m.name, m.unit ?? null, m.cat ?? null, m.color ?? null,
        m.dec ?? null, m.dec === null ? (m.kind || 'qual') : 'numeric',
        m.band ? m.band[0] : null, m.band ? m.band[1] : null, m.note ?? null);
      m.points.forEach((pt, i) => insPoint.run(k, m.key, pt.d,
        typeof pt.v === 'number' ? pt.v : null,
        typeof pt.v === 'number' ? null : pt.v,
        pt.src ?? null, i));
    }
    p.molecular.forEach((x, i) => insMolecular.run(k, x.k, x.v, x.src ?? null, x.state ?? null, x.note ?? null, i));
    (p.events || []).forEach((e) => insEvent.run(k, e[0], e[1]));
    p.rhythm.forEach((r, i) => insRhythm.run(k, r[0], r[1], r[2], r[3], i));
    p.cycles.forEach((c, i) => insCycle.run(k, c[0], c[1], c[2], c[3], c[4] ? 1 : 0, i));
    p.lines.forEach((l, i) => insLine.run(k, l.name, l.detail, l.done ? 1 : 0, i));
    if (p.staging) p.staging.rows.forEach((r, i) => insStage.run(k, r[0], r[1], r[2], i));
    if (p.pathology) insProfileMeta.run(k, 'pathology_status', p.pathology.status ?? null);
    p.pathology.rows.forEach((r, i) => insPathology.run(k, 'row', r[0], r[1], i));
    p.pathology.gaps.forEach((r, i) => insPathology.run(k, 'gap', r[0], r[1], i));
    if (p.pathway) p.pathway.rows.forEach((r, i) => insPathway.run(k, r[0], r[1], r[2], r[3], r[4], i));
    if (p.surgery) p.surgery.rows.forEach((r, i) => insSurgery.run(k, r[0], r[1], r[2], r[3], r[4], r[5], r[6], i));
    if (p.imaging) p.imaging.rows.forEach((r, i) => insImaging.run(k, r[0], r[1], r[2], r[3], r[4] ?? null, i));
    if (p.functSelf) p.functSelf.rows.forEach((r, i) => insFunctSelf.run(k, r[0], r[1], r[2], i));
    if (p.prosthesis) p.prosthesis.rows.forEach((r, i) => insProsthesis.run(k, r[0], r[1], r[2], r[3] ?? null, i));
    if (p.helpPlan) p.helpPlan.rows.forEach((r, i) => insHelp.run(k, r[0], r[1], i));
    p.viewpoints.forEach((v, i) => insViewpoint.run(k, v[0], v[1], v[2], i));
    p.docs.forEach((d, i) => insDoc.run(k, d[0], d[1], d[2], d[3], d[4], i));
    p.candidates.forEach((c, i) => insCandidate.run(k, c[0], c[1], c[2], c[3], c[4], i));
  }

  const insTrial = db.prepare('INSERT INTO trials (nct_id, title, phase, status, sponsor, url, topic, last_verified) VALUES (?,?,?,?,?,?,?,?)');
  DATA.trials.forEach((t) => insTrial.run(t.id, t.title, t.phase, t.status, t.sponsor, t.url, t.topic, t.last_verified));
  const insMeta = db.prepare('INSERT INTO demo_meta (k, v) VALUES (?,?)');
  buildMeta().forEach(([k, v]) => insMeta.run(k, v));
  db.close();
}

/* ---------- 产 2：原型数据层 ---------- */

function writePrototypeJs() {
  /* 只有 profiles 与 trials 进前端快照：meta 带 generated_at（每次都变），放进快照会让文件每次运行都变。 */
  const js = '/* 由 demo/build-demo-data.mjs 生成；勿手改，改数据请改生成器后重新运行。 */\n'
    + 'window.DEMO_DATA = ' + JSON.stringify(DATA) + ';\n';
  writeFileSync(join(P2, 'demo-data.js'), js);
}

if (isDirectRun()) {
  writeSqlite();
  writePrototypeJs();
  const nMetrics = Object.values(DATA.profiles).reduce((a, p) => a + p.metrics.length, 0);
  const nPoints = Object.values(DATA.profiles).reduce((a, p) => a + p.metrics.reduce((b, m) => b + m.points.length, 0), 0);
  console.log(`demo-data.sqlite + demo-data.js 生成完毕：2 档案 / ${nMetrics} 项指标 / ${nPoints} 个数据点 / ${DATA.trials.length} 条试验`);
}
