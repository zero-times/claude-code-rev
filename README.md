# Restored Claude Code Source

![Preview](preview.png)

This repository is a restored Claude Code source tree reconstructed primarily from source maps and missing-module backfilling.

It is not the original upstream repository state. Some files were unrecoverable from source maps and have been replaced with compatibility shims or degraded implementations so the project can install and run again.

## Status Snapshot

- A static audit on 2026-04-01 found no missing relative imports under `src/`, `vendor/`, or `shims/`.
- The default Bun scripts point at the restored CLI bootstrap path instead of the temporary restore-only entry.
- Several private, native, browser, and desktop integrations still rely on compatibility shims or reduced behavior.
- Runtime validation was re-run on 2026-04-01 with Bun 1.3.11.
- `bun install --frozen-lockfile`, `bun run version`, `bun run dev --help`, and `bun run smoke-check:ci` completed successfully in that Bun-enabled environment.

## Known Degraded Areas

- Claude in Chrome MCP exposes a compatibility server surface, but browser actions are unavailable in this snapshot.
- Computer Use MCP still supports approval-oriented flows, but native desktop execution is unavailable.
- Desktop input shims are mostly `no-op` fallbacks.
- Some native features depend on platform-specific `.node` binaries that are not fully present in this repository snapshot.

## Documentation

- [`RESTORATION_GAPS.md`](RESTORATION_GAPS.md): prioritized restoration backlog and audit summary
- [`NATIVE_DEPENDENCIES.md`](NATIVE_DEPENDENCIES.md): native binary inventory, platform scope, and missing-runtime impact
- [`LICENSE.md`](LICENSE.md): current license notice for this restored workspace

## Why This Exists

Source maps do not contain a full original repository:

- type-only files are often missing
- build-time generated files may be absent
- private package wrappers and native bindings may not be recoverable
- dynamic imports and resource files are frequently incomplete

This repository fills those gaps enough to produce a usable restored workspace that can continue to be repaired and audited.

## Run

Requirements:

- Bun 1.3.5 or newer
- Node.js 24 or newer

Install dependencies:

```bash
bun install
```

Print the restored version:

```bash
bun run version
```

Inspect the restored command tree:

```bash
bun run dev --help
```

Run the restored CLI:

```bash
bun run dev
```

If you are working on a fresh machine, treat the commands above as smoke checks that should be re-verified before relying on the current README claims.

## Validation

Static-only validation without Bun:

```bash
node ./scripts/smoke-check.mjs --static-only
```

Full smoke check in a Bun-enabled environment:

```bash
bun run smoke-check
```

This repository also includes a minimal GitHub Actions workflow at `.github/workflows/smoke-check.yml` that installs dependencies and runs the CI smoke check path.

## 中文说明

# 还原后的 Claude Code 源码

![Preview](preview.png)

这个仓库是一个主要通过 source map 逆向还原、再补齐缺失模块后得到的 Claude Code 源码树。

它并不是上游仓库的原始状态。部分文件无法仅凭 source map 恢复，因此目前仍包含兼容 shim 或降级实现，以便项目可以重新安装并继续修复。

## 当前快照

- 2026-04-01 的静态审计结果显示，`src/`、`vendor/`、`shims/` 下未发现缺失的相对导入。
- 默认 Bun 脚本已经指向还原后的 CLI bootstrap 路径，而不是恢复期临时入口。
- 私有能力、原生能力、浏览器桥接和桌面能力中，仍有一部分依赖 shim 或降级实现。
- 2026-04-01 已在 Bun 1.3.11 环境中重新完成 runtime 校验。
- `bun install --frozen-lockfile`、`bun run version`、`bun run dev --help`、`bun run smoke-check:ci` 均已执行成功。

## 已知降级区域

- Claude in Chrome MCP 当前只有兼容层，浏览器动作不可用。
- Computer Use MCP 仍保留审批相关流程，但原生桌面执行不可用。
- 桌面输入 shim 大多是 `no-op` 回退实现。
- 部分原生功能依赖平台相关的 `.node` 二进制，而这些文件在当前仓库快照中并不完整。

## 文档入口

- [`RESTORATION_GAPS.md`](RESTORATION_GAPS.md)：恢复缺口优先级和审计结论
- [`NATIVE_DEPENDENCIES.md`](NATIVE_DEPENDENCIES.md)：原生二进制依赖与缺失影响清单
- [`LICENSE.md`](LICENSE.md)：当前恢复工作区的许可证说明

## 为什么会有这个仓库

source map 本身并不能包含完整的原始仓库：

- 类型专用文件经常缺失
- 构建时生成的文件可能不存在
- 私有包包装层和原生绑定可能无法恢复
- 动态导入和资源文件经常不完整

这个仓库的目标，是把这些缺口补到“可继续修复、可继续审计”的程度。

## 运行方式

环境要求：

- Bun 1.3.5 或更高版本
- Node.js 24 或更高版本

安装依赖：

```bash
bun install
```

输出版本号：

```bash
bun run version
```

查看命令树：

```bash
bun run dev --help
```

启动恢复后的 CLI：

```bash
bun run dev
```

如果你是在一台新的机器上接手这个仓库，请先把上面这些命令当作 smoke check 执行一遍，再决定是否信任当前 README 中的运行声明。

## 验证方式

如果当前机器没有 Bun，可以先跑静态检查：

```bash
node ./scripts/smoke-check.mjs --static-only
```

如果机器已经安装 Bun，则可以跑完整 smoke check：

```bash
bun run smoke-check
```

仓库里还提供了一个最小 GitHub Actions 工作流 `.github/workflows/smoke-check.yml`，会自动安装依赖并执行 CI 用的 smoke check。
