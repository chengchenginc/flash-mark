# FlashMark — Rust + Tauri Markdown 编辑器

> 一款基于 **Rust + Tauri 2** 的轻量、跨平台 Markdown 编辑器。默认单屏写作，可一键切换双屏（编辑 / 预览分栏，中间分割线可左右拖拽拉伸）。内置 KaTeX 公式、Mermaid 图表、ECharts 图表、代码高亮、大纲导航、多标签页，并支持导出 doocs/md 风格图文卡片（PNG）、HTML、PDF。最近文件用 SQLite 持久化，支持单文件 / 文件夹拖入打开，拖入文件夹时左侧自动展示文件目录树。

---

## 一、功能需求清单

| 编号 | 模块 | 需求 | 说明 / 验收标准 |
|------|------|------|----------------|
| F01 | 视图模式 | 默认单屏模式 | 启动即单屏（编辑或预览其一，可切换焦点） |
| F02 | 视图模式 | 支持切换双屏 | 单屏 ⇄ 双屏一键切换；双屏为「编辑器 \| 预览」左右布局 |
| F03 | 视图模式 | 分割线左右拉伸 | 拖拽分割线实时改变左右宽度，比例持久化（下次启动保留） |
| F04 | 编辑核心 | Markdown 编辑 | 实时渲染、语法高亮、行号、快捷键（加粗/标题/列表等） |
| F05 | 渲染 | KaTeX 数学公式 | 行内 `$...$` 与块级 `$$...$$` 公式渲染 |
| F06 | 渲染 | Mermaid 图表 | 代码块 ` ```mermaid ` 渲染为流程图 / 时序图等 |
| F07 | 渲染 | ECharts 图表 | 通过自定义代码块（如 ` ```echarts `）渲染交互式图表 |
| F08 | 渲染 | 代码高亮 | 预览中代码块按语言高亮（highlight.js / Shiki） |
| F09 | 导航 | 大纲导航 | 解析标题生成大纲树，点击跳转、滚动联动高亮 |
| F10 | 标签 | 多标签页 | 同时打开多个文档，标签栏切换；关闭前未保存提示 |
| F11 | 导出 | PNG 图文卡片 | 导出 doocs/md 风格图文卡片（见下文导出规范） |
| F12 | 导出 | HTML | 导出自包含 HTML（内联样式与脚本） |
| F13 | 导出 | PDF | 导出 PDF（**HTML 转 PDF**，非浏览器打印） |
| F14 | 存储 | 最近文件（SQLite） | 记录路径、文件名、最近打开时间，侧边栏「最近」可点击重开 |
| F15 | 打开 | 单文件拖入 | 拖入 `.md` 文件直接打开为新标签 |
| F16 | 打开 | 文件夹拖入 | 拖入文件夹 → 左侧展示该目录文件树（默认过滤 Markdown） |
| F17 | 打开 | 文件目录树 | 文件夹模式下左侧树形浏览，点击文件在右侧标签打开 |
| F18 | 打开 | 非 md 文本文件 | 支持 `.html` / `.csv` / `.txt` / `.js` / `.css` 及 `.java` / `.py` / `.php` / `.rs` / `.bat` / `.sh` 等编程脚本文件打开编辑（完整白名单见 `docs/design-open-nonmd.md`）：编辑按语言高亮；预览 html 走沙箱 iframe、csv 渲染表格、其余代码高亮展示 |

---

## 二、技术方案

### 2.1 技术栈选型

| 层级 | 选型 | 理由 |
|------|------|------|
| 桌面壳 | **Tauri 2.x**（Rust） | 体积小、原生能力（文件/拖放/SQLite/窗口），符合「Rust + Tauri」要求 |
| 前端框架 | **Vue 3 + TypeScript + Vite**（推荐） | 轻量、贴合既有 Vue 技术栈；React 亦可，仅替换前端层 |
| 编辑器内核 | **CodeMirror 6** | 模块化、性能优、Markdown 语法高亮与快捷键成熟 |
| Markdown 解析 | **markdown-it** | 插件生态丰富，便于挂接 KaTeX / Mermaid / ECharts / 高亮 |
| 数学公式 | **KaTeX** + `markdown-it-katex` | 渲染快、无运行时依赖浏览器字体问题 |
| 图表 | **Mermaid** + **ECharts** | 分别覆盖流程图类与数据可视化类需求 |
| 代码高亮 | **highlight.js**（推荐）/ Shiki | 预览侧代码块着色；Shiki 质量更高但体积大 |
| 状态管理 | **Pinia** | 多标签、视图模式、大纲等全局状态 |
| 本地存储 | **SQLite**（Tauri `plugin-sql` 或 Rust `rusqlite`） | 最近文件持久化 |
| 导出 | 前端 `html-to-image`（PNG）+ `window.print()`（PDF）+ DOM 序列化（HTML） | 见 2.4 |

### 2.2 架构分层

```
┌─────────────────────────────────────────────┐
│                Tauri Window                 │
│  ┌───────────────────────────────────────┐  │
│  │           Vue 3 Frontend               │  │
│  │  Toolbar   TabBar   Outline   Tree     │  │
│  │  ┌──────────┬───────┬──────────────┐  │  │
│  │  │ Editor   │Split  │  Preview     │  │  │
│  │  │(CM6)     │(拖拽) │(md-it+插件)  │  │  │
│  │  └──────────┴───────┴──────────────┘  │  │
│  │  lib: markdown.ts / exporter.ts / ... │  │
│  └───────────────────────────────────────┘  │
│         │ Tauri IPC (commands/events)        │
│  ┌──────┴────────────────────────────────┐  │
│  │            Rust Backend                │  │
│  │  commands: file(open/save) · recents   │  │
│  │  dragdrop handler · db(sqlite) · export│  │
│  └────────────────────────────────────────┘  │
└─────────────────────────────────────────────┘
```

- **前端负责**：编辑、渲染、视图布局、分割线交互、大纲、标签、目录树展示、PNG/HTML/PDF 导出。
- **Rust 后端负责**：文件读写、拖放事件解析、SQLite 最近文件读写、导出时的文件落盘与系统对话框。

### 2.3 关键模块实现要点

**F02/F03 视图与分割线**
- 布局组件 `SplitView`：根据 `viewMode`（`single` / `dual`）渲染单/双栏。
- 分割线用 mousedown + mousemove 监听，按比例更新左右 `flex-basis`；比例存 `localStorage` 或 Tauri `store` 插件，启动时恢复。
- 单屏模式可切换「聚焦编辑 / 聚焦预览」两种焦点态。

**F05–F08 渲染管线**
- `markdown-it` 实例统一挂载插件：`katex`、`markdown-it-anchor`（供大纲锚点）、代码高亮。
- Mermaid / ECharts 不走 markdown-it 插件，而用**后置扫描**：渲染完成后遍历 `pre code.language-mermaid` / `language-echarts` 节点，分别调用 `mermaid.render()` 与 `echarts.init()`。好处是不污染解析、便于异步与错误降级。
- 图表节点需 `MutationObserver` 监听内容更新后重渲染，避免重复初始化泄漏。

**F09 大纲导航**
- 解析时收集所有 `h1–h6` 及其 `id`（由 `markdown-it-anchor` 生成），构建层级树。
- 点击大纲项 → `scrollIntoView` 到对应标题；预览滚动时用 `IntersectionObserver` 反向高亮当前章节。

**F10 多标签**
- Pinia `tabs` store 维护 `[{id, path, title, content, dirty}]`。
- 关闭标签前若 `dirty` 为真，弹确认框；标签状态与当前文件内容随编辑实时同步。

**F14 最近文件（SQLite）**
- 表结构见第三节。每次成功 `open` 后 upsert 一条记录，`last_opened = now()`。
- 侧边栏「最近」按 `last_opened DESC` 取前 N 条；点击通过 IPC 重新打开。

**F15–F17 拖放与目录树**
- Tauri 2 监听窗口 `dragDrop` 事件，payload 含拖入的路径数组。
- 若仅一个 `.md` 文件 → 直接打开标签；若含目录 → 调用后端递归读取目录，构建文件树（默认过滤 `.md` / 可选显示全部），左侧 `FileTree` 渲染。
- 树节点点击 → 打开对应文件标签。

### 2.4 导出规范（对齐 doocs/md）

导出目标为 **doocs/md 风格的图文卡片**：即一篇 Markdown 被渲染为带主题样式（标题、正文、代码块、公式、图表）的「卡片」，再转为图片 / HTML / PDF。

| 格式 | 实现路径 | 说明 |
|------|----------|------|
| **PNG** | 前端 `html-to-image`（`toPng`）对渲染后的卡片 DOM 截图 | 可选主题（亮/暗）、宽度；大文档分页或多图输出 |
| **HTML** | 序列化卡片 DOM + 内联 CSS + KaTeX/Mermaid 运行时 | 自包含单文件，可脱离本 App 打开 |
| **PDF** | **HTML 转 PDF**（不使用 `window.print()`）：前端拼出自包含 HTML 文档字符串 → 转 PDF | 见下方「PDF 导出实现路径」 |

> 导出内容与 doocs/md 保持一致的主题观感（圆角卡片、柔和分隔、代码块配色），但渲染引擎为本 App 内置管线，不依赖 doocs/md 在线服务。

**PDF 导出实现路径（HTML → PDF，不使用 `window.print()`）**

生成思路：先把 Markdown 渲染为**自包含 HTML 文档字符串**（内联 CSS + KaTeX/Mermaid 已转静态 SVG/节点 + ECharts 转静态图），再将这份 HTML 转为 PDF。候选方案：

| 方案 | 实现 | 优点 | 缺点 |
|------|------|------|------|
| A. 前端 `html2pdf.js`（jsPDF + html2canvas） | 前端直接把 HTML 节点/字符串转 PDF | 零后端依赖、无需额外二进制、实现最快 | 栅格化（文字不可选中）、大文档体积偏大 |
| B. Rust 后端 `headless_chrome` 驱动 Chromium，调 CDP `Page.printToPDF` | 前端传 HTML 字符串 → Rust 命令生成 PDF | 矢量文字可选中、CSS  fidelity 最高 | 需本机有 Chrome/Chromium；Tauri 自带 WebView2 非独立二进制，需另行分发或检测 |
| C. 后端 `wkhtmltopdf` 二进制 | Rust 命令调用已打包的 `wkhtmltopdf` | CSS 还原好、成熟 | 需随包分发二进制，跨平台体积与维护成本 |

**已确定采用方案 A（`html2pdf.js`）**：零依赖、最快可用，作为 PDF 导出的默认实现。若后续要求矢量文字可选中 / 精确分页，再升级到方案 B（后端 headless Chromium）。方案 C 因需分发二进制，优先级最低。

### 2.5 SQLite 数据模型

```sql
CREATE TABLE IF NOT EXISTS recent_files (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    path        TEXT NOT NULL UNIQUE,   -- 文件绝对路径
    name        TEXT NOT NULL,          -- 文件名（含扩展名）
    last_opened INTEGER NOT NULL,       -- Unix 时间戳（秒）
    size        INTEGER DEFAULT 0       -- 文件大小，可选
);

-- 打开文件时 upsert
INSERT INTO recent_files (path, name, last_opened, size)
VALUES (?, ?, ?, ?)
ON CONFLICT(path) DO UPDATE SET
    name = excluded.name,
    last_opened = excluded.last_opened,
    size = excluded.size;

-- 取最近 20 条
SELECT * FROM recent_files ORDER BY last_opened DESC LIMIT 20;
```

---

## 三、目录结构（规划）

```
flash-mark/
├── src/                      # Rust 后端
│   ├── main.rs
│   ├── lib.rs                # 注册 Tauri 命令/插件
│   ├── commands/
│   │   ├── file.rs           # 打开/保存/读取
│   │   ├── recents.rs        # SQLite 最近文件
│   │   └── export.rs         # 导出落盘 + 系统对话框
│   ├── db.rs                 # SQLite 初始化
│   └── dragdrop.rs           # 拖放事件解析
├── src-tauri/                # Tauri 配置
│   ├── Cargo.toml
│   ├── tauri.conf.json
│   ├── build.rs
│   └── icons/
├── desktop/                 # Vue 3 前端
│   ├── src/
│   │   ├── main.ts
│   │   ├── App.vue
│   │   ├── components/
│   │   │   ├── Toolbar.vue
│   │   │   ├── TabBar.vue
│   │   │   ├── SplitView.vue     # 单/双屏 + 分割线
│   │   │   ├── EditorPane.vue    # CodeMirror 6
│   │   │   ├── PreviewPane.vue   # markdown-it 渲染
│   │   │   ├── Outline.vue       # 大纲导航
│   │   │   └── FileTree.vue      # 文件夹目录树
│   │   ├── composables/
│   │   │   ├── useSplitter.ts
│   │   │   ├── useTabs.ts
│   │   │   └── useDragDrop.ts
│   │   ├── lib/
│   │   │   ├── markdown.ts       # markdown-it + 插件
│   │   │   ├── charts.ts         # Mermaid / ECharts 后置渲染
│   │   │   └── exporter.ts       # PNG / HTML / PDF
│   │   └── stores/               # Pinia
│   ├── package.json
│   └── vite.config.ts
├── docs/                     # 设计文档 / ADR（文档驱动开发）
├── AGENTS.md
├── readme.md
└── package.json
```

---

## 四、开发与构建

```bash
# 安装依赖（前端）
cd desktop && npm install

# 开发模式（Tauri 热重载 + Vite）
npm run tauri dev

# 生产构建
npm run tauri build
```

> 需先安装 Rust 工具链与 Tauri 2 的系统依赖（WebView2 / 对应平台构建工具）。

---

## 五、开发阶段规划

| 阶段 | 范围 | 交付验证 |
|------|------|----------|
| P0 骨架 | Tauri 2 + Vue 3 工程搭建，单屏编辑 + 实时预览打通 | 能打开 App、输入 Markdown 实时渲染 |
| P1 视图 | 单/双屏切换 + 可拖拽分割线 + 比例持久化 | 切换正常、拖拽流畅、重启后比例保留 |
| P2 渲染 | KaTeX / Mermaid / ECharts / 代码高亮接入 | 四类内容正确渲染、错误优雅降级 |
| P3 导航 | 大纲树 + 滚动联动；多标签页 + 未保存提示 | 点击跳转、滚动高亮、多标签切换 |
| P4 打开 | 文件/文件夹拖放 + SQLite 最近文件 + 目录树 | 拖入单文件/文件夹均正确打开与展示 |
| P5 导出 | PNG / HTML / PDF（doocs/md 风格卡片） | 三种格式导出可用、样式一致 |
| P6 打磨 | 主题、快捷键、性能（大文档）、异常提示 | 体感与稳定性达标 |

---

## 六、待确认 / 开放问题

1. **前端框架**：默认按 Vue 3 推荐，是否改用 React？
2. **代码高亮**：highlight.js（轻、够用）还是 Shiki（质量高、体积大）？
3. **目录树范围**：文件夹模式下默认只显示 Markdown，还是展示全部文件（含子目录非 md 文件灰显）？
4. **PNG 大文档**：超长文档导出为单张长图，还是按标题分页多张？
5. **配置持久化**：分割比例、主题、最近文件上限等，用 Tauri `store` 插件还是 SQLite 统一管理？

> 以上问题确认后，将更新 `docs/` 下对应设计文档（ADR）并进入编码阶段（遵循项目「文档驱动开发」规范）。其中 PDF 导出已确定采用方案 A（前端 `html2pdf.js`，HTML 转 PDF，不使用 `window.print()`），待后续有矢量文字需求时再评估方案 B。
