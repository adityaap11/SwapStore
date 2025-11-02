// src-tauri/src/file_handler.rs
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FileInfo {
    pub name: String,
    pub path: String,
    pub size: u64, // in bytes
    pub content: Vec<u8>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StorageStats {
    pub secondary_total: u64,      // Total secondary storage capacity
    pub secondary_used: u64,       // Used secondary storage
    pub secondary_available: u64,  // Available secondary storage
    pub swap_total: u64,           // Total swap space allocated
    pub swap_used: u64,            // Used swap space
    pub swap_available: u64,       // Available swap space
    pub files_loaded: usize,       // Number of files loaded
    pub total_file_size: u64,      // Total size of all loaded files
}

pub struct FileManager {
    pub loaded_files: Vec<FileInfo>,
    pub secondary_capacity: u64,   // Total secondary storage (e.g., 1 GB)
    pub swap_capacity: u64,        // Total swap space (e.g., 512 MB)
}

impl FileManager {
    pub fn new(secondary_capacity_mb: u64, swap_capacity_mb: u64) -> Self {
        Self {
            loaded_files: Vec::new(),
            secondary_capacity: secondary_capacity_mb * 1024 * 1024, // Convert to bytes
            swap_capacity: swap_capacity_mb * 1024 * 1024,
        }
    }

    pub fn load_file(&mut self, file_path: &str) -> Result<FileInfo, String> {
        let path = Path::new(file_path);

        if !path.exists() {
            return Err(format!("File not found: {}", file_path));
        }

        let file_name = path
            .file_name()
            .and_then(|n| n.to_str())
            .unwrap_or("unknown")
            .to_string();

        let content = fs::read(file_path)
            .map_err(|e| format!("Failed to read file: {}", e))?;

        let size = content.len() as u64;

        let file_info = FileInfo {
            name: file_name.clone(),
            path: file_path.to_string(),
            size,
            content,
        };

        self.loaded_files.push(file_info.clone());

        Ok(file_info)
    }

    pub fn load_multiple_files(&mut self, file_paths: Vec<String>) -> Result<Vec<FileInfo>, String> {
        let mut loaded = Vec::new();

        for path in file_paths {
            match self.load_file(&path) {
                Ok(file_info) => loaded.push(file_info),
                Err(e) => eprintln!("Failed to load {}: {}", path, e),
            }
        }

        if loaded.is_empty() {
            return Err("No files were successfully loaded".to_string());
        }

        Ok(loaded)
    }

    pub fn get_storage_stats(&self, swap_used: u64) -> StorageStats {
        let total_file_size: u64 = self.loaded_files.iter().map(|f| f.size).sum();

        let secondary_used = total_file_size;
        let secondary_available = self.secondary_capacity.saturating_sub(secondary_used);

        let swap_available = self.swap_capacity.saturating_sub(swap_used);

        StorageStats {
            secondary_total: self.secondary_capacity,
            secondary_used,
            secondary_available,
            swap_total: self.swap_capacity,
            swap_used,
            swap_available,
            files_loaded: self.loaded_files.len(),
            total_file_size,
        }
    }

    pub fn get_loaded_files(&self) -> &Vec<FileInfo> {
        &self.loaded_files
    }

    pub fn clear_files(&mut self) {
        self.loaded_files.clear();
    }
}