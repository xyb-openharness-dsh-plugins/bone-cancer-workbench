# M7/M8 冻结草稿(无人值守,待晨审授权后执行)

冻结原因:无人值守对外动作禁令——「冻结 M7 的 tag 与 GitHub release、M8 的回填 PR,只备好草稿存 docs/release-draft/ 并列进报告;禁止公开发布、向他人仓库推送」。

## M7 发布(草稿)

- tag:`v0.2.1`(指向 commit:晨审时以当时 HEAD 为准,执行 `git tag v0.2.0 <sha> && git push origin v0.2.0`)
- release:标题「小骨宝 OsteoPal v0.2.1(骨癌工作台;含会话创建契约修订)」
- 附件:`xyb-community-bone-cancer-workbench-0.2.1.tgz`(本目录)+ `SHA256SUMS.txt`
  - tgz sha256:`feab4f1d56358754895188f41101dce529d0568352d298578358bcc1ee85ae6e`
- CHANGELOG 发版段:已写入仓库 CHANGELOG.md 0.2.0 段(M7 授权后随 tag 一起生效)
- 未验证项照抄:MinerU 未接入(接口契约验失败路径);真机界面走查待人工;dshHomePath 服务端读取待核

## M8 回填(草稿)

- 仓库:xyb-openharness-dsh-plugins/.github
- 目标文件:BACKLOG.md · NCCN #54 Bone Cancer 行(1.7 W6)
- 按 31 号口径,只改状态列:
  - 旧:`| 54 | Bone Cancer | 骨癌 | 2.2025 | T1 | 罕见病 #36/#57 挂此 | ⚪ 规划中 | 👤🩺📝 |`
  - 新:`| 54 | Bone Cancer | 骨癌 | 2.2025 | T1 · 🟡 [bone-cancer-workbench](https://github.com/xyb-openharness-dsh-plugins/bone-cancer-workbench) v0.2.0(2026-11-11 认领,[Issue #69](https://github.com/xyb-openharness-dsh-plugins/.github/issues/69);M0–M6 全链,check/test/audit 全绿,包级装机宿主已加载,真机走查待晨审) | 罕见病 #36/#57 挂此 | 👤🩺📝 |`
- 流程:PR 前 `git pull` 最新 main;只改状态列,不动他行;PR 描述附本报告与签认清单
