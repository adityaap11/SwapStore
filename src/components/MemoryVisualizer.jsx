import React, { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/tauri';

// Helper to format bytes for human readability
const formatBytes = (bytes) => {
  if (bytes === 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
};

const getPercentage = (used, total) => {
  const usedNum = typeof used === 'string' ? parseFloat(used) : used;
  const totalNum = typeof total === 'string' ? parseFloat(total) : total;
  if (isNaN(usedNum) || isNaN(totalNum) || totalNum === 0) return 0;
  return ((usedNum / totalNum) * 100).toFixed(2);
};

const MemoryVisualizer = ({ refreshTrigger, compact, onMemoryStatus }) => {
  const [status, setStatus] = useState(null);

  useEffect(() => {
    fetchStatus();
    // eslint-disable-next-line
  }, [refreshTrigger]);

  const fetchStatus = async () => {
    try {
      const stat = await invoke('get_memory_status');
      setStatus(stat);
      if (onMemoryStatus) onMemoryStatus(stat);
    } catch {
      setStatus(null);
    }
  };

  if (!status) {
    return (
      <div className="memory-visualizer">
        <div className="text-center py-8 text-gray-500">
          Loading memory status...
        </div>
      </div>
    );
  }

  // Memory status object expected to contain these fields from backend
  // - primary_capacity, primary_used, secondary_used, secondary_capacity, swap_total, swap_used
  const primaryTotal = status.primary_capacity_bytes || status.primary_capacity || (status.primary_pages?.length * (status.page_size_bytes || 4096));
  const primaryUsed = status.primary_used_bytes || status.primary_used || (status.primary_pages?.reduce((sum, p) => sum + (p.size || 0), 0) || 0);
  const primaryAvailable = Math.max(0, primaryTotal - primaryUsed);

  const secondaryTotal = status.secondary_capacity_bytes || status.secondary_capacity || status.secondary_total || 1024 * 1024 * 1024; // fallback 1GB
  const secondaryUsed = status.secondary_used_bytes || status.secondary_used || (status.secondary_pages?.reduce((sum, p) => sum + (p.size || 0), 0) || 0);
  const secondaryAvailable = Math.max(0, secondaryTotal - secondaryUsed);

  const swapTotal = status.swap_total_bytes || status.swap_total || status.swap_capacity || 512 * 1024 * 1024; // fallback 512MB
  const swapUsed = status.swap_used_bytes || status.swap_used || 0;
  const swapAvailable = Math.max(0, swapTotal - swapUsed);

  return (
    <div className="memory-visualizer" style={{ width: '100%', maxWidth: 900, margin: '0 auto', background: '#fff', borderRadius: 12, boxShadow: '0 1px 8px rgba(0,0,0,0.04)', padding: '2rem' }}>
      <h2 style={{ fontWeight: 700, fontSize: 22, marginBottom: 24 }}>Current Memory Status</h2>

      <div style={{display: 'flex', gap: '2.5rem', flexWrap: 'wrap', justifyContent: 'space-between'}}>
        {/* Primary Memory Card */}
        <div style={{flex: 1, minWidth: 250, background: '#f7fcfd', borderRadius: 10, border: '1px solid #dceaf5', padding: 24, marginBottom: 12}}>
          <h4 style={{fontWeight: 700, fontSize: 20, marginBottom: 10}}>Primary Memory</h4>
          <div style={{marginBottom: 6, display:'flex', justifyContent: 'space-between'}}>
            <span>Used:</span>
            <span style={{fontWeight: 600}}>{formatBytes(primaryUsed)}</span>
          </div>
          <div style={{marginBottom: 6, display:'flex', justifyContent: 'space-between'}}>
            <span>Available:</span>
            <span style={{fontWeight: 600, color: '#059669'}}>{formatBytes(primaryAvailable)}</span>
          </div>
          <div style={{marginBottom: 6, display:'flex', justifyContent: 'space-between'}}>
            <span>Total Capacity:</span>
            <span>{formatBytes(primaryTotal)}</span>
          </div>
          <div style={{marginBottom: 0, display:'flex', justifyContent: 'space-between'}}>
            <span>Utilization:</span>
            <span>{getPercentage(primaryUsed, primaryTotal)}%</span>
          </div>
        </div>
        {/* Secondary Memory Card */}
        <div style={{flex: 1, minWidth: 250, background: '#f7fcfd', borderRadius: 10, border: '1px solid #dceaf5', padding: 24, marginBottom: 12}}>
          <h4 style={{fontWeight: 700, fontSize: 20, marginBottom: 10}}>Secondary Memory</h4>
          <div style={{marginBottom: 6, display:'flex', justifyContent: 'space-between'}}>
            <span>Used:</span>
            <span style={{fontWeight: 600}}>{formatBytes(secondaryUsed)}</span>
          </div>
          <div style={{marginBottom: 6, display:'flex', justifyContent: 'space-between'}}>
            <span>Available:</span>
            <span style={{fontWeight: 600, color: '#059669'}}>{formatBytes(secondaryAvailable)}</span>
          </div>
          <div style={{marginBottom: 6, display:'flex', justifyContent: 'space-between'}}>
            <span>Total Capacity:</span>
            <span>{formatBytes(secondaryTotal)}</span>
          </div>
          <div style={{marginBottom: 0, display:'flex', justifyContent: 'space-between'}}>
            <span>Utilization:</span>
            <span>{getPercentage(secondaryUsed, secondaryTotal)}%</span>
          </div>
        </div>
        {/* Swap Space Card */}
        <div style={{flex: 1, minWidth: 250, background: '#f7fcfd', borderRadius: 10, border: '1px solid #dceaf5', padding: 24, marginBottom: 12}}>
          <h4 style={{fontWeight: 700, fontSize: 20, marginBottom: 10}}>Swap Space</h4>
          <div style={{marginBottom: 6, display:'flex', justifyContent: 'space-between'}}>
            <span>Allocated:</span>
            <span>{formatBytes(swapTotal)}</span>
          </div>
          <div style={{marginBottom: 6, display:'flex', justifyContent: 'space-between'}}>
            <span>Used:</span>
            <span style={{fontWeight: 600}}>{formatBytes(swapUsed)}</span>
          </div>
          <div style={{marginBottom: 6, display:'flex', justifyContent: 'space-between'}}>
            <span>Available:</span>
            <span style={{fontWeight: 600, color: '#059669'}}>{formatBytes(swapAvailable)}</span>
          </div>
          <div style={{marginBottom: 0, display:'flex', justifyContent: 'space-between'}}>
            <span>Utilization:</span>
            <span>{getPercentage(swapUsed, swapTotal)}%</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MemoryVisualizer;
