//! 应用原生菜单栏（Tauri 2 tauri::menu）。
//!
//! 菜单项点击统一转发为前端事件 `menu://action`，payload 为 action id
//! （如 `new_file` / `open_file`），由前端 `App.vue` 监听分发。

use tauri::{
    menu::{Menu, MenuItem, PredefinedMenuItem, Submenu},
    Emitter, Manager, Runtime,
};

/// 构建并挂载应用菜单栏（在 setup 阶段调用）。
pub fn setup_menu<R: Runtime>(app: &tauri::AppHandle<R>) -> tauri::Result<()> {
    let Some(window) = app.get_webview_window("main") else {
        return Ok(());
    };

    // ---- 文件菜单 ----
    let new_file = MenuItem::with_id(app, "new_file", "新建", true, Some("CmdOrCtrl+N"))?;
    let open_file = MenuItem::with_id(app, "open_file", "打开文件…", true, Some("CmdOrCtrl+O"))?;
    let open_folder = MenuItem::with_id(
        app,
        "open_folder",
        "打开文件夹…",
        true,
        Some("CmdOrCtrl+Shift+O"),
    )?;
    let save = MenuItem::with_id(app, "save", "保存", true, Some("CmdOrCtrl+S"))?;
    let sep1 = PredefinedMenuItem::separator(app)?;
    let sep2 = PredefinedMenuItem::separator(app)?;
    let quit = PredefinedMenuItem::quit(app, Some("退出"))?;

    let file_menu = Submenu::with_items(
        app,
        "文件",
        true,
        &[&new_file, &open_file, &open_folder, &sep1, &save, &sep2, &quit],
    )?;

    // ---- 导出菜单（已移除：导出入口在预览右上角悬浮按钮） ----
    let menu = Menu::with_items(app, &[&file_menu])?;
    window.set_menu(menu)?;
    Ok(())
}

/// 菜单事件 → 前端事件桥（在 Builder::on_menu_event 中调用）。
pub fn handle_menu_event<R: Runtime>(app: &tauri::AppHandle<R>, action: &str) {
    let _ = app.emit("menu://action", action);
}
