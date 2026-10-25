use rusqlite::Connection;
use tauri::Manager;


/// 返回 SQLite 数据库文件路径（应用数据目录下 flashmark.db）
pub fn db_path(app: &tauri::AppHandle) -> std::path::PathBuf {
    let dir = app
        .path()
        .app_data_dir()
        .expect("无法获取应用数据目录");
    std::fs::create_dir_all(&dir).ok();
    dir.join("flashmark.db")
}

/// 初始化数据库与最近文件表
pub fn init_db(app: &tauri::AppHandle) -> Result<(), Box<dyn std::error::Error>> {
    let conn = Connection::open(db_path(app))?;
    conn.execute(
        "CREATE TABLE IF NOT EXISTS recent_files (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            path        TEXT NOT NULL UNIQUE,
            name        TEXT NOT NULL,
            last_opened INTEGER NOT NULL,
            size        INTEGER DEFAULT 0
        )",
        [],
    )?;
    Ok(())
}

/// 获取一个数据库连接
pub fn get_conn(app: &tauri::AppHandle) -> Result<Connection, Box<dyn std::error::Error>> {
    Ok(Connection::open(db_path(app))?)
}
