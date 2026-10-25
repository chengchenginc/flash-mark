use crate::db;
use serde::Serialize;
use std::fs;
use std::path::Path;
use tauri::AppHandle;

#[derive(Serialize)]
pub struct FileContent {
    pub path: String,
    pub name: String,
    pub content: String,
    pub size: u64,
}

#[derive(Serialize)]
pub struct DirNode {
    pub name: String,
    pub path: String,
    pub is_dir: bool,
    pub children: Vec<DirNode>,
}

/// 打开文件，返回路径、文件名、内容与大小
#[tauri::command]
pub fn open_file(path: String) -> Result<FileContent, String> {
    let meta = fs::metadata(&path).map_err(|e| e.to_string())?;
    let content = fs::read_to_string(&path).map_err(|e| e.to_string())?;
    let name = Path::new(&path)
        .file_name()
        .map(|s| s.to_string_lossy().to_string())
        .unwrap_or_else(|| path.clone());
    Ok(FileContent {
        path,
        name,
        content,
        size: meta.len(),
    })
}

/// 保存文件内容
#[tauri::command]
pub fn save_file(path: String, content: String) -> Result<(), String> {
    fs::write(&path, content).map_err(|e| e.to_string())
}

/// 递归读取目录，构建文件树
#[tauri::command]
pub fn read_dir_tree(path: String) -> Result<DirNode, String> {
    build_tree(&path)
}

fn build_tree(path: &str) -> Result<DirNode, String> {
    let p = Path::new(path);
    let name = p
        .file_name()
        .map(|s| s.to_string_lossy().to_string())
        .unwrap_or_else(|| path.to_string());
    let is_dir = p.is_dir();
    let mut children = Vec::new();
    if is_dir {
        if let Ok(entries) = fs::read_dir(p) {
            for entry in entries.flatten() {
                let child_str = entry.path().to_string_lossy().to_string();
                if let Ok(node) = build_tree(&child_str) {
                    children.push(node);
                }
            }
            // 目录优先，再按名称排序（不区分大小写）
            children.sort_by(|a, b| {
                if a.is_dir != b.is_dir {
                    b.is_dir.cmp(&a.is_dir)
                } else {
                    a.name.to_lowercase().cmp(&b.name.to_lowercase())
                }
            });
        }
    }
    Ok(DirNode {
        name,
        path: path.to_string(),
        is_dir,
        children,
    })
}

// 仅用于消除未使用导入告警（read_dir_tree 已使用 db，保持模块一致）
#[allow(dead_code)]
fn _touch(app: &AppHandle) -> Result<(), String> {
    db::get_conn(app).map(|_| ()).map_err(|e| e.to_string())
}
