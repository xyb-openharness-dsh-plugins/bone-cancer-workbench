# MORNING-REVIEW · bone-cancer-workbench 夜班 2026-11-10 23:01 → 2026-11-11 07:30

## 一句话结论

小骨宝骨癌工作台(Issue #69,NCCN #54 · T1)无人值守走完 M0–M6 全链 + M7/M8 冻结草稿 + M9 回流:check 链 EXIT=0、test 66/66、audit 44/44、三探针(10/10、13/13、56 路由×2 档案 0 错误)全绿,0.2.0 已装入真实 Desktop profile 且宿主重启后加载成功;**无停闸**;真机 UI 走查与对外发布待晨审授权。

## 原型审查入口

- 打开方式:双击 `prototypes/v0.2/index.html`(file:// 可用),或 `python3 -m http.server`(仓根)后访问 `/prototypes/v0.2/index.html`;开发版:`scripts/dev-server.mjs`。
- 截图:`docs/shots/v0.2/`(8 张实渲,1440×940,含指标卡翻面收/展态)+ `docs/shots/m2/`(56 路由 × A/B 档案连拍,report.json 同目录)。
- 清单:README「关键功能」六图带患者语言说明;探针命令 `npm run probe:primer / probe:pageview / probe:m2`(必须带 `--url http://127.0.0.1:<port>/prototypes/v0.2/index.html`)。

## 自动签认清单(全部待追认)

| 文件 | 结论 |
| --- | --- |
| docs/signoffs/G1-自动签认.md(含复测记录) | 自动签认通过 |
| docs/signoffs/G2-自动签认.md | 自动签认通过 |
| docs/signoffs/G3-V1-自动签认.md | 自动签认通过 |
| docs/signoffs/M6-V2V3-自动签认.md | 包级装机通过;真机 UI 走查记「待人工」 |

## 待用户决策项

1. **默认值追认**(DEV-REQUIREMENTS §五):服务主体=骨原发恶性肿瘤患者与照护者(成人/AYA);病程覆盖=确诊→随访;MinerU 未接入;品牌占位名=小骨宝 OsteoPal;治疗折叠单元=一次手术/一个化疗周期。
2. **真机走查**:GUI 新建会话 → 打开小骨宝 → 按 README「怎么用」走查 + 截图(替换/增补 README 标注「DSH Desktop 实机」);dshHomePath 数据目录在首次打开后生成,`config.root` 服务端实际读取一并核验。
3. **M7 发布授权**:tag v0.2.0 + GitHub release(草稿与 tgz/sha256 在 docs/release-draft/)。
4. **M8 回填授权**:BACKLOG #54 状态列(31 号口径,PR 前 pull;草稿在 docs/release-draft/RELEASE-DRAFT.md)。
5. **0 访谈/0 临床审核**:场景为家族基线推演;医学阈值全部【待核】;骨巨细胞瘤挂靠口径建议临床核对。
6. 回流(starter rc.31):L84「Desktop 真实 profile 判据」已进 starter LESSONS 并通过自检(check-starter pass + test 67/67),未发布,渠道为 beta/prerelease。

## 消耗

- 时长:约 8.5 小时(23:01–07:30)。
- token:以客户端可见数据为准(未取得,客户端未读数);主会话 + 2 个后台子代理(医学调研 19 次工具调用;独立评审 38 次)。
- 外部服务:ClinicalTrials.gov API v2(直查+MCP 四通道)、NHC/CSCO/NCCN 公开页(只读),无鉴权类失败。

## 未验证与异常

- 真机界面、dshHomePath/store 实跑、原生 AI 会话:未验证(需 GUI 会话,宿主按会话授权)。
- MinerU 真实解析:未接入,按接口契约验失败路径(测试 ⑤);桩件注册通过≠宿主可用。
- 异常 1:pnpm add 撞 ERR_PNPM_TARBALL_INTEGRITY(ds-bot github tarball,既有依赖问题)——判「路径错」,换手工安装路径,已进 L84。
- 异常 2:首次误装 ~/.dsh/profiles/desktop——已完整回滚(备份 /tmp/desktop-pkg-backup.json),教训进 L84。
- 异常 3:schema 0001 由生成器派生时混入模板字面量尾 `\`);`,check-demo-columns 拦下后修正并重算冻结哈希(冻结前修正,合同已同步)。
- 跳过项:check 链各 SKIP(tgz 体检在 pack 前置、探针覆盖在原型落地后自动启用)照抄进 check 输出,SKIP 不计覆盖;HVT 五层真实缺口记录记「待人工」。
