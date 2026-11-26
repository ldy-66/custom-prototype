# OMS 终极版本集成原型

本原型以 GitHub 上 Custom、Trader 两个已合入的基准原型为底座，汇总本地需求概要设计、2026-10-22 工作周记、2026-11-09 上传 PDF 及相关 Codex 聊天中已确认的需求。

## 本地预览

在 `output/prototypes` 目录启动静态服务：

```powershell
python -m http.server 4174
```

打开 `http://127.0.0.1:4174/ultimate-integration/`。

## 页面组成

- **Custom 工作台**：嵌入本地基准副本；部署到 GitHub Pages 后改用正式 Custom Pages。
- **Trader 工作台**：嵌入本地基准副本；部署到 GitHub Pages 后改用正式 Trader Pages。
- **多窗口交易页**：拖拽、缩放和网格吸附资金、持仓、订单、自选、证券快捷下单、期货快捷下单。
- **数据与配置**：资产币种、保证金比例、购买力账号、配置列设置/导出、账户映射、报单排序、成交查询/导出、Trader 权限草案。
- **登录与异常**：重连进度与 HighTouch 确认弹窗占位。
- **独立系统原型**：Customer 邮箱登录/自选同步单独展示；BCT 报单排序仍链接到独立原型，不合并进 Custom / Trader。
- **临时资金/持仓调整**：只标出聊天与 PRD 中确认的背景及待定边界，未设计成可保存或执行的操作。

## 范围和状态

- Custom 基准：[https://ldy-66.github.io/custom-prototype/](https://ldy-66.github.io/custom-prototype/)；Trader 基准：[https://ldy-66.github.io/trader-prototype/](https://ldy-66.github.io/trader-prototype/)。当前集成记录为 Custom PR #12、Trader PR #10。
- BCT 报单排序：[https://ldy-66.github.io/bct-order-routing-ui/](https://ldy-66.github.io/bct-order-routing-ui/)。
- Customer 邮箱登录的身份与自选同步涉及 APP / OMS Customer / BCT，保留独立页面，不合入 Custom / Trader 基准。
- 本原型使用静态演示数据，不连接 OMS、APP、柜台、身份验证或消息后端。进入 GitHub 主线或 Pages 不表示生产功能已上线。
- PDF 中的期货平仓/拆分规则、资产折算口径、配置字段、错误码、通知事件和服务端权限均有待确认项；界面中的占位提示不构成业务决定。
- 用户明确要求普通期货交易优化纳入；标准套利和自设套利的交易逻辑不在本次改造范围。

## 资料来源

- `C:\Users\TY\Downloads\HH-95046662-091126-1452-2309.pdf`
- `output/documents/backlog/工作周记备份-2026-10-22-已合并子任务.json`
- 本目录 `output/documents/tasks/` 下已保存的概要设计
- 项目中的 14 个 Codex 聊天和 `项目映射与迁移清单.md`

