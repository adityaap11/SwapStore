// src-tauri/src/main.rs
use std::sync::Mutex;
use tauri::State;

mod kv_store;
mod algorithms;
mod process_manager;
mod file_handler;

use kv_store::memory_manager::MemoryManager;
use process_manager::ProcessManager;
use file_handler::{FileManager, FileInfo, StorageStats};

struct AppState {
    memory_manager: Mutex<MemoryManager>,
    process_manager: Mutex<ProcessManager>,
    file_manager: Mutex<FileManager>,
}

#[tauri::command]
fn get_memory_status(state: State<'_, AppState>) -> Result<serde_json::Value, String> {
    let manager = state.memory_manager.lock().unwrap();
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
fn clear_memory(state: State<'_, AppState>) -> Result<(), String> {
    let mut manager = state.memory_manager.lock().unwrap();
    manager.clear();

    // Reset process manager
    let mut process_manager = state.process_manager.lock().unwrap();
    *process_manager = ProcessManager::new();

    // Clear file manager
    let mut file_manager = state.file_manager.lock().unwrap();
    file_manager.clear_files();

    Ok(())
}

// FILE HANDLING COMMANDS

#[tauri::command]
fn load_file(
    file_path: String,
    state: State<'_, AppState>,
) -> Result<FileInfo, String> {
    let mut file_manager = state.file_manager.lock().unwrap();
    let mut memory_manager = state.memory_manager.lock().unwrap();

    // Load the file
    let file_info = file_manager.load_file(&file_path)?;

    // Add file to memory manager as a page
    let key = file_info.name.clone();
    memory_manager.put(key, file_info.content.clone())
        .map_err(|e| e.to_string())?;

    Ok(file_info)
}

#[tauri::command]
fn load_multiple_files(
    file_paths: Vec<String>,
    state: State<'_, AppState>,
) -> Result<Vec<FileInfo>, String> {
    let mut file_manager = state.file_manager.lock().unwrap();
    let mut memory_manager = state.memory_manager.lock().unwrap();

    let files = file_manager.load_multiple_files(file_paths)?;

    // Add each file to memory manager
    for file in &files {
        let key = file.name.clone();
        memory_manager.put(key, file.content.clone())
            .map_err(|e| e.to_string())?;
    }

    Ok(files)
}

#[tauri::command]
fn get_storage_stats(state: State<'_, AppState>) -> Result<StorageStats, String> {
    let file_manager = state.file_manager.lock().unwrap();
    let memory_manager = state.memory_manager.lock().unwrap();

    let status = memory_manager.get_status();
    let swap_used = status.secondary_used;

Ok(file_manager.get_storage_stats(swap_used as u64))
}

#[tauri::command]
fn get_loaded_files(state: State<'_, AppState>) -> Result<Vec<FileInfo>, String> {
    let file_manager = state.file_manager.lock().unwrap();
    Ok(file_manager.get_loaded_files().clone())
}

// PROCESS TRACKING COMMANDS

#[tauri::command]
fn get_process_list(state: State<'_, AppState>) -> Result<Vec<process_manager::Process>, String> {
    let process_manager = state.process_manager.lock().unwrap();
    Ok(process_manager.get_all_processes())
}

#[tauri::command]
fn create_new_process(
    name: String,
    memory_usage: u64,
    priority: u8,
    state: State<'_, AppState>,
) -> Result<u32, String> {
    let mut process_manager = state.process_manager.lock().unwrap();
    let pid = process_manager.create_process(name, memory_usage, priority);
    Ok(pid)
}

#[tauri::command]
fn swap_out_process(
    pid: u32,
    swap_size: u64,
    state: State<'_, AppState>,
) -> Result<(), String> {
    let mut process_manager = state.process_manager.lock().unwrap();
    process_manager.swap_out_process(pid, swap_size);
    Ok(())
}

#[tauri::command]
fn swap_in_process(
    pid: u32,
    state: State<'_, AppState>,
) -> Result<(), String> {
    let mut process_manager = state.process_manager.lock().unwrap();
    process_manager.swap_in_process(pid);
    Ok(())
}

#[tauri::command]
fn remove_process(
    pid: u32,
    state: State<'_, AppState>,
) -> Result<(), String> {
    let mut process_manager = state.process_manager.lock().unwrap();
    process_manager.remove_process(pid);
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let app_state = AppState {
        memory_manager: Mutex::new(MemoryManager::new()),
        process_manager: Mutex::new(ProcessManager::new()),
        file_manager: Mutex::new(FileManager::new(1024, 512)), // 1GB secondary, 512MB swap
    };

    tauri::Builder::default()
        .manage(app_state)
        .invoke_handler(tauri::generate_handler![
            get_memory_status,
            clear_memory,
            load_file,
            load_multiple_files,
            get_storage_stats,
            get_loaded_files,
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