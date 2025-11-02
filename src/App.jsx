import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import FileLoader from './components/FileLoader';
import StorageStats from './components/StorageStats';
import MemoryVisualizer from './components/MemoryVisualizer';
import ProcessTracker from './components/ProcessTracker';
import ProcessControls from './components/ProcessControls';
import SwapAnimator from './components/SwapAnimator';
import PerformanceMetrics from './components/PerformanceMetrics';
import LoadedFilesList from './components/LoadedFilesList';
import './App.css';

function App() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [lastOperation, setLastOperation] = useState(null);
  const [activeTab, setActiveTab] = useState('operations');
  const [memoryStatus, setMemoryStatus] = useState({
    total_operations: 0,
    page_faults: 0,
    hit_rate: 0,
    primary_used: 0,
    secondary_used: 0,
    primary_capacity: 5,
    primary_pages: [],
    secondary_pages: []
  });

  // Fetch memory status from backend
  const fetchMemoryStatus = async () => {
    try {
      const status = await invoke('get_memory_status');
      setMemoryStatus(status);
      return status;
    } catch (error) {
      console.error('Failed to fetch memory status:', error);
      return null;
    }
  };

  // Handle process updates for real-time refresh
  const handleProcessUpdate = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  // Initial load
  useEffect(() => {
    fetchMemoryStatus();
  }, []);

  const tabs = [
    { id: 'operations', label: '🔧 Operations', icon: '🔧' },
    { id: 'loaded', label: '📋 Loaded Files', icon: '📋' },
    { id: 'visualization', label: '📊 Memory View', icon: '📊' },
    { id: 'processes', label: '⚙️ Process Tracker', icon: '⚙️' },
    { id: 'animation', label: '🎬 Swap Animation', icon: '🎬' },
    { id: 'metrics', label: '📈 Performance Analytics', icon: '📈' }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'operations':
        return (
          <div className="tab-content">
            <div className="operations-layout" style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start' }}>
              <div style={{ flex: 1, minWidth: 320 }}>
                <FileLoader onFilesLoaded={handleProcessUpdate} />
                <StorageStats refreshTrigger={refreshTrigger} />
              </div>
              <div style={{ flex: 2, minWidth: 480 }}>
                <MemoryVisualizer 
                  refreshTrigger={refreshTrigger}
                  compact={true}
                  onMemoryStatus={setMemoryStatus}
                />
              </div>
            </div>
          </div>
        );
      case 'loaded':
        return (
          <div className="tab-content">
            <LoadedFilesList />
          </div>
        );
      case 'visualization':
        return (
          <div className="tab-content">
            <MemoryVisualizer 
              refreshTrigger={refreshTrigger}
              onMemoryStatus={setMemoryStatus}
            />
          </div>
        );
      case 'processes':
        return (
          <div className="tab-content">
            <div className="space-y-6 p-6">
              <ProcessControls onProcessUpdate={handleProcessUpdate} />
              <ProcessTracker />
            </div>
          </div>
        );
      case 'animation':
        return (
          <div className="tab-content">
            <SwapAnimator 
              memoryStatus={memoryStatus}
              lastOperation={lastOperation} 
            />
          </div>
        );
      case 'metrics':
        return (
          <div className="tab-content">
            <PerformanceMetrics 
              memoryStatus={memoryStatus}
              refreshTrigger={refreshTrigger}
            />
          </div>
        );
      default:
        return <div>Select a tab</div>;
    }
  };

  return (
    <div className="App">
      <div className="app-header">
        <div className="header-content">
          <div className="app-title">
            <h1>SwapStore</h1>
            <p>File-based Swap Space Management Simulator</p>
          </div>
          <div className="header-info">
            <div className="info-badge">
              <span className="badge-label">Capacity:</span>
              <span className="badge-value">{memoryStatus.primary_capacity} Pages</span>
            </div>
            <div className="info-badge">
              <span className="badge-label">Operations:</span>
              <span className="badge-value">{memoryStatus.total_operations}</span>
            </div>
            <div className="info-badge">
              <span className="badge-label">Hit Rate:</span>
              <span className="badge-value">{memoryStatus.hit_rate?.toFixed(1) || 0}%</span>
            </div>
          </div>
        </div>
      </div>
      <div className="app-navigation">
        <div className="nav-tabs">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`nav-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="tab-icon">{tab.icon}</span>
              <span className="tab-label">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="app-content">
        {renderTabContent()}
      </div>
    </div>
  );
}

export default App;
