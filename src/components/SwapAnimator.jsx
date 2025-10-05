// src/components/SwapAnimator.jsx
import React, { useState, useEffect, useRef } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import './SwapAnimator.css';

const SwapAnimator = ({ memoryStatus, lastOperation }) => {
    const [animations, setAnimations] = useState([]);
    const [operationHistory, setOperationHistory] = useState([]);
    const [currentMemoryStatus, setCurrentMemoryStatus] = useState(null);
    const [isAnimating, setIsAnimating] = useState(false);
    const animationRef = useRef(null);

    // Fetch memory status periodically for real-time updates
    useEffect(() => {
        const fetchMemoryStatus = async () => {
            try {
                const status = await invoke('get_memory_status');
                setCurrentMemoryStatus(status);
            } catch (error) {
                console.error('Failed to fetch memory status:', error);
            }
        };

        fetchMemoryStatus();
        const interval = setInterval(fetchMemoryStatus, 1000); // Update every second
        return () => clearInterval(interval);
    }, []);

    // Handle new operations and trigger animations
    useEffect(() => {
        if (lastOperation && lastOperation.type) {
            const operationWithTimestamp = {
                ...lastOperation,
                timestamp: Date.now(),
                id: Date.now() + Math.random()
            };
            
            setOperationHistory(prev => [...prev.slice(-9), operationWithTimestamp]);
            
            // Trigger specific animations based on operation type
            if (lastOperation.type === 'PUT') {
                animatePutOperation(operationWithTimestamp);
            } else if (lastOperation.type === 'GET') {
                animateGetOperation(operationWithTimestamp);
            }
        }
    }, [lastOperation]);

    const animatePutOperation = (operation) => {
        setIsAnimating(true);
        
        // Simulate page creation and placement
        const animation = {
            id: operation.id,
            type: 'page_creation',
            key: operation.key,
            phase: 'creating',
            duration: 2000
        };
        
        setAnimations(prev => [...prev, animation]);
        
        // Animation phases
        setTimeout(() => {
            setAnimations(prev => prev.map(a => 
                a.id === animation.id ? { ...a, phase: 'placing' } : a
            ));
        }, 500);
        
        setTimeout(() => {
            setAnimations(prev => prev.map(a => 
                a.id === animation.id ? { ...a, phase: 'complete' } : a
            ));
        }, 1500);
        
        setTimeout(() => {
            setAnimations(prev => prev.filter(a => a.id !== animation.id));
            setIsAnimating(false);
        }, 2000);
    };

    const animateGetOperation = (operation) => {
        setIsAnimating(true);
        
        const animation = {
            id: operation.id,
            type: 'page_access',
            key: operation.key,
            phase: 'searching',
            duration: 1500
        };
        
        setAnimations(prev => [...prev, animation]);
        
        setTimeout(() => {
            setAnimations(prev => prev.map(a => 
                a.id === animation.id ? { ...a, phase: 'found' } : a
            ));
        }, 300);
        
        setTimeout(() => {
            setAnimations(prev => prev.map(a => 
                a.id === animation.id ? { ...a, phase: 'accessing' } : a
            ));
        }, 800);
        
        setTimeout(() => {
            setAnimations(prev => prev.filter(a => a.id !== animation.id));
            setIsAnimating(false);
        }, 1500);
    };

    const simulatePageFault = () => {
        const faultAnimation = {
            id: Date.now(),
            type: 'page_fault',
            key: 'demo_key',
            phase: 'fault_detected',
            duration: 3000
        };
        
        setAnimations(prev => [...prev, faultAnimation]);
        setIsAnimating(true);
        
        // Page fault animation sequence
        setTimeout(() => {
            setAnimations(prev => prev.map(a => 
                a.id === faultAnimation.id ? { ...a, phase: 'searching_secondary' } : a
            ));
        }, 800);
        
        setTimeout(() => {
            setAnimations(prev => prev.map(a => 
                a.id === faultAnimation.id ? { ...a, phase: 'swapping_in' } : a
            ));
        }, 1600);
        
        setTimeout(() => {
            setAnimations(prev => prev.map(a => 
                a.id === faultAnimation.id ? { ...a, phase: 'complete' } : a
            ));
        }, 2400);
        
        setTimeout(() => {
            setAnimations(prev => prev.filter(a => a.id !== faultAnimation.id));
            setIsAnimating(false);
        }, 3000);
        
        // Add to operation history
        setOperationHistory(prev => [...prev.slice(-9), {
            type: 'PAGE_FAULT',
            key: 'demo_key',
            timestamp: Date.now(),
            pageId: 999
        }]);
    };

    const simulateSwapOut = () => {
        const swapAnimation = {
            id: Date.now(),
            type: 'swap_out',
            key: 'victim_page',
            phase: 'selecting_victim',
            duration: 2500
        };
        
        setAnimations(prev => [...prev, swapAnimation]);
        setIsAnimating(true);
        
        setTimeout(() => {
            setAnimations(prev => prev.map(a => 
                a.id === swapAnimation.id ? { ...a, phase: 'moving_to_secondary' } : a
            ));
        }, 800);
        
        setTimeout(() => {
            setAnimations(prev => prev.filter(a => a.id !== swapAnimation.id));
            setIsAnimating(false);
        }, 2500);
        
        setOperationHistory(prev => [...prev.slice(-9), {
            type: 'SWAP_OUT',
            key: 'victim_page',
            timestamp: Date.now(),
            pageId: 888
        }]);
    };

    const renderSwapFlow = () => {
        const memStatus = currentMemoryStatus || memoryStatus;
        
        return (
            <div className="swap-flow">
                <div className="memory-container primary">
                    <h4>Primary Memory (RAM)</h4>
                    <div className="memory-slots">
                        {Array(memStatus?.primary_capacity || 5).fill(null).map((_, index) => {
                            const page = memStatus?.primary_pages?.[index];
                            const hasAnimation = animations.some(anim => 
                                anim.phase === 'placing' || anim.phase === 'accessing'
                            );
                            
                            return (
                                <div 
                                    key={index} 
                                    className={`memory-slot ${page ? 'occupied' : 'empty'} ${hasAnimation ? 'animating' : ''}`}
                                >
                                    {page && (
                                        <>
                                            <div className="slot-id">#{page.id}</div>
                                            <div className="slot-key">{page.key}</div>
                                            <div className="slot-access">Access: {page.access_count}</div>
                                        </>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
                
                <div className="swap-arrows">
                    <div className="arrow-container">
                        <div className={`arrow swap-out ${isAnimating ? 'active' : ''}`}>
                            <span>Swap Out</span>
                            <div className="arrow-line">→</div>
                        </div>
                        <div className={`arrow swap-in ${isAnimating ? 'active' : ''}`}>
                            <div className="arrow-line">←</div>
                            <span>Swap In</span>
                        </div>
                    </div>
                    
                    {/* Demo Animation Controls */}
                    <div className="demo-controls">
                        <button 
                            onClick={simulatePageFault}
                            disabled={isAnimating}
                            className="demo-btn fault-btn"
                        >
                            Demo Page Fault
                        </button>
                        <button 
                            onClick={simulateSwapOut}
                            disabled={isAnimating}
                            className="demo-btn swap-btn"
                        >
                            Demo Swap Out
                        </button>
                    </div>
                </div>
                
                <div className="memory-container secondary">
                    <h4>Secondary Storage (Disk/Swap)</h4>
                    <div className="secondary-grid">
                        {memStatus?.secondary_pages?.map((page, index) => (
                            <div key={page.id} className="secondary-slot">
                                <div className="slot-id">#{page.id}</div>
                                <div className="slot-key">{page.key}</div>
                                <div className="slot-age">Age: {page.age_seconds || 0}s</div>
                            </div>
                        ))}
                        {(!memStatus?.secondary_pages || memStatus.secondary_pages.length === 0) && (
                            <div className="empty-secondary">No swapped pages</div>
                        )}
                    </div>
                </div>
                
                {/* Animation Overlays */}
                {animations.map(animation => (
                    <div key={animation.id} className={`animation-overlay ${animation.type} ${animation.phase}`}>
                        <div className="animation-page">
                            <div className="page-content">
                                {animation.type === 'page_fault' && '⚠️ Page Fault'}
                                {animation.type === 'swap_out' && '📤 Swapping Out'}
                                {animation.type === 'page_creation' && '🆕 New Page'}
                                {animation.type === 'page_access' && '🔍 Accessing'}
                            </div>
                            <div className="page-key">Key: {animation.key}</div>
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    const renderOperationHistory = () => (
        <div className="operation-history">
            <h4>Recent Operations</h4>
            <div className="history-list">
                {operationHistory.map((op, index) => (
                    <div key={index} className={`history-item ${op.type?.toLowerCase()}`}>
                        <span className="operation-type">{op.type?.replace('_', ' ')}</span>
                        <span className="operation-details">
                            {op.key && `Key: ${op.key}`} {op.pageId && ` (Page #${op.pageId})`}
                        </span>
                        <span className="operation-time">
                            {new Date(op.timestamp).toLocaleTimeString()}
                        </span>
                    </div>
                ))}
                {operationHistory.length === 0 && (
                    <div className="no-operations">
                        No operations yet. Try some PUT/GET operations or use demo buttons above.
                    </div>
                )}
            </div>
        </div>
    );

    return (
        <div className="swap-animator">
            <div className="animator-header">
                <h3>Swap Space Management Visualization</h3>
                <div className="legend">
                    <div className="legend-item">
                        <div className="legend-color primary-color"></div>
                        <span>Primary Memory</span>
                    </div>
                    <div className="legend-item">
                        <div className="legend-color secondary-color"></div>
                        <span>Secondary Storage</span>
                    </div>
                    <div className="legend-item">
                        <div className="legend-color fault-color"></div>
                        <span>Page Fault</span>
                    </div>
                </div>
            </div>
            
            {renderSwapFlow()}
            {renderOperationHistory()}
        </div>
    );
};

export default SwapAnimator;
