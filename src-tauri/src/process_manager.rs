use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Mutex;
use std::time::{SystemTime, UNIX_EPOCH};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ProcessStatus {
    Active,
    SwappedOut,
    Waiting,
    Blocked,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Process {
    pub pid: u32,
    pub name: String,
    pub status: ProcessStatus,
    pub memory_usage: u64, // in MB
    pub swap_usage: u64,   // in MB
    pub priority: u8,
    pub last_activity: u64, // timestamp
    pub created_at: u64,
}

pub struct ProcessManager {
    processes: HashMap<u32, Process>,
    next_pid: u32,
}

impl ProcessManager {
    pub fn new() -> Self {
        let mut manager = Self {
            processes: HashMap::new(),
            next_pid: 1000,
        };
        
        // Create some initial demo processes
        manager.create_demo_processes();
        manager
    }

    pub fn create_process(&mut self, name: String, memory_usage: u64, priority: u8) -> u32 {
        let pid = self.next_pid;
        self.next_pid += 1;

        let now = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_secs();

        let process = Process {
            pid,
            name,
            status: ProcessStatus::Active,
            memory_usage,
            swap_usage: 0,
            priority,
            last_activity: now,
            created_at: now,
        };

        self.processes.insert(pid, process);
        pid
    }

    pub fn update_process_status(&mut self, pid: u32, status: ProcessStatus) {
        if let Some(process) = self.processes.get_mut(&pid) {
            process.status = status;
            process.last_activity = SystemTime::now()
                .duration_since(UNIX_EPOCH)
                .unwrap()
                .as_secs();
        }
    }

    pub fn swap_out_process(&mut self, pid: u32, swap_size: u64) {
        if let Some(process) = self.processes.get_mut(&pid) {
            process.status = ProcessStatus::SwappedOut;
            process.swap_usage = swap_size;
            process.last_activity = SystemTime::now()
                .duration_since(UNIX_EPOCH)
                .unwrap()
                .as_secs();
        }
    }

    pub fn swap_in_process(&mut self, pid: u32) {
        if let Some(process) = self.processes.get_mut(&pid) {
            process.status = ProcessStatus::Active;
            process.swap_usage = 0;
            process.last_activity = SystemTime::now()
                .duration_since(UNIX_EPOCH)
                .unwrap()
                .as_secs();
        }
    }

    pub fn get_all_processes(&self) -> Vec<Process> {
        self.processes.values().cloned().collect()
    }

    pub fn get_active_processes(&self) -> Vec<Process> {
        self.processes
            .values()
            .filter(|p| matches!(p.status, ProcessStatus::Active))
            .cloned()
            .collect()
    }

    pub fn get_swapped_processes(&self) -> Vec<Process> {
        self.processes
            .values()
            .filter(|p| matches!(p.status, ProcessStatus::SwappedOut))
            .cloned()
            .collect()
    }

    pub fn remove_process(&mut self, pid: u32) -> Option<Process> {
        self.processes.remove(&pid)
    }

    fn create_demo_processes(&mut self) {
        // Create some demo processes for testing
        self.create_process("web_browser".to_string(), 512, 5);
        self.create_process("text_editor".to_string(), 64, 3);
        self.create_process("media_player".to_string(), 256, 4);
        self.create_process("file_manager".to_string(), 32, 2);
        self.create_process("system_monitor".to_string(), 48, 1);
        
        // Swap out a couple of processes for demo
        self.swap_out_process(1002, 64); // text_editor
        self.swap_out_process(1003, 256); // media_player
        self.update_process_status(1004, ProcessStatus::Waiting); // file_manager
    }

    pub fn simulate_activity(&mut self) {
        // Randomly update some process activities for demo
        use rand::Rng;
        let mut rng = rand::thread_rng();
        
        for process in self.processes.values_mut() {
            if rng.gen_bool(0.3) { // 30% chance to update activity
                process.last_activity = SystemTime::now()
                    .duration_since(UNIX_EPOCH)
                    .unwrap()
                    .as_secs();
            }
        }
    }
}
