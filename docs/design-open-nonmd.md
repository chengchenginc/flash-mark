# 设计文档：支持打开非 Markdown 文本文件

> 日期：2026-10-26 ｜ 状态：已实现 ｜ 关联：readme F18

## 1. 变更背景

此前 FlashMark 仅支持打开 `.md` / `.markdown` 文件（打开对话框 filters、文件树默认过滤均只放行 Markdown）。需求：新增支持打开 **`.html`、`.csv`、`.txt`、`.js`、`.css`** 等文本文件；追加需求扩展至 **`.java`、`.py`、`.php`、`.rs`、`.bat`、`.sh`** 等常见编程/脚本语言。

## 1.1 支持的扩展名（白名单，`lib/fileKind.ts`）

- 文档与文本：`md` `markdown` `txt` `log`
- Web：`html` `htm` `css` `js` `mjs` `cjs` `ts` `tsx` `jsx` `php`
- 数据与配置：`csv` `json` `xml` `ini` `conf` `toml` `yml` `yaml`
- 编程语言：`java` `py` `rs` `go` `c` `cc` `cpp` `h` `hpp` `cs` `rb` `kt` `swift` `sql`
- 脚本：`sh` `bash` `zsh` `bat` `cmd` `ps1` `lua` `pl`

## 2. 影响范围

Rust 后端 `open_file` 命令是通用的（不校验扩展名，已支持 BOM/UTF-8/GBK 解码），**本次改动全部在前端（desktop/）**，后端无需变更。

## 3. 技术方案

### 3.1 文件类型判定（新增 `lib/fileKind.ts`）

- `extOf(name)`：取小写扩展名。
- `isSupportedFile(name)`：白名单 `md / markdown / html / htm / csv / txt / js / css`。
- `fileKindOf(name)` → `FileKind`：
  - `markdown`：md / markdown（沿用现有渲染管线）
  - `html`：html / htm（iframe sandbox 实时预览）
  - `csv`：csv（解析为表格预览）
  - `plain`：txt / js / css（代码高亮只读预览，语言按扩展名映射）
- `parseCsv(text)`：内置状态机解析（支持引号包裹、`""` 转义、`\r\n`），不引入第三方依赖。

### 3.2 打开入口（三处统一）

| 入口 | 改动 |
|------|------|
| 打开对话框（`actions.ts openFile`） | filters 增加第二组「Text / Web」扩展 |
| 拖放（`useDragDrop.ts`） | 无需改动，统一走 `loadFile` 的校验 |
| 文件树（`FileTree.vue`） | 默认过滤从「仅 md」改为 `isSupportedFile`；「显示全部文件」开关行为不变 |

`loadFile` 中增加白名单校验：不支持的扩展名 toast 提示「暂不支持打开该类型文件」，避免拖入二进制文件后乱码打开。最近文件（RecentsPanel）只包含已保存过的文件，不加校验。

### 3.3 编辑器（`EditorPane.vue`）

用 CodeMirror `Compartment` 按活动标签扩展名切换语言模式：`markdown()`（现有）、`html()`、`css()`、`javascript()`（含 ts/tsx/jsx 变体）、`python()`、`java()`、`php()`、`rust()`、`cpp()`（覆盖 c/cc/cpp/h/hpp）、`StreamLanguage(shell)`（sh/bash/zsh）、`StreamLanguage(powershell)`（ps1）；无语法包的扩展名（txt/csv/json/bat 等）走纯文本。需新增依赖 `@codemirror/lang-html`、`@codemirror/lang-css`、`@codemirror/lang-javascript`、`@codemirror/lang-python`、`@codemirror/lang-java`、`@codemirror/lang-php`、`@codemirror/lang-rust`、`@codemirror/lang-cpp`、`@codemirror/legacy-modes`、`@codemirror/language`。

### 3.4 预览（`PreviewPane.vue`）

按 `fileKindOf` 分支渲染，导出 FAB（PNG/HTML/PDF）仅在 `markdown` 类型显示：

| 类型 | 渲染方式 |
|------|----------|
| markdown | 现有 markdown-it 管线，不变 |
| html | `<iframe sandbox="allow-scripts allow-modals allow-forms" :srcdoc="content">` 实时预览。**不授予 `allow-same-origin`**，iframe 保持 opaque origin，无法访问父窗口 DOM / localStorage / cookie，防止本地 HTML 脚本越权 |
| csv | `parseCsv` → 表格；首行不特殊处理（不加表头样式，按数据行渲染） |
| plain | `<pre><code>` + highlight.js，语言按扩展名映射（java/py/php/rs/go/c/cpp/cs/rb/kt/swift/sql/json/xml/yaml/toml/ini/bat(dos)/sh(bash)/ps1/lua/perl 等，未覆盖的退化为纯文本），代码预览侧仅展示 |

### 3.5 保存

`saveActive`：已有路径的标签直接写盘，行为不变；无路径（未命名 md）的保存对话框 filters 同步补上五类扩展，防止改名后缀保存时被对话框过滤。

## 4. 测试重点

1. 拖入 / 对话框打开 / 文件树点击三类入口均能打开 html / csv / txt / js / css。
2. 预览侧：html 沙箱渲染且无脚本报错越权、csv 表格与引号转义正确、js/css 语法高亮、txt 纯文本。
3. 编辑侧语法高亮随标签切换正确重配置（md ↔ html ↔ js 来回切）。
4. 非 md 文件可编辑、保存、写最近文件并从「最近」重开。
5. 拖入不支持类型（如 .png/.exe）toast 拒绝，不产生乱码标签。

## 5. 回滚预案

改动集中在前端 5 个文件 + 1 个新增模块，revert 提交即可恢复；无数据迁移。
