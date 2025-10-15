// src/components/ProcessTracker.jsx
import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/tauri';

const ProcessTracker = () => {
  const [processes, setProcesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const fetchProcesses = async () => {
      try {
        const processData = await invoke('get_process_list');
        setProcesses(processData);
        setLoading(false);
      } catch (error) {
        console.error('Failed to fetch processes:', error);
        setLoading(false);
      }
    };

    // Fetch processes initially
    fetchProcesses();

    // Set up real-time updates every 1 second
    const interval = setInterval(fetchProcesses, 1000);

    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-500';
      case 'swapped_out':
        return 'bg-red-500';
      case 'waiting':
        return 'bg-yellow-500';
      case 'blocked':
        return 'bg-orange-500';
      default:
        return 'bg-gray-500';
    }
  };

  const filteredProcesses = processes.filter(process => {
    if (filter === 'all') return true;
    return process.status === filter;
  });

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-bold mb-4">Process Tracker</h2>
        <div className="text-center">Loading processes...</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Real-Time Process Tracker</h2>
        <div className="flex gap-2">
          <select 
            value={filter} 
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-1 border rounded"
          >
            <option value="all">All Processes</option>
            <option value="active">Active</option>
            <option value="swapped_out">Swapped Out</option>
            <option value="waiting">Waiting</option>
            <option value="blocked">Blocked</option>
          </select>
          <div className="text-sm text-gray-600 px-3 py-1">
            Total: {filteredProcesses.length}
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full table-auto">
          <thead>
            <tr className="bg-gray-100">
              <th className="px-4 py-2 text-left">PID</th>
              <th className="px-4 py-2 text-left">Name</th>
              <th className="px-4 py-2 text-left">Status</th>
              <th className="px-4 py-2 text-left">Memory Usage</th>
              <th className="px-4 py-2 text-left">Swap Usage</th>
              <th className="px-4 py-2 text-left">Priority</th>
              <th className="px-4 py-2 text-left">Last Activity</th>
            </tr>
          </thead>
          <tbody>
            {filteredProcesses.map((process) => (
              <tr key={process.pid} className="border-b hover:bg-gray-50">
                <td className="px-4 py-2 font-mono">{process.pid}</td>
                <td className="px-4 py-2">{process.name}</td>
                <td className="px-4 py-2">
                  <div className="flex items-center gap-2">
                    <div 
                      className={`w-3 h-3 rounded-full ${getStatusColor(process.status)}`}
                    ></div>
                    <span className="capitalize">{process.status.replace('_', ' ')}</span>
                  </div>
                </td>
                <td className="px-4 py-2">{process.memory_usage} MB</td>
                <td className="px-4 py-2">{process.swap_usage} MB</td>
                <td className="px-4 py-2">{process.priority}</td>
                <td className="px-4 py-2 text-sm text-gray-600">
                  {new Date(process.last_activity * 1000).toLocaleTimeString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredProcesses.length === 0 && (
        <div className="text-center text-gray-500 py-8">
          No processes found for the selected filter.
        </div>
      )}
    </div>
  );
};

export default ProcessTracker;
