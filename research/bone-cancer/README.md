# research/bone-cancer · M4 四件套(2026-11-11 实跑)

- 通道终态(如实,FAILED ≠ 查过零结果):
  - ctv(CT.gov 经 unified-trial-mcp):SUCCESS,214 条参与合并
  - ictrp:TIMEOUT / FAILED(骨肉瘤、bone cancer 查询超时,尤文查询失败)——**未查过,不写零结果**
  - chictr_online:**FAILED(未查过)**
  - chinadrugtrials / xyb_chinadrugtrials_archive:NO_RESULTS / DENIED;chictr_pancreatic_archive:NEEDS_SETUP(离线语料仅胰腺癌覆盖)
- 四件套一致性:manifest.recordCount 214 = dbCount 214 = jsonl 214 行 = sqlite trials 214(check-trial-snapshot PASS)
- 采集关键词 4 条(英文标准名/中文标准名/宽检索/扩展检索),去重靠登记号;合并前=合并后 214(无跨源重号,中国登记通道未成功)
- 交叉核对:CT.gov API v2 直查(2026-11-10,query.cond=osteosarcoma&query.locn=China)中国骨肉瘤 87 项/招募中 19;M1 子代理同口径。本快照全量 214 条为 bone cancer+Ewing 全球口径,量级一致。
- 快照会过期;登记状态一律「未核实」;入排标准以官方登记页为准
- 与试验线关系:本台临床试验线保留(35 号四段链路);v0.2 原型演示摘录 6 条(真实登记),开发版接入本快照
