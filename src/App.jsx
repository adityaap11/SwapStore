
import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import MemoryVisualizer from './components/MemoryVisualizer';
import KVOperations from './components/KVOperations';
import SwapAnimator from './components/SwapAnimator';
import AlgorithmComparison from './components/AlgorithmComparison';
import PerformanceMetrics from './components/PerformanceMetrics';
import ProcessTracker from './components/ProcessTracker';
import ProcessControls from './components/ProcessControls';
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
    
    // Handle operations with proper state updates
    const handleOperation = async (operation, key, value) => {
        console.log(`${operation} operation:`, key, value);
        
        // Create operation object for animations
        const operationObj = {
            type: operation,
            key,
            value,
            timestamp: Date.now(),
            pageId: Math.floor(Math.random() * 1000)
        };
        
        setLastOperation(operationObj);
        
        // Force refresh and fetch updated stats
        setRefreshTrigger(prev => prev + 1);
        
        // Wait a bit for backend to process, then fetch updated status
        setTimeout(async () => {
            const updatedStatus = await fetchMemoryStatus();
            if (updatedStatus) {
                console.log('Updated memory status:', updatedStatus);
            }
        }, 100);
    };
    
    // Handle memory status updates from MemoryVisualizer
    const handleMemoryStatusUpdate = (newStatus) => {
        setMemoryStatus(newStatus);
        console.log('Memory status updated:', newStatus);
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
        { id: 'visualization', label: '📊 Memory View', icon: '📊' },
        { id: 'processes', label: '⚙️ Process Tracker', icon: '⚙️' },
        { id: 'animation', label: '🎬 Swap Animation', icon: '🎬' },
        { id: 'comparison', label: '⚖️ Algorithm Comparison', icon: '⚖️' },
        { id: 'metrics', label: '📈 Performance Analytics', icon: '📈' }
    ];
    
    const renderTabContent = () => {
        switch (activeTab) {
            case 'operations':
                return (
                    <div className="tab-content">
                        <div className="operations-layout">
                            <div className="operations-panel">
                                <KVOperations onOperation={handleOperation} />
                            </div>
                            <div className="quick-view-panel">
                                <MemoryVisualizer 
                                    refreshTrigger={refreshTrigger}
                                    compact={true}
                                    onMemoryStatus={handleMemoryStatusUpdate}
                                />
                            </div>
                        </div>
                    </div>
                );
            case 'visualization':
                return (
                    <div className="tab-content">
                        <MemoryVisualizer 
                            refreshTrigger={refreshTrigger}
                            onMemoryStatus={handleMemoryStatusUpdate}
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
            case 'comparison':
                return (
                    <div className="tab-content">
                        <AlgorithmComparison />
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
                        <p>Interactive Memory Management & Swap Space Visualization</p>
                    </div>
                    <div className="header-info">
                        <div className="info-badge">
                            <span className="badge-label">Algorithm:</span>
                            <span className="badge-value">FIFO</span>
                        </div>
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
            
            <div className="app-footer">
                <div className="footer-content">
                    <div className="footer-info">
                        <p>Educational Memory Management Simulator</p>
                        <p>Hit Rate: {memoryStatus.hit_rate?.toFixed(1)}% | Operations: {memoryStatus.total_operations} | Faults: {memoryStatus.page_faults}</p>
                    </div>
                    <div className="footer-links">
                        <a href="#" onClick={(e) => { e.preventDefault(); setActiveTab('comparison'); }}>
                            Compare Algorithms
                        </a>
                        <a href="#" onClick={(e) => { e.preventDefault(); setActiveTab('metrics'); }}>
                            View Analytics
                        </a>
                        <a href="#" onClick={(e) => { e.preventDefault(); setActiveTab('animation'); }}>
                            Watch Animations
                        </a>
                        <a href="#" onClick={(e) => { e.preventDefault(); setActiveTab('processes'); }}>
                            Process Tracker
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default App;