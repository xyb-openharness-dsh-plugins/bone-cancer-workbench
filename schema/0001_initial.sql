/* 小骨宝 OsteoPal（骨癌工作台）· 初始数据模型（0001）
 *
 * 家族四条契约（与家族各仓同源）：
 *   1. 看法恒不为结论（viewpoints 只是记录，读模型保证恒为"不是医生结论"）；
 *   2. 显式 null ≠ 0：未知日期、缺失值一律 NULL，不用空串冒充；
 *   3. 更正只新增版本，不覆盖（documents/candidate_fields 带 ord 版本序，历史行保留）；
 *   4. 事实四层不合并（文档 / 候选 / 记录 / 指标分表存放）。
 *
 * 肿瘤线数据层红线（骨癌语境）：
 *   A. 无派生判定列：全库不设 diagnosis / risk_level / activity_score / 疗效 / 预后 类**派生判定**列。
      subjects.stage 与 stage_rows 存的是**医生给出的分期原文**（记录事实，不是本台判定）；
      MSTS / 坏死率等评分只存医生记录原文（pathology_rows / funct_self_rows），不做自动判定。
 *   B. 化验可比组 = 方法 + 机构：metrics 不做跨组连线或做差；分类（cat）只作分组展示键，不进趋势。
 *   C. 治疗单元 = 一次手术 / 一个化疗周期（cycles 一行=一个周期；手术进 surgery_rows），不按天数打勾。
 *
 * 迁移只增不改：本文件冻结后（sha256 见 freeze-contract.md），
 * 要加结构只能新增 0002_*.sql，改这里会被 check 拦下。
 *
 * 约定：
 *   - ORDER BY rowid 为稳定读序（家族契约）；
 *   - in_use 标记候选/记录是否被采用（candidate_fields.status：candidate/accepted）；
 *   - 分节标题进 section_titles 表（不用 *_title 列，家族教训）；
 *   - viewpoints 默认私密（is_private 语义=1）：三出口（看板摘要/导出/AI 上下文）必须显式过滤。
 *   - 本表结构与 demo/build-demo-data.mjs 的 CREATE TABLE 逐列一致（check-schema-judgment.mjs 比对）。

/* ---------- 判读列断言（G3）：以下列名全库禁止出现 ----------
   diagnosis  risk_level  activity_score  prognosis  efficacy  grade_auto  msts_score  necrosis_rate_auto
   （医生原文里的分级/评分文本可存于 TEXT 记录列，但不得建独立判定列或自动计算列。）
   ------------------------------------------------------------------ */

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
