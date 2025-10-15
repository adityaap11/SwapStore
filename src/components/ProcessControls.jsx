// src/components/ProcessControls.jsx
import React, { useState } from 'react';
import { invoke } from '@tauri-apps/api/tauri';

const ProcessControls = ({ onProcessUpdate }) => {
  const [newProcess, setNewProcess] = useState({
    name: '',
    memory_usage: 64,
    priority: 3
  });

  const [actionPid, setActionPid] = useState('');
  const [swapSize, setSwapSize] = useState(64);

  const handleCreateProcess = async (e) => {
    e.preventDefault();
    try {
      await invoke('create_new_process', {
        name: newProcess.name,
        memoryUsage: parseInt(newProcess.memory_usage),
        priority: parseInt(newProcess.priority)
      });
      
      setNewProcess({ name: '', memory_usage: 64, priority: 3 });
      if (onProcessUpdate) onProcessUpdate();
      
    } catch (error) {
      console.error('Failed to create process:', error);
    }
  };

  const handleSwapOut = async () => {
    try {
      await invoke('swap_out_process', {
        pid: parseInt(actionPid),
        swapSize: parseInt(swapSize)
      });
      if (onProcessUpdate) onProcessUpdate();
    } catch (error) {
      console.error('Failed to swap out process:', error);
    }
  };

  const handleSwapIn = async () => {
    try {
      await invoke('swap_in_process', {
        pid: parseInt(actionPid)
      });
      if (onProcessUpdate) onProcessUpdate();
    } catch (error) {
      console.error('Failed to swap in process:', error);
    }
  };

  const handleRemoveProcess = async () => {
    try {
      await invoke('remove_process', {
        pid: parseInt(actionPid)
      });
      setActionPid('');
      if (onProcessUpdate) onProcessUpdate();
    } catch (error) {
      console.error('Failed to remove process:', error);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h3 className="text-lg font-bold mb-4">Process Controls</h3>
      
      {/* Create New Process */}
      <div className="mb-6">
        <h4 className="font-semibold mb-2">Create New Process</h4>
        <form onSubmit={handleCreateProcess} className="flex gap-2 flex-wrap">
          <input
            type="text"
            placeholder="Process name"
            value={newProcess.name}
            onChange={(e) => setNewProcess({...newProcess, name: e.target.value})}
            className="px-3 py-1 border rounded flex-1 min-w-32"
            required
          />
          <input
            type="number"
            placeholder="Memory (MB)"
            value={newProcess.memory_usage}
            onChange={(e) => setNewProcess({...newProcess, memory_usage: e.target.value})}
            className="px-3 py-1 border rounded w-24"
            min="1"
            max="1024"
          />
          <input
            type="number"
            placeholder="Priority"
            value={newProcess.priority}
            onChange={(e) => setNewProcess({...newProcess, priority: e.target.value})}
            className="px-3 py-1 border rounded w-20"
            min="1"
            max="10"
          />
          <button
            type="submit"
            className="px-4 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Create
          </button>
        </form>
      </div>

      {/* Process Actions */}
      <div>
        <h4 className="font-semibold mb-2">Process Actions</h4>
        <div className="flex gap-2 flex-wrap items-center">
          <input
            type="number"
            placeholder="Process ID"
            value={actionPid}
            onChange={(e) => setActionPid(e.target.value)}
            className="px-3 py-1 border rounded w-24"
          />
          <input
            type="number"
            placeholder="Swap Size (MB)"
            value={swapSize}
            onChange={(e) => setSwapSize(e.target.value)}
            className="px-3 py-1 border rounded w-24"
            min="1"
          />
          <button
            onClick={handleSwapOut}
            disabled={!actionPid}
            className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 disabled:bg-gray-300"
          >
            Swap Out
          </button>
          <button
            onClick={handleSwapIn}
            disabled={!actionPid}
            className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-300"
          >
            Swap In
          </button>
          <button
            onClick={handleRemoveProcess}
            disabled={!actionPid}
            className="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600 disabled:bg-gray-300"
          >
            Remove
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProcessControls;
