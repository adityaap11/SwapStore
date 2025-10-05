// src-tauri/src/main.rs
use std::sync::Mutex;
use tauri::State;

mod kv_store;
mod algorithms;

use kv_store::memory_manager::MemoryManager;

#[tauri::command]
fn put_value(
    key: String,
    value: String,
    state: State<'_, Mutex<MemoryManager>>,
) -> Result<(), String> {
    let mut manager = state.lock().unwrap();
    manager.put(key, value.into_bytes()).map_err(|e| e.to_string())
}

#[tauri::command]
fn get_value(key: String, state: State<'_, Mutex<MemoryManager>>) -> Result<Option<String>, String> {
    let mut manager = state.lock().unwrap();
    match manager.get(&key) {
        Ok(Some(value)) => Ok(Some(String::from_utf8_lossy(&value).to_string())),
        Ok(None) => Ok(None),
        Err(e) => Err(e.to_string()),
    }
}

#[tauri::command]
fn get_memory_status(state: State<'_, Mutex<MemoryManager>>) -> Result<serde_json::Value, String> {
    let manager = state.lock().unwrap();
    let status = manager.get_status();
    
    // Calculate hit rate
    let hit_rate = if status.total_operations > 0 {
        ((status.total_operations - status.page_faults) as f64 / status.total_operations as f64) * 100.0
    } else {
        0.0
    };
    
    let response = serde_json::json!({
        "total_operations": status.total_operations,
        "page_faults": status.page_faults,
        "hit_rate": hit_rate,
        "primary_used": status.primary_used,
        "secondary_used": status.secondary_used,
        "primary_capacity": status.primary_capacity,
        "primary_pages": status.primary_pages,
        "secondary_pages": status.secondary_pages
    });
    
    Ok(response)
}

#[tauri::command]
fn clear_memory(state: State<'_, Mutex<MemoryManager>>) -> Result<(), String> {
    let mut manager = state.lock().unwrap();
    manager.clear();
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(Mutex::new(MemoryManager::new()))
        .invoke_handler(tauri::generate_handler![
            put_value,
            get_value,
            get_memory_status,
            clear_memory
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[cfg(not(mobile))]
fn main() {
    run();
}
