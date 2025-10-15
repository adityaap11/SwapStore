use std::sync::Mutex;
use tauri::State;

mod kv_store;
mod algorithms;
mod process_manager;

use kv_store::memory_manager::MemoryManager;
use process_manager::ProcessManager;

#[tauri::command]
fn put_value(
    key: String,
    value: String,
    state: State<'_, Mutex<MemoryManager>>,
    process_state: State<'_, Mutex<ProcessManager>>,
) -> Result<(), String> {
    let mut manager = state.lock().unwrap();
    let result = manager.put(key, value.into_bytes()).map_err(|e| e.to_string());
    
    // Simulate process activity
    let mut process_manager = process_state.lock().unwrap();
    process_manager.simulate_activity();
    
    result
}

#[tauri::command]
fn get_value(
    key: String,
    state: State<'_, Mutex<MemoryManager>>,
    process_state: State<'_, Mutex<ProcessManager>>,
) -> Result<Option<String>, String> {
    let mut manager = state.lock().unwrap();
    let result = match manager.get(&key) {
        Ok(Some(value)) => Ok(Some(String::from_utf8_lossy(&value).to_string())),
        Ok(None) => Ok(None),
        Err(e) => Err(e.to_string()),
    };
    
    // Simulate process activity
    let mut process_manager = process_state.lock().unwrap();
    process_manager.simulate_activity();
    
    result
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
fn clear_memory(
    state: State<'_, Mutex<MemoryManager>>,
    process_state: State<'_, Mutex<ProcessManager>>,
) -> Result<(), String> {
    let mut manager = state.lock().unwrap();
    manager.clear();
    
    // Reset process manager as well
    let mut process_manager = process_state.lock().unwrap();
    *process_manager = ProcessManager::new();
    
    Ok(())
}

// PROCESS TRACKING COMMANDS

#[tauri::command]
fn get_process_list(state: State<'_, Mutex<ProcessManager>>) -> Result<Vec<process_manager::Process>, String> {
    let process_manager = state.lock().unwrap();
    Ok(process_manager.get_all_processes())
}

#[tauri::command]
fn create_new_process(
    name: String,
    memory_usage: u64,
    priority: u8,
    state: State<'_, Mutex<ProcessManager>>,
) -> Result<u32, String> {
    let mut process_manager = state.lock().unwrap();
    let pid = process_manager.create_process(name, memory_usage, priority);
    Ok(pid)
}

#[tauri::command]
fn swap_out_process(
    pid: u32,
    swap_size: u64,
    state: State<'_, Mutex<ProcessManager>>,
) -> Result<(), String> {
    let mut process_manager = state.lock().unwrap();
    process_manager.swap_out_process(pid, swap_size);
    Ok(())
}

#[tauri::command]
fn swap_in_process(
    pid: u32,
    state: State<'_, Mutex<ProcessManager>>,
) -> Result<(), String> {
    let mut process_manager = state.lock().unwrap();
    process_manager.swap_in_process(pid);
    Ok(())
}

#[tauri::command]
fn remove_process(
    pid: u32,
    state: State<'_, Mutex<ProcessManager>>,
) -> Result<(), String> {
    let mut process_manager = state.lock().unwrap();
    process_manager.remove_process(pid);
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(Mutex::new(MemoryManager::new()))
        .manage(Mutex::new(ProcessManager::new()))
        .invoke_handler(tauri::generate_handler![
            put_value,
            get_value,
            get_memory_status,
            clear_memory,
            get_process_list,
            create_new_process,
            swap_out_process,
            swap_in_process,
            remove_process
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[cfg(not(mobile))]
fn main() {
    run();
}
