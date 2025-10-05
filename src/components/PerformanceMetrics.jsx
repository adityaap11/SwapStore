// src/components/PerformanceMetrics.jsx
import React, { useState, useEffect } from 'react';
import './PerformanceMetrics.css';

const PerformanceMetrics = ({ memoryStatus, refreshTrigger }) => {
    const [metrics, setMetrics] = useState({
        currentSession: {
            operations: 0,
            pageFaults: 0,
            hitRate: 0,
            avgResponseTime: 0,
            memoryUtilization: 0,
            primaryPages: 0,
            secondaryPages: 0
        },
        historical: [],
        trends: {
            hitRateHistory: [0],
            faultRateHistory: [0],
            utilizationHistory: [0]
        }
    });

    const [selectedTimeframe, setSelectedTimeframe] = useState('session');
    const [isCollectingMetrics, setIsCollectingMetrics] = useState(true);

    useEffect(() => {
        if (memoryStatus && isCollectingMetrics) {
            updateMetrics();
        }
    }, [memoryStatus, refreshTrigger]);

    const updateMetrics = () => {
        if (!memoryStatus) return;
        
        const currentTime = Date.now();
        const hitRate = memoryStatus.hit_rate || 0;
        const memoryUtilization = memoryStatus.primary_capacity 
            ? (memoryStatus.primary_used / memoryStatus.primary_capacity) * 100 
            : 0;
        
        const newMetrics = {
            timestamp: currentTime,
            operations: memoryStatus.total_operations || 0,
            pageFaults: memoryStatus.page_faults || 0,
            hitRate: hitRate,
            memoryUtilization: memoryUtilization,
            primaryPages: memoryStatus.primary_used || 0,
            secondaryPages: memoryStatus.secondary_used || 0
        };

        setMetrics(prev => ({
            currentSession: newMetrics,
            historical: [...prev.historical.slice(-29), newMetrics],
            trends: {
                hitRateHistory: [...prev.trends.hitRateHistory.slice(-19), hitRate],
                faultRateHistory: [...prev.trends.faultRateHistory.slice(-19), memoryStatus.page_faults || 0],
                utilizationHistory: [...prev.trends.utilizationHistory.slice(-19), memoryUtilization]
            }
        }));
    };

    const calculateThroughput = () => {
        if (metrics.historical.length < 2) return 0;
        const recent = metrics.historical.slice(-5);
        const timeSpan = recent[recent.length - 1]?.timestamp - recent[0]?.timestamp;
        const operationSpan = recent[recent.length - 1]?.operations - recent[0]?.operations;
        return timeSpan > 0 ? (operationSpan / (timeSpan / 1000)).toFixed(2) : 0;
    };

    const getPerformanceGrade = () => {
        const hitRate = metrics.currentSession.hitRate;
        if (hitRate >= 90) return { grade: 'A+', color: '#4CAF50', description: 'Excellent' };
        if (hitRate >= 80) return { grade: 'A', color: '#8BC34A', description: 'Very Good' };
        if (hitRate >= 70) return { grade: 'B', color: '#FFC107', description: 'Good' };
        if (hitRate >= 60) return { grade: 'C', color: '#FF9800', description: 'Fair' };
        return { grade: 'D', color: '#f44336', description: 'Poor' };
    };

    const renderMiniChart = (data, color, label) => {
        const max = Math.max(...data, 1);
        const points = data.map((value, index) => 
            `${(index / (data.length - 1)) * 100},${100 - (value / max) * 100}`
        ).join(' ');

        return (
            <div className="mini-chart">
                <div className="chart-label">{label}</div>
                <svg className="chart-svg" viewBox="0 0 100 40">
                    <polyline
                        points={points}
                        fill="none"
                        stroke={color}
                        strokeWidth="2"
                        vectorEffect="non-scaling-stroke"
                    />
                    <circle
                        cx={data.length > 1 ? "100" : "0"}
                        cy={data.length > 0 ? 100 - (data[data.length - 1] / max) * 100 : 50}
                        r="2"
                        fill={color}
                    />
                </svg>
                <div className="chart-value">
                    {data.length > 0 ? data[data.length - 1].toFixed(1) : 0}
                    {label.includes('Rate') ? '%' : ''}
                </div>
            </div>
        );
    };

    const renderPerformanceIndicator = (value, threshold, label, unit = '', reverse = false) => {
        const numValue = parseFloat(value) || 0;
        const isGood = reverse ? numValue <= threshold : numValue >= threshold;
        return (
            <div className={`performance-indicator ${isGood ? 'good' : 'poor'}`}>
                <div className="indicator-value">{value}{unit}</div>
                <div className="indicator-label">{label}</div>
                <div className={`indicator-status ${isGood ? 'good' : 'poor'}`}>
                    {isGood ? '✓' : '⚠'}
                </div>
            </div>
        );
    };

    const grade = getPerformanceGrade();

    return (
        <div className="performance-metrics">
            <div className="metrics-header">
                <h3>Performance Analytics</h3>
                <div className="metrics-controls">
                    <label>
                        <input
                            type="checkbox"
                            checked={isCollectingMetrics}
                            onChange={(e) => setIsCollectingMetrics(e.target.checked)}
                        />
                        Live Monitoring
                    </label>
                    <select
                        value={selectedTimeframe}
                        onChange={(e) => setSelectedTimeframe(e.target.value)}
                    >
                        <option value="session">Current Session</option>
                        <option value="recent">Last 10 Operations</option>
                        <option value="all">All Time</option>
                    </select>
                </div>
            </div>

            <div className="metrics-grid">
                {/* Overall Performance Grade */}
                <div className="metric-card grade-card">
                    <div className="grade-display" style={{ backgroundColor: grade.color }}>
                        <div className="grade-letter">{grade.grade}</div>
                        <div className="grade-description">{grade.description}</div>
                    </div>
                    <div className="grade-details">
                        <div>Hit Rate: {metrics.currentSession.hitRate.toFixed(1)}%</div>
                        <div>Page Faults: {metrics.currentSession.pageFaults}</div>
                    </div>
                </div>

                {/* Key Metrics */}
                <div className="metric-card">
                    <h4>Key Performance Indicators</h4>
                    <div className="kpi-grid">
                        {renderPerformanceIndicator(
                            metrics.currentSession.hitRate.toFixed(1), 
                            75, 
                            'Hit Rate', 
                            '%'
                        )}
                        {renderPerformanceIndicator(
                            metrics.currentSession.memoryUtilization.toFixed(1), 
                            80, 
                            'Memory Usage', 
                            '%'
                        )}
                        {renderPerformanceIndicator(
                            calculateThroughput(), 
                            1, 
                            'Throughput', 
                            ' ops/s'
                        )}
                        {renderPerformanceIndicator(
                            metrics.currentSession.pageFaults, 
                            5, 
                            'Page Faults', 
                            '', 
                            true
                        )}
                    </div>
                </div>

                {/* Trend Charts */}
                <div className="metric-card">
                    <h4>Performance Trends</h4>
                    <div className="trends-grid">
                        {renderMiniChart(metrics.trends.hitRateHistory, '#4CAF50', 'Hit Rate %')}
                        {renderMiniChart(metrics.trends.utilizationHistory, '#2196F3', 'Memory Usage %')}
                        {renderMiniChart(metrics.trends.faultRateHistory, '#f44336', 'Page Faults')}
                    </div>
                </div>

                {/* Memory Distribution */}
                <div className="metric-card">
                    <h4>Memory Distribution</h4>
                    <div className="memory-distribution">
                        <div className="distribution-chart">
                            <div 
                                className="distribution-segment primary"
                                style={{ 
                                    height: `${(metrics.currentSession.primaryPages / 
                                        (metrics.currentSession.primaryPages + metrics.currentSession.secondaryPages + 1)) * 100}%` 
                                }}
                            >
                                <span>Primary</span>
                                <span>{metrics.currentSession.primaryPages}</span>
                            </div>
                            <div 
                                className="distribution-segment secondary"
                                style={{ 
                                    height: `${(metrics.currentSession.secondaryPages / 
                                        (metrics.currentSession.primaryPages + metrics.currentSession.secondaryPages + 1)) * 100}%` 
                                }}
                            >
                                <span>Secondary</span>
                                <span>{metrics.currentSession.secondaryPages}</span>
                            </div>
                        </div>
                        <div className="distribution-legend">
                            <div className="legend-item">
                                <div className="legend-color primary"></div>
                                <span>Primary Memory ({metrics.currentSession.primaryPages} pages)</span>
                            </div>
                            <div className="legend-item">
                                <div className="legend-color secondary"></div>
                                <span>Secondary Storage ({metrics.currentSession.secondaryPages} pages)</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Detailed Statistics */}
                <div className="metric-card">
                    <h4>Detailed Statistics</h4>
                    <div className="stats-table">
                        <div className="stat-row">
                            <span className="stat-label">Total Operations:</span>
                            <span className="stat-value">{metrics.currentSession.operations}</span>
                        </div>
                        <div className="stat-row">
                            <span className="stat-label">Successful Hits:</span>
                            <span className="stat-value">
                                {metrics.currentSession.operations - metrics.currentSession.pageFaults}
                            </span>
                        </div>
                        <div className="stat-row">
                            <span className="stat-label">Page Faults:</span>
                            <span className="stat-value">{metrics.currentSession.pageFaults}</span>
                        </div>
                        <div className="stat-row">
                            <span className="stat-label">Fault Rate:</span>
                            <span className="stat-value">
                                {metrics.currentSession.operations > 0 
                                    ? ((metrics.currentSession.pageFaults / metrics.currentSession.operations) * 100).toFixed(1)
                                    : 0}%
                            </span>
                        </div>
                        <div className="stat-row">
                            <span className="stat-label">Throughput:</span>
                            <span className="stat-value">{calculateThroughput()} ops/sec</span>
                        </div>
                    </div>
                </div>

                {/* Performance Recommendations */}
                <div className="metric-card recommendations">
                    <h4>Performance Recommendations</h4>
                    <div className="recommendations-list">
                        {metrics.currentSession.operations === 0 && (
                            <div className="recommendation info">
                                <span className="rec-icon">💡</span>
                                <span>Start by performing some PUT and GET operations to see performance metrics.</span>
                            </div>
                        )}
                        {metrics.currentSession.hitRate < 70 && metrics.currentSession.operations > 0 && (
                            <div className="recommendation warning">
                                <span className="rec-icon">⚠️</span>
                                <span>Low hit rate detected. Consider increasing primary memory capacity.</span>
                            </div>
                        )}
                        {metrics.currentSession.memoryUtilization > 90 && (
                            <div className="recommendation info">
                                <span className="rec-icon">💡</span>
                                <span>High memory utilization. Monitor for potential thrashing.</span>
                            </div>
                        )}
                        {metrics.currentSession.pageFaults > metrics.currentSession.operations * 0.5 && metrics.currentSession.operations > 0 && (
                            <div className="recommendation error">
                                <span className="rec-icon">🚨</span>
                                <span>Excessive page faults. Review access patterns and consider LRU algorithm.</span>
                            </div>
                        )}
                        {metrics.currentSession.hitRate >= 85 && metrics.currentSession.operations > 5 && (
                            <div className="recommendation success">
                                <span className="rec-icon">✅</span>
                                <span>Excellent performance! Current configuration is well-optimized.</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PerformanceMetrics;
