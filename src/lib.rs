mod commands;
mod db;
mod menu;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .setup(|app| {
            db::init_db(app.handle())?;
            menu::setup_menu(app.handle())?;
            Ok(())
        })
        .on_menu_event(|app, event| {
            menu::handle_menu_event(app, event.id().as_ref());
        })
        .invoke_handler(tauri::generate_handler![
            commands::file::open_file,
            commands::file::save_file,
            commands::file::read_dir_tree,
            commands::recents::add_recent,
            commands::recents::list_recents,
            commands::recents::remove_recent,
            commands::export::save_export,
        ])
        .run(tauri::generate_context!())
        .expect("error while running FlashMark");
}
