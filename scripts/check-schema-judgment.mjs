#!/usr/bin/env node
/**
 * G3 数据层断言：
 *   1) schema/0001_initial.sql 的 sha256 与 schema/freeze-contract.md 记录一致（迁移只增不改）；
 *   2) 全库无派生判定列（diagnosis / risk_level / activity_score / …）；
 *   3) demo/build-demo-data.mjs 的 CREATE TABLE 集合与 0001 逐表逐列一致。
 * 用法：node scripts/check-schema-judgment.mjs  （退出码 0 = 通过）
 */
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
let fails = 0;
const fail = (m) => { console.log('FAIL ' + m); fails++; };
const ok = (m) => console.log('ok   ' + m);

const sql = readFileSync(join(ROOT, 'schema/0001_initial.sql'), 'utf8');
const sha = createHash('sha256').update(sql).digest('hex');
const fc = readFileSync(join(ROOT, 'schema/freeze-contract.md'), 'utf8');
const mSha = /sha256[:：]`([0-9a-f]{64})`/.exec(fc);
if (!mSha) fail('freeze-contract.md 里找不到 sha256 记录');
else if (mSha[1] === sha) ok(`freeze-contract sha256 一致（${sha.slice(0, 12)}…）`);
else fail(`freeze-contract sha256 不一致：合同 ${mSha[1].slice(0, 12)}… vs 实际 ${sha.slice(0, 12)}…（改 0001 必须同步合同）`);


const schemaTables = [...sql.matchAll(/CREATE TABLE (\w+) \(([^;]+?)\);/gs)];

const FORBIDDEN = ['diagnosis', 'risk_level', 'activity_score', 'prognosis', 'efficacy', 'grade_auto', 'msts_score', 'necrosis_rate_auto'];
const colDefs = [];
for (const t of schemaTables) {
  const body = t[2].replace(/\/\*[\s\S]*?\*\//g, '').replace(/--.*$/gm, '');
  for (const m of body.matchAll(/([a-z_]+)\s+(?:TEXT|INTEGER|REAL)\b/gi)) colDefs.push(m[1].toLowerCase());
}
const hits = FORBIDDEN.filter(w => colDefs.includes(w));
if (hits.length) fail(`判定列命中：${hits.join(', ')}`);
else ok(`无派生判定列（扫 ${colDefs.length} 个列名）`);
const gen = readFileSync(join(ROOT, 'demo/build-demo-data.mjs'), 'utf8');
const genTables = [...gen.matchAll(/CREATE TABLE (\w+) \(([^;]+?)\);/gs)];
const norm = (t) => t[1] + '|' + t[2].replace(/--.*$/gm, '').replace(/\s+/g, ' ').trim();
const sSet = new Set(schemaTables.map(norm)), gSet = new Set(genTables.map(norm));
const missingInSchema = [...gSet].filter(x => !sSet.has(x));
const missingInGen = [...sSet].filter(x => !gSet.has(x));
if (missingInSchema.length) fail(`生成器有而 0001 没有：${missingInSchema.map(x => x.split('|')[0]).join(', ')}`);
if (missingInGen.length) fail(`0001 有而生成器没有：${missingInGen.map(x => x.split('|')[0]).join(', ')}`);
if (!missingInSchema.length && !missingInGen.length) ok(`表结构逐列一致（${schemaTables.length} 张表）`);

process.exit(fails ? 1 : 0);
