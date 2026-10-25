// 标题 slug 生成：与 markdown-it-anchor、大纲解析共用，保证锚点一致
export function slugify(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^\w一-龥\- ]/g, '')
    .replace(/\s+/g, '-')
}
