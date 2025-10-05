// src-tauri/src/algorithms/mod.rs
pub mod fifo;

pub trait PageReplacer {
    fn record_access(&mut self, page_id: u64);
    fn select_victim(&mut self) -> Option<u64>;
}
