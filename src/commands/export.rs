use base64::engine::general_purpose::STANDARD;
use base64::Engine;
use std::fs;
use tauri::AppHandle;

/// 将前端传来的 base64 数据落盘为文件（PNG/HTML/PDF 共用）
#[tauri::command]
pub fn save_export(_app: AppHandle, path: String, data_base64: String) -> Result<(), String> {
    let bytes = STANDARD
        .decode(data_base64.trim())
        .map_err(|e| format!("base64 解码失败: {e}"))?;
    fs::write(&path, bytes).map_err(|e| e.to_string())
}
