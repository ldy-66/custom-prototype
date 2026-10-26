# Custom端原型

根据Custom端下单面板截图复刻的浅色桌面交易原型，作为后续需求改造的稳定基础版本。

## 分支与发布约定

- `main` 是已确认的 Custom 基准原型。
- 每项需求从最新 `main` 新建独立的 `codex/<task-key>-<short-name>` 分支。
- 双端任务在 Custom、Trader 仓库使用同名分支，并通过配对 PR 关联。
- GitHub Pages 正式预览由 `main` 发布，任务分支不覆盖基准预览。
- 完整约定见[双端原型分支与发布约定](docs/branch-workflow.md)。

## 本地运行

```powershell
python -m http.server 4174
```

访问 `http://127.0.0.1:4174`。

页面数据均为演示数据，不连接真实交易系统，也不会实际报单。

持仓信息字段以[字段标准](docs/holdings-field-standard.md)为基准。
