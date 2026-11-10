# freeze-contract · bone-cancer-workbench

- 冻结对象:`schema/0001_initial.sql`
- sha256:`f920705d82f4ffafdd1ae2d261160550523a8924923cff0ad6b97bfef1ee485f`
- 冻结时间:2026-11-11(无人值守夜班,M3)
- 冻结 commit:见 git log(本文件所在 commit)

## 只增不改规则

1. 本文件冻结后,`schema/0001_initial.sql` 不得修改;要加表/加列只能新增 `schema/0002_*.sql`。
2. `demo/build-demo-data.mjs` 的 CREATE TABLE 必须与 0001 逐列一致;不一致由 `scripts/check-schema-judgment.mjs` 拦下(check 链)。
3. 读模型与前端只按本合同消费:ORDER BY rowid、显式 null、分节标题进 section_titles、私密 viewpoints 三出口显式过滤。
4. 禁止派生判定列:diagnosis / risk_level / activity_score / prognosis / efficacy / grade_auto / msts_score / necrosis_rate_auto 全库 0 命中(check-schema-judgment 断言)。医生给出的分期/评分以原文 TEXT 记录。

## 变更流程

改数据语义 → 先新增 0002 迁移 → 再改生成器与读模型 → 更新本文件附注(哈希只对 0001,0002 单独记)。

## 附注

- 24 张表:档案级(subjects/section_titles/profile_meta)3、指标(metrics/metric_points)2、通用(events/rhythm/cycles/treatment_lines/documents/candidate_fields/viewpoints/molecular/trials/demo_meta)10、骨癌专属(stage_rows/pathology_rows/pathway_rows/surgery_rows/imaging_rows/funct_self_rows/prosthesis_rows/help_rows)9。
- 导入三件:documents(原件)+ candidate_fields(候选)+ metric_points(核对后入库),对应「上传 → 解析 → 确认指标 → 入库」链路。
