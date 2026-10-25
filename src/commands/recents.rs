use crate::db;
use serde::Serialize;
use tauri::AppHandle;

#[derive(Serialize)]
pub struct RecentFile {
    pub path: String,
    pub name: String,
    pub last_opened: i64,
    pub size: i64,
}

fn now_secs() -> i64 {
    use std::time::{SystemTime, UNIX_EPOCH};
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_secs() as i64)
        .unwrap_or(0)
}

/// 写入/更新最近文件记录（按 path 去重）
#[tauri::command]
pub fn add_recent(
    app: AppHandle,
    path: String,
    name: String,
    size: i64,
) -> Result<(), String> {
    let conn = db::get_conn(&app).map_err(|e| e.to_string())?;
    conn.execute(
        "INSERT INTO recent_files (path, name, last_opened, size) VALUES (?1, ?2, ?3, ?4)
         ON CONFLICT(path) DO UPDATE SET
            name = excluded.name,
            last_opened = excluded.last_opened,
            size = excluded.size",
        rusqlite::params![path, name, now_secs(), size],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

/// 列出最近文件（按最近打开时间倒序）
#[tauri::command]
pub fn list_recents(app: AppHandle, limit: i64) -> Result<Vec<RecentFile>, String> {
    let conn = db::get_conn(&app).map_err(|e| e.to_string())?;
    let mut stmt = conn
        .prepare(
            "SELECT path, name, last_opened, size FROM recent_files
             ORDER BY last_opened DESC LIMIT ?",
        )
        .map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map(rusqlite::params![limit], |row| {
            Ok(RecentFile {
                path: row.get(0)?,
                name: row.get(1)?,
                last_opened: row.get(2)?,
                size: row.get(3)?,
            })
        })
        .map_err(|e| e.to_string())?;
    let mut out = Vec::new();
    for r in rows {
        out.push(r.map_err(|e| e.to_string())?);
    }
    Ok(out)
}

/// 删除一条最近文件记录
#[tauri::command]
pub fn remove_recent(app: AppHandle, path: String) -> Result<(), String> {
    let conn = db::get_conn(&app).map_err(|e| e.to_string())?;
    conn.execute("DELETE FROM recent_files WHERE path = ?1", rusqlite::params![path])
        .map_err(|e| e.to_string())?;
    Ok(())
}
