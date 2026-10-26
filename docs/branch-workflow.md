# 双端原型分支与发布约定

## 基准仓库

| 端 | 仓库 | 基准分支 | GitHub Pages 地址 |
|---|---|---|---|
| Custom | [ldy-66/custom-prototype](https://github.com/ldy-66/custom-prototype) | `main` | https://ldy-66.github.io/custom-prototype/ |
| Trader | [ldy-66/trader-prototype](https://github.com/ldy-66/trader-prototype) | `main` | https://ldy-66.github.io/trader-prototype/ |

`main` 保存已确认的基准原型。Pages 正式发布由 `main` 的更新触发；部署工作流合入前，仓库的 Pages 来源也需配置为 GitHub Actions。

## 任务分支

- 每项需求单独建分支，分支从对应仓库最新的 `main` 创建。
- 命名格式：`codex/<task-key>-<short-name>`，例如 `codex/cloud-888-holdings-sector-filter`。
- 分支只提交该任务的代码、原型和必要说明。不要把其他任务的未提交内容或提交带进来。
- 只影响一个端的任务，只在对应仓库建分支。
- 同时影响 Custom 和 Trader 的任务，在两个仓库建立同名分支；每端只提交本端内容，两个 PR 互相链接。

## PR 与任务组合

PR 描述记录任务编号、设计文档、本分支的基准提交、预览地址和验证情况。双端任务分别提交 PR，并在双方 PR 中填写配对链接。

任务互不依赖时，各自向 `main` 提 PR。需要把多项任务放在一起验证时，从最新 `main` 建立 `codex/integration/<release>`，将选定任务分支合入该集成分支；确认组合结果后，再由集成分支向 `main` 提一个 PR。不要把集成结果直接写入基准分支。

## 发布与旧分支迁移

- `main` 更新或手动触发 Pages 工作流时发布基准原型；普通任务分支不覆盖正式预览。
- 旧分支保留原提交历史。迁移前先对照最新 `main` 检查差异，将任务内容拆开后再建立新分支和 PR；不直接强推或删除旧分支。
- 需求只有概要设计、尚无原型实现时，在任务索引中标为“仅设计”，不创建空的功能分支。

PR 检查项见 [Pull Request 模板](../.github/pull_request_template.md)。
