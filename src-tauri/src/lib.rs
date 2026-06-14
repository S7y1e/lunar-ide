mod process_guard;
mod project;
mod terminal;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_shell::init())
        .manage(terminal::TerminalState::default())
        .manage(process_guard::JobGuard::new())
        .manage(project::ProjectStore::default())
        .invoke_handler(tauri::generate_handler![
            terminal::terminal_open,
            terminal::terminal_write,
            terminal::terminal_resize,
            terminal::terminal_close,
            process_guard::assign_to_job,
            project::project_open,
            project::project_close,
            project::project_snapshot,
            project::project_data_model,
            project::dependencies::project_dependencies
        ])
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
