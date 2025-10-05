// src-tauri/src/kv_store/memory_manager.rs
use super::page::{Page, PageInfo};
use crate::algorithms::fifo::FifoReplacer;
use crate::algorithms::PageReplacer;
use std::collections::HashMap;
use serde::Serialize;

#[derive(Serialize)]
pub struct MemoryStatus {
    pub primary_pages: Vec<PageInfo>,
    pub secondary_pages: Vec<PageInfo>,
    pub primary_used: usize,
    pub secondary_used: usize,
    pub primary_capacity: usize,
    pub page_faults: u64,
    pub total_operations: u64,
}

pub struct MemoryManager {
    primary_memory: HashMap<u64, Page>,
    secondary_storage: HashMap<u64, Page>,
    key_to_page_id: HashMap<String, u64>,
    replacer: FifoReplacer,
    next_page_id: u64,
    primary_capacity: usize,
    pub page_faults: u64,
    pub total_operations: u64,
}

impl MemoryManager {
    pub fn new() -> Self {
        Self {
            primary_memory: HashMap::new(),
            secondary_storage: HashMap::new(),
            key_to_page_id: HashMap::new(),
            replacer: FifoReplacer::new(),
            next_page_id: 0,
            primary_capacity: 5,
            page_faults: 0,
            total_operations: 0,
        }
    }

    pub fn put(&mut self, key: String, value: Vec<u8>) -> Result<(), Box<dyn std::error::Error>> {
        self.total_operations += 1;

        if let Some(&existing_page_id) = self.key_to_page_id.get(&key) {
            // Update existing key
            if let Some(page) = self.primary_memory.get_mut(&existing_page_id) {
                page.value = value;
                page.access();
                self.replacer.record_access(existing_page_id);
                return Ok(());
            }

            if let Some(mut page) = self.secondary_storage.remove(&existing_page_id) {
                page.value = value;
                page.access();
                self.page_faults += 1;
                return self.load_page_to_primary(page);
            }
        }

        // Create new page
        let page_id = self.next_page_id;
        self.next_page_id += 1;

        let page = Page::new(page_id, key.clone(), value);

        if self.primary_memory.len() < self.primary_capacity {
            self.primary_memory.insert(page_id, page);
            self.replacer.record_access(page_id);
        } else {
            self.replace_page(page)?;
        }

        self.key_to_page_id.insert(key, page_id);
        Ok(())
    }

    pub fn get(&mut self, key: &str) -> Result<Option<Vec<u8>>, Box<dyn std::error::Error>> {
        self.total_operations += 1;

        if let Some(&page_id) = self.key_to_page_id.get(key) {
            if let Some(page) = self.primary_memory.get_mut(&page_id) {
                page.access();
                self.replacer.record_access(page_id);
                return Ok(Some(page.value.clone()));
            }

            if let Some(mut page) = self.secondary_storage.remove(&page_id) {
                page.access();
                let value = page.value.clone();
                self.page_faults += 1;
                self.load_page_to_primary(page)?;
                return Ok(Some(value));
            }
        }

        Ok(None)
    }

    fn load_page_to_primary(&mut self, page: Page) -> Result<(), Box<dyn std::error::Error>> {
        if self.primary_memory.len() < self.primary_capacity {
            self.replacer.record_access(page.id);
            self.primary_memory.insert(page.id, page);
        } else {
            self.replace_page(page)?;
        }
        Ok(())
    }

    fn replace_page(&mut self, new_page: Page) -> Result<(), Box<dyn std::error::Error>> {
    if let Some(victim_id) = self.replacer.select_victim() {
        if let Some(victim_page) = self.primary_memory.remove(&victim_id) {
            self.secondary_storage.insert(victim_id, victim_page);
        }
    }
    // Save the id before moving new_page
    let id = new_page.id;
    self.primary_memory.insert(id, new_page);
    self.replacer.record_access(id);
    Ok(())
}


    pub fn get_status(&self) -> MemoryStatus {
        let primary_pages: Vec<PageInfo> = self
            .primary_memory
            .values()
            .map(|page| page.to_info())
            .collect();

        let secondary_pages: Vec<PageInfo> = self
            .secondary_storage
            .values()
            .map(|page| page.to_info())
            .collect();

        MemoryStatus {
            primary_pages,
            secondary_pages,
            primary_used: self.primary_memory.len(),
            secondary_used: self.secondary_storage.len(),
            primary_capacity: self.primary_capacity,
            page_faults: self.page_faults,
            total_operations: self.total_operations,
        }
    }

    // NEW: Clear method to reset all memory and statistics
    pub fn clear(&mut self) {
        self.primary_memory.clear();
        self.secondary_storage.clear();
        self.key_to_page_id.clear();
        self.replacer = FifoReplacer::new(); // Reset the replacer
        self.next_page_id = 0;
        self.page_faults = 0;
        self.total_operations = 0;
    }
}
