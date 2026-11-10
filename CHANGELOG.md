# 变更记录

只增不删；每条写清"改了什么 + 为什么 + 用户可见结果"。版本号与 VERSION、package.json 三处必须一致。

## 0.2.1 — 2026-11-11

- 「AI 对话」会话逻辑按用户口径重写：归属服务判断会话（不再用 Boolean(conversation)，customFrame 下宿主总传隐藏容器）；无会话走 `service.newSession(workspaceId)`（默认工作区 `service.defaultWorkspace?.()?.workspaceId`，无工作区由宿主提示选目录，取消不留空会话并提示重试）；有会话只开/收面板不重复创建；订阅会话变化强制重渲染；创建失败在工作台内显示原因。草稿仍只填入、不自动发送。
- 顺带修正移植残留：agent-draft 消息类型 cervi: → bone:，品牌图标 🪷 → 🦴，开场白去掉本机资料目录路径（34 号红线）并改骨癌语义。
- 用户可见结果：点「AI 对话」在真机可创建并绑定会话；取消/失败都有明确提示。
## 0.2.0 — 2026-11-11

- 包版本 0.2.0（夜班 M0–M5 全链）：九件文档、原型四件套（9 一级页 + 疾病概要四段 + 整页视图 + AI 面板）、两套合成档案（A 林远刚确诊 / B 韩志强术后 2 年）、schema/0001 冻结（23 表）、M4 临床库（unified-trial-mcp 214 条，manifest=jsonl=sqlite）、开发版七步移植（public 与原型 ui-parity、lib/client.js 构建链、MinerU 设置、apiBase 契约、test 66 项）。
- 用户可见结果：DSH Desktop 内可加载数据工作台（M6 待装机核验）；离线打开回退演示数据并明说。

## 0.1.0 — 2026-11-10

- 由社区脚手架 dsh-wb-cli@1.10.0-rc.29 (26426ad) 初始化，仅有注册骨架与健康接口，无业务功能。
