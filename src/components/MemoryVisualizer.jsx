// src/components/MemoryVisualizer.jsx
import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import './MemoryVisualizer.css';

const MemoryVisualizer = ({ refreshTrigger, compact = false, onMemoryStatus }) => {
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
    const [loading, setLoading] = useState(false);

    const fetchMemoryStatus = async () => {
        setLoading(true);
        try {
            const status = await invoke('get_memory_status');
            
            // Calculate hit rate if not provided by backend
            if (!status.hit_rate && status.total_operations > 0) {
                status.hit_rate = ((status.total_operations - status.page_faults) / status.total_operations) * 100;
            }
            
            setMemoryStatus(status);
            
            // Pass updated status to parent component
            if (onMemoryStatus) {
                onMemoryStatus(status);
            }
            
            console.log('Memory status fetched:', status);
        } catch (error) {
            console.error('Failed to fetch memory status:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMemoryStatus();
    }, [refreshTrigger]);

    const renderMemoryBlock = (page, index, type) => {
        if (!page) {
            return (
                <div key={index} className={`memory-block empty ${type}`}>
                    <div className="block-content">
                        <div className="block-id">Empty</div>
                    </div>
                </div>
            );
        }

        return (
            <div key={page.id || index} className={`memory-block occupied ${type}`}>
                <div className="block-content">
                    <div className="block-id">Page {page.id}</div>
                    <div className="block-key">{page.key}</div>
                    <div className="block-size">{page.size || 28}B</div>
                    <div className="block-access">#{page.access_count || 1}</div>
                </div>
            </div>
        );
    };

    const renderStats = () => (
        <div className="memory-stats">
            <div className="stat-item">
                <span className="stat-label">Page Faults:</span>
                <span className="stat-value">{memoryStatus.page_faults}</span>
            </div>
            <div className="stat-item">
                <span className="stat-label">Total Operations:</span>
                <span className="stat-value">{memoryStatus.total_operations}</span>
            </div>
            <div className="stat-item">
                <span className="stat-label">Hit Rate:</span>
                <span className="stat-value">{memoryStatus.hit_rate?.toFixed(1) || 0}%</span>
            </div>
            <div className="stat-item">
                <span className="stat-label">Memory Utilization:</span>
                <span className="stat-value">
                    {memoryStatus.primary_capacity ? 
                        Math.round((memoryStatus.primary_used / memoryStatus.primary_capacity) * 100) : 0}%
                </span>
            </div>
        </div>
    );

    if (compact) {
        return (
            <div className="memory-visualizer compact">
                <div className="visualizer-header">
                    <h3>Quick Memory View</h3>
                    {loading && <div className="loading-indicator">Updating...</div>}
                </div>
                
                <div className="memory-section">
                    <h4>Primary Memory ({memoryStatus.primary_used}/{memoryStatus.primary_capacity})</h4>
                    <div className="memory-grid compact-grid">
                        {Array(memoryStatus.primary_capacity).fill(null).map((_, index) => {
                            const page = memoryStatus.primary_pages[index];
                            return renderMemoryBlock(page, index, 'primary');
                        })}
                    </div>
                </div>
                
                {memoryStatus.secondary_pages.length > 0 && (
                    <div className="memory-section">
                        <h4>Secondary Storage ({memoryStatus.secondary_used})</h4>
                        <div className="memory-grid compact-grid">
                            {memoryStatus.secondary_pages.slice(0, 3).map((page, index) => 
                                renderMemoryBlock(page, index, 'secondary')
                            )}
                            {memoryStatus.secondary_pages.length > 3 && (
                                <div className="more-indicator">
                                    +{memoryStatus.secondary_pages.length - 3} more
                                </div>
                            )}
                        </div>
                    </div>
                )}
                
                {renderStats()}
            </div>
        );
    }

    return (
        <div className="memory-visualizer">
            <div className="visualizer-header">
                <h2>Memory Visualization</h2>
                {loading && <div className="loading-indicator">Updating...</div>}
            </div>

            <div className="memory-section">
                <h3>Primary Memory ({memoryStatus.primary_used}/{memoryStatus.primary_capacity})</h3>
                <div className="memory-grid">
                    {Array(memoryStatus.primary_capacity).fill(null).map((_, index) => {
                        const page = memoryStatus.primary_pages[index];
                        return renderMemoryBlock(page, index, 'primary');
                    })}
                </div>
            </div>

            <div className="memory-section">
                <h3>Secondary Storage ({memoryStatus.secondary_used})</h3>
                <div className="memory-grid">
                    {memoryStatus.secondary_pages.length > 0 ? (
                        memoryStatus.secondary_pages.map((page, index) => 
                            renderMemoryBlock(page, index, 'secondary')
                        )
                    ) : (
                        <div className="empty-secondary">No pages in secondary storage</div>
                    )}
                </div>
            </div>

            {renderStats()}
        </div>
    );
};

export default MemoryVisualizer;
