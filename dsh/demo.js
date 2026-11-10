/* 演示数据播种（骨癌）。
 *
 * 唯一数据源是 `demo/build-demo-data.mjs` 的 `buildDemoProfiles()`（两个产物 prototypes/v0.2/demo-data.js
 * 与 demo/demo-data.sqlite 也从它生成）。这里只是把同一份纯数据写进**用户资料目录里那个库**，
 * 不新增、不改写任何数值——演示数据一旦在这里多出一条，原型与开发版就会各说一套
 * （这是 `test/store.test.mjs` 里 deepStrictEqual parity 断言存在的原因）。
 *
 * 幂等：库里已经有 subjects 就整批跳过（开发版启动时可能跑很多次，不能每次都复制一份档案）。
 * 事务：整批在一个事务里，中途失败整体回滚，不留"半个档案"。
 *
 * 与 cervical 底本的结构差异（别互相抄）（leftover-allow：移植来源对照声明）
 * - 骨癌分节标题同样在 section_titles 表（8 个分节，key + title + ord）；
 * - subjects 用 biopsy_note（病理标本说明），不是 hpv_status；
 * - 骨癌专属表：stage_rows / pathology_rows / pathway_rows / surgery_rows / imaging_rows /
 *   funct_self_rows / prosthesis_rows / help_rows；
 *   cervical 的 rt_rows / late_effect_rows / lymphedema_rows / vagina_rows / menopause_rows /（leftover-allow：禁抄清单）
 *   hormone_rows / fertility 系 / sexual_rows / cytology_rows / hpv_rows / screening_rows /
 *   nutrition_rows / supplement_rows 一律不许抄回来（DEV-REQUIREMENTS §六）。
 *
 * 两个字段口径（H6 的教训，别图省事）：
 * 1. 所有 INSERT 写显式列名 + 显式问号数，不用位置式 VALUES；
 * 2. events / docs / candidates / cycles / 各分节 rows 在 demo-data 里是**定长数组**，
 *    这里按下标取，不要写 d.id / e.date（那是别的仓的对象形状）。
 */

import { buildDemoProfiles } from '../demo/build-demo-data.mjs';

const j = (v) => (v === undefined ? null : JSON.stringify(v));
const flag = (v) => (v ? 1 : 0);

/** 分节 key：与 demo/build-demo-data.mjs 的 SECTION_KEYS、dsh/readmodels.js 的同名常量三处一致。 */
const SECTION_KEYS = ['staging', 'pathology', 'pathway', 'surgery', 'imaging', 'functSelf', 'prosthesis', 'helpPlan'];

/** 把 buildDemoProfiles() 的数据写进库。返回写入计数（便于启动日志与测试）。 */
export function seedDemo(db, input) {
  if (!db || typeof db.prepare !== 'function') throw new TypeError('seedDemo 需要一个已打开的数据库');
  const data = input || buildDemoProfiles();

  const already = db.prepare('SELECT COUNT(*) AS n FROM subjects').get().n;
  if (already > 0) return { skipped: true, subjects: 0, metrics: 0, points: 0, trials: 0 };

  const counts = { skipped: false, subjects: 0, metrics: 0, points: 0, trials: 0 };

  db.exec('BEGIN');
  try {
    /* 列名顺序与 schema/0001_initial.sql 一致；按位置写会因为列数不匹配直接报错（这是想要的）。 */
    const insSubject = db.prepare(`INSERT INTO subjects
      (profile_key, name, sex, age, meta, headline, stage, mindset, histology, biopsy_note,
       dash_keys, path, activity, family_talk)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`);
    const insSectionTitle = db.prepare('INSERT INTO section_titles (profile_key, key, title, ord) VALUES (?,?,?,?)');
    const insProfileMeta = db.prepare('INSERT INTO profile_meta (profile_key, k, v) VALUES (?,?,?)');
    const insMetric = db.prepare(`INSERT INTO metrics
      (profile_key, key, name, unit, cat, color, dec, kind, band_low, band_high, note)
      VALUES (?,?,?,?,?,?,?,?,?,?,?)`);
    const insPoint = db.prepare('INSERT INTO metric_points (profile_key, metric_key, d, v_num, v_text, src, ord) VALUES (?,?,?,?,?,?,?)');
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
    const insView = db.prepare('INSERT INTO viewpoints (profile_key, d, mood, text, ord) VALUES (?,?,?,?,?)');
    const insTrial = db.prepare('INSERT OR IGNORE INTO trials (nct_id, title, phase, status, sponsor, url, topic, last_verified) VALUES (?,?,?,?,?,?,?,?)');
    const insDoc = db.prepare('INSERT INTO documents (profile_key, id, name, date, type, status, ord) VALUES (?,?,?,?,?,?,?)');
    const insCand = db.prepare('INSERT INTO candidate_fields (profile_key, id, name, value, source, status, ord) VALUES (?,?,?,?,?,?,?)');
    const insMeta = db.prepare('INSERT OR IGNORE INTO demo_meta (k, v) VALUES (?,?)');

    for (const [key, p] of Object.entries(data.profiles)) {
      insSubject.run(key, p.name, p.sex, p.age, p.meta, p.headline, p.stage, p.mindset,
        p.histology ?? null, p.biopsyNote ?? null,
        j(p.dash_keys), j(p.path), p.activity ?? null, p.familyTalk ?? null);
      counts.subjects++;

      /* ord 用 SECTION_KEYS 的下标：决定同一页里分节的先后，必须是稳定值不是插入顺序。 */
      SECTION_KEYS.forEach((k, i) => {
        if (p[k] && p[k].title) insSectionTitle.run(key, k, p[k].title, i);
      });
      /* 病理结论状态：section_titles 里放不下（它是"一档案一个值"），走 profile_meta。 */
      if (p.pathology) insProfileMeta.run(key, 'pathology_status', p.pathology.status ?? null);

      for (const m of p.metrics) {
        insMetric.run(key, m.key, m.name, m.unit ?? null, m.cat ?? null, m.color ?? null,
          m.dec ?? null, m.dec === null ? (m.kind || 'qual') : 'numeric',
          m.band ? m.band[0] : null, m.band ? m.band[1] : null, m.note ?? null);
        counts.metrics++;
        for (const [pi, pt] of (m.points || []).entries()) {
          const num = typeof pt.v === 'number' ? pt.v : null;
          const txt = typeof pt.v === 'number' ? null : (pt.v === undefined ? null : String(pt.v));
          insPoint.run(key, m.key, pt.d, num, txt, pt.src ?? null, pi);
          counts.points++;
        }
      }

      (p.molecular || []).forEach((r, i) => insMolecular.run(key, r.k, r.v, r.src ?? null, r.state ?? null, r.note ?? null, i));
      (p.events || []).forEach((e) => insEvent.run(key, e[0], e[1]));
      (p.rhythm || []).forEach((r, i) => insRhythm.run(key, r[0], r[1], r[2], r[3], i));
      (p.cycles || []).forEach((c, i) => insCycle.run(key, c[0], c[1], c[2], c[3], flag(c[4]), i));
      (p.lines || []).forEach((l, i) => insLine.run(key, l.name, l.detail, flag(l.done), i));
      if (p.staging) p.staging.rows.forEach((r, i) => insStage.run(key, r[0], r[1], r[2] ?? null, i));
      if (p.pathology) {
        (p.pathology.rows || []).forEach((r, i) => insPathology.run(key, 'row', r[0], r[1], i));
        (p.pathology.gaps || []).forEach((r, i) => insPathology.run(key, 'gap', r[0], r[1], i));
      }
      if (p.pathway) p.pathway.rows.forEach((r, i) => insPathway.run(key, r[0], r[1], r[2], r[3], r[4], i));
      if (p.surgery) p.surgery.rows.forEach((r, i) => insSurgery.run(key, r[0], r[1], r[2], r[3], r[4], r[5], r[6], i));
      if (p.imaging) p.imaging.rows.forEach((r, i) => insImaging.run(key, r[0], r[1], r[2], r[3] ?? null, r[4] ?? null, i));
      if (p.functSelf) p.functSelf.rows.forEach((r, i) => insFunctSelf.run(key, r[0], r[1], r[2], i));
      if (p.prosthesis) p.prosthesis.rows.forEach((r, i) => insProsthesis.run(key, r[0], r[1], r[2], r[3] ?? null, i));
      if (p.helpPlan) p.helpPlan.rows.forEach((r, i) => insHelp.run(key, r[0], r[1], i));
      (p.viewpoints || []).forEach((v, i) => insView.run(key, v[0], v[1], v[2], i));
      (p.docs || []).forEach((d, i) => insDoc.run(key, d[0], d[1], d[2], d[3], d[4], i));
      (p.candidates || []).forEach((c, i) => insCand.run(key, c[0], c[1], c[2], c[3], c[4], i));
    }

    for (const t of data.trials || []) {
      const r = insTrial.run(t.id, t.title, t.phase, t.status, t.sponsor, t.url ?? null, t.topic ?? null, t.last_verified ?? null);
      if (r && r.changes) counts.trials++;
    }
    for (const [k, v] of data.meta || []) insMeta.run(k, v);

    db.exec('COMMIT');
  } catch (error) {
    try { db.exec('ROLLBACK'); } catch { /* 回滚失败也要把原始错误抛出去 */ }
    throw new Error(`播种演示数据失败（已回滚）：${error.message}`);
  }
  return counts;
}

/** 库的演示档案是否已播种过。启动流程用它决定要不要 seedDemo。 */
export function hasDemoData(db) {
  try {
    return db.prepare('SELECT COUNT(*) AS n FROM subjects').get().n > 0;
  } catch {
    return false;
  }
}
