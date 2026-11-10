# LESSONS · bone-cancer-workbench(本仓沉淀;通用项已上提 starter L84)

1. **Desktop 真实 profile = `~/Library/Application Support/dsh-desktop/harness/profiles/web`**;`~/.dsh/profiles/desktop` 是 DeepSeek Harness.app(0 工作台),装错对象重启也不会加载(已实测回滚)。详见 starter docs/LESSONS.md L84。
2. **ci 链中 check-probe-coverage 的 ALL_ROUTE_PROBES 指向本仓探针文件名**(`scripts/probe-m2.mjs`),路由分隔符必须是 `/`(`records/1`),`:` 进不了探针路由正则——初版用 `:` 被检查器拒绝后改斜杠,探针与 hash 同步改。
3. **原型快照冻结口径(D37)**:prototypes/v0.2 的版本字面量冻结在 0.1.0 不随 VERSION 移动;开发版在 public/ 升版。ui-parity 测试比对时把 vX.Y.Z 归一化。
4. **demo-data.js 的 profile 无 kind 键**(dec:null 即分类),读模型还原时不得补 kind:'qual',否则 demo-parity deepStrictEqual 失败。
5. **schema 0001 由生成器 CREATE TABLE 派生时,模板字面量尾部 `\`);` 会混入**——派生脚本截取后要核对孤立反引号;check-demo-columns 的 SQL 执行会把它挑出来。
6. **export/routes 的私密剔除语义随病种变**:cervical 按分节(vagina/sexual),骨癌= viewpoints 整组;readmodels 默认 viewpoints=[] 且导出侧强制清空,三出口只写「N 条中私密 M 条」。

## 检查器待实施(下轮认领者受益)

- probe-one-chart.mjs(C1–C12 脚本化,清单见检查点清单 §14;先断言 path 数>0 防「空值恒等」假绿)。
- probe-metric-cards.mjs(MT05–MT09;翻面 aria-pressed/reduced-motion 终态 matrix3d)。
- probe-profile-target.mjs(装机目标 profile 断言,starter L84 可断言化)。
