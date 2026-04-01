# Native Dependencies

本文件记录恢复版仓库中涉及原生二进制的模块、当前快照中的文件状态，以及缺失时会出现的行为退化。

## 审计说明

- 审计时间：2026-04-01
- 审计方式：仓库文件扫描 + 原生包装层源码检查
- 当前限制：未在有 `bun` 的环境中执行运行时验证，因此“状态”表示仓库快照状态，不等于实机可用性验证

## 总表

| Module | Wrapper Source | Expected Binary Location | Snapshot Status | Platform Scope | Missing Impact |
| --- | --- | --- | --- | --- | --- |
| image processor | `vendor/image-processor-src/index.ts` | repository root `image-processor.node` | present | binary compatibility unverified, clipboard exports documented as macOS-oriented | image processing and clipboard-image flows may fail if the binary is incompatible or missing at runtime |
| audio capture | `vendor/audio-capture-src/index.ts` | env path via `AUDIO_CAPTURE_NODE_PATH`, or `vendor/audio-capture/<arch-platform>/audio-capture.node` | missing from snapshot | darwin, linux, win32 wrapper paths exist | voice capture, playback, and microphone auth status fall back or become unavailable |
| modifiers | `vendor/modifiers-napi-src/index.ts` | env path via `MODIFIERS_NODE_PATH`, or `vendor/modifiers-napi/<arch>-darwin/modifiers.node` | missing from snapshot | macOS only | modifier detection returns empty / false and related UX becomes degraded |
| url handler | `vendor/url-handler-src/index.ts` | env path via `URL_HANDLER_NODE_PATH`, or `vendor/url-handler/<arch>-darwin/url-handler.node` | missing from snapshot | macOS only | URL event waiting returns `null`, so related callback / auth flows may not function |

## Detail Notes

### 1. `image-processor.node`

- 当前仓库根目录存在 `image-processor.node`
- 对应包装层：`vendor/image-processor-src/index.ts`
- 风险：
  - 当前审计只确认“文件存在”，没有确认二进制是否与当前平台、Node/Bun ABI、运行路径完全匹配
  - 包装层中提到的 clipboard image 能力是可选导出，且偏向 macOS

### 2. `audio-capture.node`

- 当前仓库中未发现 `audio-capture.node`
- 对应包装层：`vendor/audio-capture-src/index.ts`
- 包装层行为：
  - 优先尝试 `AUDIO_CAPTURE_NODE_PATH`
  - 否则尝试 `vendor/audio-capture/<arch-platform>/audio-capture.node`
- 缺失后表现：
  - `isNativeAudioAvailable()` 为 false
  - 录音、播放、麦克风授权状态等能力进入不可用或降级路径

### 3. `modifiers.node`

- 当前仓库中未发现 `modifiers.node`
- 对应包装层：`vendor/modifiers-napi-src/index.ts`
- 平台限制：
  - 仅 macOS
- 缺失后表现：
  - `getModifiers()` 返回空数组
  - `isModifierPressed()` 返回 false

### 4. `url-handler.node`

- 当前仓库中未发现 `url-handler.node`
- 对应包装层：`vendor/url-handler-src/index.ts`
- 平台限制：
  - 仅 macOS
- 缺失后表现：
  - `waitForUrlEvent()` 返回 `null`
  - 基于 URL callback 的流程可能无法正常完成

## 与 shim 的区别

本文件只记录直接依赖 `.node` 二进制的模块。

以下目录虽然与“原生/桌面能力退化”相关，但更接近兼容层或回退实现，而不是缺失的 `.node` 二进制本身：

- `shims/ant-claude-for-chrome-mcp`
- `shims/ant-computer-use-mcp`
- `shims/ant-computer-use-input`

这些模块应在 `RESTORATION_GAPS.md` 或后续 `MODULE_STATUS.md` 中单独跟踪。
