# PROGRESS · bone-cancer-workbench

- 当前里程碑:M0–M6 全链完成(自动签认待晨审追认);M7/M8 冻结草稿;M9 回流完成
- 已完成:
  - 领取:Issue #69(/claim 2026-11-10 23:10)+ 私有仓 + init(222 文件)
  - M0:文档九件,check staticPass=true
  - M1:医学十主题核实(NHC 2025/CSCO 2025/NCCN 2.2025/CT.gov 87 项等,来源分级留痕),一级重名率实测 2/7≈29%(后按 9 页导航),G1 签认
  - M2:原型四件套(9 一级页、A/B 双档案、疾病概要四段、32 号整页视图、AI 面板),probe-primer 10/10,probe-pageview 13/13,probe-m2 56 路由×2 档案 0 errors,独立评审 P0=0(P1×4/P2×5 修复),G2 签认
  - M3:schema/0001(23 表)冻结 sha256,判读列断言进 check 链,G3 签认
  - M4:fetch-bone-trials-2026(unified-trial-mcp)214 条,manifest=jsonl=sqlite 一致,FAILED 通道如实记录
  - M5:开发版七步移植(public ui-parity、src→build→lib、MinerU 设置、apiBase 契约、test 66/66、check EXIT=0、audit 44/44),V1 签认
  - M6:0.2.0 包装入真实 Desktop profile(web,68 bundles),宿主重启后 verify-desktop-load「宿主已加载该工作台」;真机 UI 走查待人工
  - M7/M8:tag/release/BACKLOG 回填草稿在 docs/release-draft/
  - M9:回流 commit(starter check-demo-columns 不适用本仓的教训、体检脚本、本仓 LESSONS)
- 下一步(晨审):
  1. 追认全部自动签认(docs/signoffs/ 四份)
  2. GUI 新建会话→打开小骨宝→真机走查+截图(README 替换"DSH Desktop 实机")
  3. 授权后执行 M7(tag+release)与 M8(BACKLOG PR,先 pull)
  4. 品牌「小骨宝」占位名追认;骨巨细胞瘤挂靠口径医学核对
- 阻塞:用户侧 GUI 会话(宿主按会话授权);M7/M8 对外动作待授权
