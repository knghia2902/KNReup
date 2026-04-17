// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

use tauri::Emitter;

#[tauri::command]
fn evaluate_javascript(window: tauri::WebviewWindow, script: String) -> Result<(), String> {
    window.eval(&script).map_err(|e: tauri::Error| e.to_string())
}

#[tauri::command]
async fn get_webview_cookies(window: tauri::WebviewWindow) -> Result<String, String> {
    let cookies = window.cookies().map_err(|e| e.to_string())?;
    let cookie_strings: Vec<String> = cookies
        .into_iter()
        .map(|c| format!("{}={}", c.name(), c.value()))
        .collect();
    Ok(cookie_strings.join("; "))
}

#[tauri::command]
fn sync_captured_cookie(app: tauri::AppHandle, cookie: String) -> Result<(), String> {
    app.emit("douyin-cookie-captured", cookie).map_err(|e: tauri::Error| e.to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            greet, 
            evaluate_javascript, 
            get_webview_cookies,
            sync_captured_cookie
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
