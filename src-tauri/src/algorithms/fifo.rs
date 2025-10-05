// src-tauri/src/algorithms/fifo.rs
use super::PageReplacer;
use std::collections::VecDeque;

pub struct FifoReplacer {
    queue: VecDeque<u64>,
}

impl FifoReplacer {
    pub fn new() -> Self {
        Self {
            queue: VecDeque::new(),
        }
    }
}

impl PageReplacer for FifoReplacer {
    fn record_access(&mut self, page_id: u64) {
        // Only add if not already in queue (avoid duplicates)
        if !self.queue.contains(&page_id) {
            self.queue.push_back(page_id);
        }
    }

    fn select_victim(&mut self) -> Option<u64> {
        self.queue.pop_front()
    }
}
