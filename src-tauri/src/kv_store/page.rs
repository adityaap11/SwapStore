// src-tauri/src/kv_store/page.rs
use serde::Serialize;
use std::time::{SystemTime, UNIX_EPOCH};

#[derive(Debug, Clone, Serialize)]
pub struct PageInfo {
    pub id: u64,
    pub key: String,
    pub size: usize,
    pub access_count: u32,
    pub last_accessed: u64,
    pub created_at: u64,
}

#[derive(Debug, Clone)]
pub struct Page {
    pub id: u64,
    pub key: String,
    pub value: Vec<u8>,
    pub access_count: u32,
    pub last_accessed: u64,
    pub created_at: u64,
}

impl Page {
    pub fn new(id: u64, key: String, value: Vec<u8>) -> Self {
        let timestamp = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_secs();

        Self {
            id,
            key,
            value,
            access_count: 0,
            last_accessed: timestamp,
            created_at: timestamp,
        }
    }

    pub fn access(&mut self) {
        self.access_count += 1;
        self.last_accessed = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_secs();
    }

    pub fn to_info(&self) -> PageInfo {
        PageInfo {
            id: self.id,
            key: self.key.clone(),
            size: self.value.len(),
            access_count: self.access_count,
            last_accessed: self.last_accessed,
            created_at: self.created_at,
        }
    }
}
