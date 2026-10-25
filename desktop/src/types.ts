export interface DirNode {
  name: string
  path: string
  is_dir: boolean
  children: DirNode[]
}

export interface FileContent {
  path: string
  name: string
  content: string
  size: number
}

export interface RecentFile {
  path: string
  name: string
  last_opened: number
  size: number
}
