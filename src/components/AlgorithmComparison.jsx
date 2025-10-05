// src/components/AlgorithmComparison.jsx
import React, { useState, useEffect } from 'react';
import './AlgorithmComparison.css';

const AlgorithmComparison = () => {
    const [algorithms] = useState(['FIFO', 'LRU', 'OPTIMAL']);
    const [currentAlgorithm, setCurrentAlgorithm] = useState('FIFO');
    const [comparisonData, setComparisonData] = useState({});
    const [simulationSequence, setSimulationSequence] = useState([
        'user1', 'user2', 'user3', 'user4', 'user5', 'user6', 'user1', 'user7', 'user2', 'user8'
    ]);
    const [isSimulating, setIsSimulating] = useState(false);

    const simulateAlgorithm = async (algorithm, sequence) => {
        let pageFaults = 0;
        let memoryState = [];
        let operations = [];
        const capacity = 5;

        sequence.forEach((key, index) => {
            const isInMemory = memoryState.some(page => page.key === key);

            if (!isInMemory) {
                pageFaults++;
                if (memoryState.length < capacity) {
                    memoryState.push({ key, accessTime: index, frequency: 1 });
                } else {
                    let victimIndex = 0;
                    switch (algorithm) {
                        case 'FIFO':
                            victimIndex = 0;
                            break;
                        case 'LRU':
                            victimIndex = memoryState.reduce((oldest, page, idx, arr) =>
                                page.accessTime < arr[oldest].accessTime ? idx : oldest, 0);
                            break;
                        case 'OPTIMAL':
                            victimIndex = memoryState.reduce((furthest, page, idx, arr) => {
                                const pageNextUse = sequence.slice(index + 1).indexOf(page.key);
                                const furthestNextUse = sequence.slice(index + 1).indexOf(arr[furthest].key);
                                return (pageNextUse === -1 || pageNextUse > furthestNextUse) ? idx : furthest;
                            }, 0);
                            break;
                        default:
                            victimIndex = 0;
                    }
                    memoryState[victimIndex] = { key, accessTime: index, frequency: 1 };
                }
            } else {
                const pageIndex = memoryState.findIndex(page => page.key === key);
                memoryState[pageIndex].accessTime = index;
                memoryState[pageIndex].frequency++;
            }

            operations.push({
                step: index + 1,
                operation: key,
                hit: isInMemory,
                memoryState: [...memoryState],
                pageFault: !isInMemory
            });
        });

        return {
            algorithm,
            pageFaults,
            hitRate: ((sequence.length - pageFaults) / sequence.length * 100).toFixed(1),
            operations
        };
    };

    const runComparison = async () => {
        setIsSimulating(true);
        const results = {};

        for (const algorithm of algorithms) {
            results[algorithm] = await simulateAlgorithm(algorithm, simulationSequence);
        }

        setComparisonData(results);
        setIsSimulating(false);
    };

    const updateSequence = (newSequence) => {
        setSimulationSequence(newSequence.split(',').map(s => s.trim()).filter(Boolean));
    };

    const renderAlgorithmDetails = (algorithm) => {
        const data = comparisonData[algorithm];
        if (!data) return null;
        return (
            <div className={`algorithm-result ${algorithm.toLowerCase()}`}>
                <div className="algorithm-header">
                    <h4>{algorithm}</h4>
                    <div className="algorithm-stats">
                        <div className="stat">
                            <span className="stat-label">Page Faults:</span>
                            <span className="stat-value">{data.pageFaults}</span>
                        </div>
                        <div className="stat">
                            <span className="stat-label">Hit Rate:</span>
                            <span className="stat-value">{data.hitRate}%</span>
                        </div>
                    </div>
                </div>

                <div className="operation-timeline">
                    {data.operations.slice(0, 10).map((op, index) => (
                        <div key={index} className={`timeline-step ${op.hit ? 'hit' : 'miss'}`}>
                            <div className="step-number">{op.step}</div>
                            <div className="step-operation">{op.operation}</div>
                            <div className="step-result">
                                {op.hit ? 'HIT' : 'MISS'}
                            </div>
                            <div className="step-memory">
                                {op.memoryState.map((page, idx) => (
                                    <span key={idx} className="memory-page">
                                        {page.key}
                                    </span>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    const renderAlgorithmDescription = (algorithm) => {
        const descriptions = {
            'FIFO': {
                name: 'First In, First Out',
                description: 'Replaces the page that has been in memory the longest. Simple but can suffer from Belady\'s anomaly.',
                pros: ['Simple to implement', 'Low overhead', 'Fair replacement'],
                cons: ['Can replace frequently used pages', 'Belady\'s anomaly possible', 'Not optimal performance']
            },
            'LRU': {
                name: 'Least Recently Used',
                description: 'Replaces the page that hasn\'t been used for the longest time. Good performance but more complex.',
                pros: ['Good locality of reference', 'Better hit rates', 'Intuitive behavior'],
                cons: ['More complex implementation', 'Higher overhead', 'Requires access tracking']
            },
            'OPTIMAL': {
                name: 'Optimal (Belady\'s Algorithm)',
                description: 'Replaces the page that will be used furthest in the future. Theoretical optimum but requires future knowledge.',
                pros: ['Minimum possible page faults', 'Theoretical benchmark', 'Perfect performance'],
                cons: ['Impossible in practice', 'Requires future knowledge', 'Only useful for comparison']
            }
        };

        const desc = descriptions[algorithm];
        return (
            <div className="algorithm-description">
                <h5>{desc.name}</h5>
                <p>{desc.description}</p>
                <div className="pros-cons">
                    <div className="pros">
                        <h6>Advantages:</h6>
                        <ul>
                            {desc.pros.map((pro, index) => (
                                <li key={index}>{pro}</li>
                            ))}
                        </ul>
                    </div>
                    <div className="cons">
                        <h6>Disadvantages:</h6>
                        <ul>
                            {desc.cons.map((con, index) => (
                                <li key={index}>{con}</li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
        );
    };

    useEffect(() => {
        runComparison();
    }, [simulationSequence]);

    return (
        <div className="algorithm-comparison">
            <div className="comparison-header">
                <h3>Page Replacement Algorithm Comparison</h3>
                <p>Compare how different algorithms handle the same sequence of memory accesses</p>
            </div>

            <div className="simulation-controls">
                <div className="sequence-input">
                    <label>Access Sequence:</label>
                    <input
                        type="text"
                        value={simulationSequence.join(', ')}
                        onChange={(e) => updateSequence(e.target.value)}
                        placeholder="user1, user2, user3, ..."
                    />
                </div>
                <button
                    onClick={runComparison}
                    disabled={isSimulating}
                    className="simulate-btn"
                >
                    {isSimulating ? 'Simulating...' : 'Run Simulation'}
                </button>
            </div>

            <div className="algorithms-grid">
                {algorithms.map(algorithm => (
                    <div key={algorithm} className="algorithm-section">
                        {renderAlgorithmDetails(algorithm)}
                        {renderAlgorithmDescription(algorithm)}
                    </div>
                ))}
            </div>

            <div className="comparison-summary">
                <h4>Performance Summary</h4>
                <div className="summary-chart">
                    {Object.entries(comparisonData).map(([algorithm, data]) => (
                        <div key={algorithm} className="summary-bar">
                            <div className="bar-label">{algorithm}</div>
                            <div className="bar-container">
                                <div
                                    className="bar-fill"
                                    style={{
                                        width: `${data.hitRate}%`,
                                        backgroundColor: algorithm === 'FIFO' ? '#4CAF50' :
                                            algorithm === 'LRU' ? '#2196F3' : '#ff9800'
                                    }}
                                >
                                    {data.hitRate}%
                                </div>
                            </div>
                            <div className="bar-faults">{data.pageFaults} faults</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default AlgorithmComparison;
