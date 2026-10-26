/**
 * 文件类型判定：按文件名（扩展名）推导文件种类，
 * 供打开校验、编辑器语言切换、预览渲染分支共用。
 */

/** 文件种类：markdown 沿用原渲染管线；html 走沙箱 iframe；csv 渲染表格；plain 代码高亮展示 */
export type FileKind = 'markdown' | 'html' | 'csv' | 'plain'

/**
 * 允许打开的扩展名白名单（小写）。
 * 覆盖：Markdown / Web / 数据交换 / 配置 / 常见编程与脚本语言 / 日志。
 */
const SUPPORTED_EXTS = [
  // 文档与文本
  'md', 'markdown', 'txt', 'log',
  // Web
  'html', 'htm', 'css', 'js', 'mjs', 'cjs', 'ts', 'tsx', 'jsx', 'php',
  // 数据与配置
  'csv', 'json', 'xml', 'ini', 'conf', 'toml', 'yml', 'yaml',
  // 编程语言
  'java', 'py', 'rs', 'go', 'c', 'cc', 'cpp', 'h', 'hpp', 'cs', 'rb', 'kt', 'swift', 'sql',
  // 脚本
  'sh', 'bash', 'zsh', 'bat', 'cmd', 'ps1', 'lua', 'pl',
]

/** 取文件名的小写扩展名（无扩展名返回空串） */
export function extOf(name: string): string {
  const i = name.lastIndexOf('.')
  return i >= 0 ? name.slice(i + 1).toLowerCase() : ''
}

/** 是否为支持打开的文件类型 */
export function isSupportedFile(name: string): boolean {
  return SUPPORTED_EXTS.includes(extOf(name))
}

/** 按文件名推导文件种类 */
export function fileKindOf(name: string): FileKind {
  const ext = extOf(name)
  if (ext === 'md' || ext === 'markdown') return 'markdown'
  if (ext === 'html' || ext === 'htm') return 'html'
  if (ext === 'csv') return 'csv'
  return 'plain'
}

/**
 * 简易 CSV 解析：状态机逐字符扫描，
 * 支持引号包裹字段、双引号转义（"" → "）与 \r\n 换行，不引入第三方依赖。
 */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let inQuotes = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        field += c
      }
    } else if (c === '"') {
      inQuotes = true
    } else if (c === ',') {
      row.push(field)
      field = ''
    } else if (c === '\n' || c === '\r') {
      // \r\n 视为单个换行
      if (c === '\r' && text[i + 1] === '\n') i++
      row.push(field)
      field = ''
      rows.push(row)
      row = []
    } else {
      field += c
    }
  }
  // 末尾无换行的最后一个字段
  if (field !== '' || row.length) {
    row.push(field)
    rows.push(row)
  }
  return rows
}
