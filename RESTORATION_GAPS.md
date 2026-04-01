# Restoration Gaps

本文件记录当前恢复版仓库在“源码闭合度”“可运行性”“工程配套”三个层面的缺失项，便于后续按优先级补齐。

## 审计范围

- 审计时间：2026-04-01
- 审计方式：静态检查为主，辅以本地命令可用性检查
- 当前限制：本轮审计已完成 Bun runtime 复验，但仍未覆盖所有平台与所有功能路径

## 总体结论

- 源码树闭合度较高：`src/`、`vendor/`、`shims/` 下的相对导入在本次扫描中未发现缺失。
- CLI 入口链路已恢复到真实 bootstrap，而不是仅停留在恢复期的临时入口。
- 项目仍不能视为“完整收尾”。
  主要原因不是源码文件缺失，而是工程配套不完整，以及若干私有/原生/桌面能力仍处于 shim 或 degraded 模式。

## 优先级清单

### P0

#### 1. 补齐许可证文件

- 状态：已补齐基础说明，仍待上游许可证核验
- 当前情况：
  - 仓库已新增 `LICENSE.md`
  - 该文件用于明确“当前许可证文本未核验”的事实，不代表已经恢复出原始上游许可证
- 影响：虽然元信息入口已补齐，但真正的许可证结论仍不能视为完成
- 建议动作：
  - 如能确认原始上游许可证，使用经过核验的正式文本替换当前说明文件

#### 2. 在有 `bun` 的环境中复验 README 声称的可运行状态

- 状态：已完成一轮 runtime 复验
- 证据：已在 Bun 1.3.11 环境中成功执行以下命令
  - `bun install --frozen-lockfile`
  - `bun run version`
  - `bun run dev --help`
  - `bun run smoke-check:ci`
- 补充说明：
  - 这次并未执行完整交互式 `bun run dev` 会话，只验证了 CLI 启动帮助和 smoke-check 路径
- 影响：README 的基础运行声明已得到复核，但仍不能代表所有子命令、所有平台、所有原生能力都已验证
- 建议动作：
  - 后续继续补平台维度和功能维度的验证矩阵

#### 3. 建立恢复缺口总表

- 状态：已建立基础总表，仍需继续细化
- 当前情况：
  - 本文件已承担恢复缺口总表职责
- 证据：`README.md` 目前已补充文档入口，但模块级状态仍未完全展开
- 影响：后续接手者很难快速判断哪些功能可用、哪些只是占位
- 建议动作：
  - 以模块为单位维护状态表
  - 使用四类标签：`working`、`degraded`、`shim-only`、`unknown`
  - 优先覆盖：CLI 主链路、MCP、桌面输入、浏览器桥接、音频、原生模块

#### 4. 明确记录 Chrome MCP 与 Computer Use 的降级边界

- 状态：已在 README 中补充基础说明，仍建议后续细化
- 证据：
  - `shims/ant-claude-for-chrome-mcp/index.ts` 在连接时直接提示浏览器动作不可用
  - `shims/ant-computer-use-mcp/index.ts` 仅保留 access approval 相关流程，多数原生桌面动作不可用
  - `shims/ant-computer-use-input/index.ts` 中大量输入动作是 `no-op`
- 影响：表面上看工具目录是齐的，但运行时行为并不等于原始实现
- 建议动作：
  - 在后续 `MODULE_STATUS.md` 中把“支持什么 / 不支持什么”细到具体工具级别
  - 对外描述时避免使用“已恢复”这种容易被误解为完整可用的表述

#### 5. 盘点原生二进制依赖缺口

- 状态：已建立依赖清单，运行验证仍待完成
- 证据：
  - 已新增 `NATIVE_DEPENDENCIES.md`
  - 仓库内可见 `image-processor.node`
  - `vendor/audio-capture-src/index.ts` 依赖 `audio-capture.node`
  - `vendor/modifiers-napi-src/index.ts` 依赖 `modifiers.node`
  - `vendor/url-handler-src/index.ts` 依赖 `url-handler.node`
- 影响：相关功能即使源码存在，也可能在运行时直接降级或失效
- 建议动作：
  - 在有目标平台和 Bun/Node 版本的环境中补运行验证
  - 明确哪些功能在缺少原生模块时会失效

### P1

#### 6. 增加最小化自动化验证

- 状态：已补最小 smoke-check，仍可继续扩展
- 当前情况：
  - `package.json` 已新增 `smoke-check`、`smoke-check:ci`、`smoke-check:static`
  - 仓库已新增 `scripts/smoke-check.mjs`
- 证据：虽然仍然没有完整 `test`、`lint`、`typecheck` 体系，但基础入口验证已经可以自动执行
- 影响：恢复后很难稳定保持“还能跑”
- 建议动作：
  - 后续继续把检查范围扩展到更多关键命令和模块
  - 视情况增加更细粒度的类型检查或模块级测试

#### 7. 增加 CI

- 状态：已补最小 CI 骨架
- 当前情况：
  - 仓库已新增 `.github/workflows/smoke-check.yml`
  - 当前 workflow 会安装依赖并运行 `bun run smoke-check:ci`
- 影响：恢复成果无法自动守护，后续改动容易回退到“装不上/跑不起来”
- 建议动作：
  - 后续可继续增加平台矩阵、缓存和更多命令验证

#### 8. 补模块级状态表

- 状态：缺失
- 建议优先覆盖：
  - CLI 主入口
  - Commands 系统
  - MCP 配置与连接
  - Chrome MCP shim
  - Computer Use shim
  - 音频与语音
  - 原生图像处理
  - 平台特定模块

#### 9. 在文档中明确平台差异

- 状态：缺失
- 证据：
  - `vendor/modifiers-napi-src/index.ts` 仅支持 macOS
  - `vendor/url-handler-src/index.ts` 仅支持 macOS
  - 若干桌面/系统能力明显依赖平台
- 影响：不同平台的可用性预期容易失真
- 建议动作：
  - 在 README 中加入“已验证平台 / 未验证平台 / 平台受限模块”

#### 10. 固化恢复审计脚本

- 状态：已补基础版本，仍建议继续扩展
- 建议动作：
  - 后续继续扩展脚本覆盖面
  - 可追加更多已知脆弱入口的专项检查

### P2

#### 11. 补 `docs/` 目录

- 状态：缺失
- 影响：目前几乎所有背景信息都挤在 README 中
- 建议动作：
  - 增加架构概览
  - 增加恢复说明
  - 增加 shim 说明
  - 增加已知限制

#### 12. 收敛恢复期说明

- 状态：分散
- 证据：仓库中有大量 fallback / shim / restored 相关描述散落在代码和 README 中
- 影响：信息查找成本高
- 建议动作：
  - 将“恢复期行为差异”集中写到文档
  - 代码中只保留必要的实现级注释

#### 13. 为关键 shim 补边界测试或行为说明

- 状态：缺失
- 影响：shim 的行为很容易在重构时被误改
- 建议动作：
  - 优先给以下模块补测试或契约说明
    - `ant-computer-use-mcp`
    - `ant-computer-use-input`
    - `ant-claude-for-chrome-mcp`

## 已确认的正向结论

- `package.json` 的默认入口已指向 `src/bootstrap-entry.ts`
- `src/bootstrap-entry.ts` 会进入 `src/entrypoints/cli.tsx`
- 仓库存在较完整的 `src/commands/`、`src/services/`、`src/components/`、`src/tools/` 结构
- `shims/` 与 `vendor/` 已被纳入 TypeScript 编译范围
- 本次静态审计未发现仓库内部相对导入缺失

## 建议执行顺序

1. 先补 `LICENSE.md`、恢复缺口文档、原生模块清单。
2. 在有 `bun` 的环境中完成 smoke test，并把结果回写到 README。
3. 增加最小化 CI 和 smoke-check 脚本。
4. 再逐步收敛各类 shim / degraded 模块的真实恢复范围。

## 后续文档建议

如果继续推进，建议再补两份文档：

- `NATIVE_DEPENDENCIES.md`
  - 列出所有 `.node` 依赖、平台、缺失状态、影响范围
- `MODULE_STATUS.md`
  - 以模块维度维护 `working` / `degraded` / `shim-only` / `unknown`
