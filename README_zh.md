# Jina Reader 油猴脚本

通过 `r.jina.ai` 将当前网页转换为适合 LLM 的 Markdown，提供快捷键与菜单配置。

## 功能特性

- 一键转换（默认快捷键：`Alt+J`）
- 可选 API Key（更高频率额度）
- 动态页面等待（`x-wait-for-selector`）
- 内容选择器过滤（`x-target-selector`）
- 缓存控制（`x-no-cache`、`x-cache-tolerance`）
- 自动复制到剪贴板
- 结果新标签页打开

## 安装方式

1. 安装 Tampermonkey。
2. 打开油猴 → 控制面板 → 新建脚本。
3. 将 `jina-reader.user.js` 的内容粘贴进去。
4. 保存即可使用。

## 使用方法

- 在任意网页按 `Alt+J`。
- 或在 Tampermonkey 菜单中选择 **Jina Reader: Convert page now**。
- 点击后会弹出提示：正在获取内容（约 10 秒），避免误以为未触发。

## 配置说明

在 Tampermonkey 菜单中可配置：

- API Key
- `respondWith`：`markdown` / `html` / `text` / `screenshot`
- `waitForSelector`
- `targetSelector`
- `cacheToleranceSeconds`
- `noCache`
- `openInNewTab`
- `autoCopy`
- hotkey

配置通过 Tampermonkey 存储持久化。

## 注意事项

- 需要登录或付费的页面可能无法获取。
- 高度动态的 SPA 页面可配置 `waitForSelector`。
- 请求失败会在页面前台弹窗提示错误与状态码。

## 致谢

- Jina Reader: `https://github.com/jina-ai/reader`

## License

MIT
