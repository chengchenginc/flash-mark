# FlashMark 架构设计文档

> 版本：0.1.0 ｜ 状态：实施中 ｜ 更新：2026-10-24

## 1. 系统总览

FlashMark 是一款基于 **Rust + Tauri 2** 的跨平台 Markdown 编辑器。核心设计原则：

- **前端（Vue 3）负责一切 UI 与渲染**：编辑器、预览、视图布局、分割线、大纲、标签、目录树、导出。
- **Rust 后端（Tauri）负责系统能力**：文件读写、拖放事件解析、SQLite 最近文件、导出落盘与系统对话框。
- **前后端通过 Tauri IPC（commands / events）通信**，不直接共享内存。

```
┌──────────────────────────────────────────────┐
│                Tauri Window                  │
│  ┌────────────────────────────────────────┐  │
│  │           Vue 3 Frontend (desktop/)     │  │
│  │  Toolbar  TabBar  Outline  Sidebar     │  │
│  │  ┌─────────┬────────┬───────────────┐  │  │
│  │  │ Editor  │ Split  │   Preview     │  │  │
│  │  │ (CM6)   │(拖拽)  │ (md-it+插件)  │  │  │
│  │  └─────────┴────────┴───────────────┘  │  │
│  │  lib: markdown.ts / charts.ts / exporter│  │
│  └────────────────────────────────────────┘  │
│            ↕ Tauri IPC (commands/events)       │
│  ┌────────────────────────────────────────┐  │
│  │            Rust Backend (src/)          │  │
│  │  commands: file · recents · export     │  │
│  │  db(rslite) · dragdrop(frontend event) │  │
│  └────────────────────────────────────────┘  │
└──────────────────────────────────────────────┘
```

## 2. 目录结构

```
flash-mark/
├── src/                      # Rust 后端
│   ├── main.rs               # 入口，调用 lib::run()
│   ├── lib.rs                # Tauri Builder 装配 + 命令注册
│   ├── db.rs                 # SQLite 初始化与连接
│   └── commands/
│       ├── mod.rs
│       ├── file.rs           # 打开/保存/读取目录树
│       ├── recents.rs        # 最近文件 CRUD
│       └── export.rs         # 导出二进制落盘
├── src-tauri/                # Tauri 配置
│   ├── Cargo.toml
│   ├── tauri.conf.json
│   ├── build.rs
│   └── capabilities/default.json
├── desktop/                  # Vue 3 前端（原 frontend/）
│   ├── index.html
│   ├── package.json
│   ├── vite.config.ts
│   ├── tsconfig.json
│   └── src/
│       ├── main.ts
│       ├── App.vue
│       ├── styles/main.css
│       ├── lib/              # markdown.ts / charts.ts / exporter.ts / outline.ts
│       ├── stores/           # Pinia: app / tabs / recents
│       ├── composables/      # useSplitter / useDragDrop / useRecents
│       └── components/       # Toolbar/TabBar/SplitView/EditorPane/
│                            # PreviewPane/Outline/FileTree/Sidebar/RecentsPanel
├── docs/                     # 设计文档 / ADR
├── AGENTS.md
└── readme.md
```

## 3. 渲染管线

Markdown → HTML 由 `markdown-it` 完成，挂载插件：

| 插件 | 作用 |
|------|------|
| `katex`（内联插件） | 行内 `$...$` 与块级 `$$...$$` 公式 |
| `markdown-it-anchor` | 标题生成 `id`（自定义 slugify，供大纲锚点） |
| `highlight.js` | 代码块按语言高亮 |

**图表后置扫描**（避免污染解析、便于异步与错误降级）：

渲染完成后遍历容器中的 `pre code.language-mermaid` 与 `pre code.language-echarts`：

- Mermaid：`mermaid.render()` → 替换为 SVG 节点。
- ECharts：`JSON.parse` 代码块内容为 option → `echarts.init()` 渲染 → 替换为图表容器。

二者均用 `try/catch` 包裹，失败则保留原始文本，不影响其余渲染。

## 4. 视图与分割线

- `viewMode`：`single`（单屏）｜ `dual`（双屏）。单屏可切换「聚焦编辑 / 聚焦预览」焦点态。
- `SplitView` 组件根据 `viewMode` 渲染单/双栏；双屏下中间分割线监听 `mousedown/mousemove` 调整左右 `flex-basis` 比例。
- 比例、视图模式、主题存入 **Tauri store 插件**（`app_config.json`），启动时恢复。

## 5. 数据模型（SQLite）

仅用于「最近文件」，表结构见 `docs/DATA-MODEL.md`（与 readme.md 第二节一致）。其余配置（视图、比例、主题）走 Tauri store，不混入 SQLite，职责分离。

## 6. 导出（doocs/md 风格图文卡片）

| 格式 | 实现 |
|------|------|
| PNG | 前端 `html-to-image` 对卡片 DOM 截图（pixelRatio=2） |
| HTML | 序列化卡片 DOM + 内联样式为自包含单文件 |
| PDF | **HTML 转 PDF**：前端拼自包含 HTML → `html2pdf.js` 生成（不使用 `window.print()`） |

导出流程：预览内容 → 包装为 `.export-card` 卡片（圆角、柔和分隔、代码块配色）→ 图表静态化 → 经 Tauri 对话框选路径 → `save_export` 命令写盘（base64 解码落盘）。

## 7. 拖放与目录树

- 窗口启用 `dragDropEnabled`，前端监听 `getCurrentWebview().onDragDropEvent`。
- 拖入单个支持文件（Markdown / Web / 数据配置 / 常见编程脚本语言，完整白名单见 `docs/design-open-nonmd.md`）→ 直接打开为新标签，其他类型 toast 拒绝。
- 拖入文件夹（或含目录的路径数组）→ 调 `read_dir_tree` 递归读取 → 左侧 `FileTree` 渲染（默认仅显示支持类型，可切换显示全部）。
- 树节点点击 → 打开对应文件标签 + 写入最近文件。
- 非 md 类型的预览分支见 `docs/design-open-nonmd.md`（html → 沙箱 iframe，csv → 表格，txt/js/css → 代码高亮）。
