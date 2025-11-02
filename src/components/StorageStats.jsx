import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/tauri';

const StorageStats = ({ refreshTrigger }) => {
  const [stats, setStats] = useState({
    secondary_total: 0,
    secondary_used: 0,
    secondary_available: 0,
    swap_total: 0,
    swap_used: 0,
    swap_available: 0,
    files_loaded: 0,
    total_file_size: 0,
  });

  useEffect(() => {
    fetchStats();
  }, [refreshTrigger]);

  const fetchStats = async () => {
    try {
      const storageStats = await invoke('get_storage_stats');
      setStats(storageStats);
    } catch (error) {
      console.error('Failed to fetch storage stats:', error);
    }
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 B';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  // ENSURE this uses numbers for accuracy even with small values!
  const getPercentage = (used, total) => {
    const usedNum = typeof used === 'string' ? parseFloat(used) : used;
    const totalNum = typeof total === 'string' ? parseFloat(total) : total;
    if (isNaN(usedNum) || isNaN(totalNum) || totalNum === 0) return 0;
    return ((usedNum / totalNum) * 100).toFixed(2);
  };

  const getUsageColor = (percentage) => {
    if (percentage < 50) return '#70c65a';
    if (percentage < 80) return '#f5a623';
    return '#e74c3c';
  };

  const secondaryPercentage = Number(getPercentage(stats.secondary_used, stats.secondary_total));
  const swapPercentage = Number(getPercentage(stats.swap_used, stats.swap_total));

  return (
    <div className="storage-stats-container" style={{ width: '100%', maxWidth: 520, margin: '0 auto' }}>
      <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
        {/* Secondary Storage Card */}
        <div style={{
          flex: 1,
          minWidth: 240,
          background: '#fff',
          borderRadius: 12,
          boxShadow: '0 1px 8px rgba(0,0,0,0.04)',
          padding: '1.25rem',
          marginBottom: '1rem'
        }}>
          <h4 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Secondary Storage</h4>
          <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#645c5c' }}>Total Capacity</span>
            <span style={{ fontWeight: 500 }}>{formatBytes(stats.secondary_total)}</span>
          </div>
          <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#645c5c' }}>Used</span>
            <span style={{ fontWeight: 500, color: '#e74c3c' }}>{formatBytes(stats.secondary_used)}</span>
          </div>
          <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#645c5c' }}>Available</span>
            <span style={{ fontWeight: 500, color: '#70c65a' }}>{formatBytes(stats.secondary_available)}</span>
          </div>
          <div style={{ marginBottom: 14, display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#645c5c' }}>Usage</span>
            <span style={{ fontWeight: 500 }}>{secondaryPercentage}%</span>
          </div>
          <div style={{
            width: '100%',
            height: 10,
            borderRadius: 5,
            background: '#eee',
            marginBottom: 4,
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${secondaryPercentage}%`,
              height: 10,
              borderRadius: 5,
              background: getUsageColor(secondaryPercentage),
              transition: 'width 0.3s'
            }} />
          </div>
        </div>

        {/* Swap Space Card */}
        <div style={{
          flex: 1,
          minWidth: 240,
          background: '#fff',
          borderRadius: 12,
          boxShadow: '0 1px 8px rgba(0,0,0,0.04)',
          padding: '1.25rem',
          marginBottom: '1rem'
        }}>
          <h4 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Swap Space</h4>
          <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#645c5c' }}>Total Allocated</span>
            <span style={{ fontWeight: 500 }}>{formatBytes(stats.swap_total)}</span>
          </div>
          <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#645c5c' }}>Used</span>
            <span style={{ fontWeight: 500, color: '#e74c3c' }}>{formatBytes(stats.swap_used)}</span>
          </div>
          <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#645c5c' }}>Available</span>
            <span style={{ fontWeight: 500, color: '#70c65a' }}>{formatBytes(stats.swap_available)}</span>
          </div>
          <div style={{ marginBottom: 14, display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#645c5c' }}>Usage</span>
            <span style={{ fontWeight: 500 }}>{swapPercentage}%</span>
          </div>
          <div style={{
            width: '100%',
            height: 10,
            borderRadius: 5,
            background: '#eee',
            marginBottom: 4,
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${swapPercentage}%`,
              height: 10,
              borderRadius: 5,
              background: getUsageColor(swapPercentage),
              transition: 'width 0.3s'
            }} />
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div style={{
        display: 'flex',
        gap: '1.5rem',
        marginTop: 12,
        flexWrap: 'wrap'
      }}>
        <div style={{
          flex: 1,
          minWidth: 120,
          background: '#f6f8fb',
          borderRadius: 10,
          border: '1px solid #e5eaf1',
          padding: 18,
          textAlign: 'center'
        }}>
          <div style={{ fontSize: 32, color: '#605dc5', marginBottom: 4 }}>📚</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#4f597e' }}>{stats.files_loaded}</div>
          <div style={{ fontSize: 13, color: '#888' }}>Files Loaded</div>
        </div>
        <div style={{
          flex: 1,
          minWidth: 120,
          background: '#f6f8fb',
          borderRadius: 10,
          border: '1px solid #e5eaf1',
          padding: 18,
          textAlign: 'center'
        }}>
          <div style={{ fontSize: 32, color: '#cc59c5', marginBottom: 4 }}>💿</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#4f597e' }}>{formatBytes(stats.total_file_size)}</div>
          <div style={{ fontSize: 13, color: '#888' }}>Total File Size</div>
        </div>
      </div>
    </div>
  );
};

export default StorageStats;
