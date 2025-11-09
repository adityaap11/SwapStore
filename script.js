// SwapStore - JavaScript Simulation Engine
// Main simulation controller and visualization handler

// Constants
const PAGE_SIZE = 4096; // 4KB

// Global State
let state = {
    ramSize: 16384, // KB
    numFrames: 0,
    pageSize: PAGE_SIZE,
    algorithm: 'fifo',
    files: [],
    memory: [],
    swapSpace: [],
    statistics: {
        pageFaults: 0,
        pageHits: 0,
        swapOuts: 0,
        swapIns: 0,
        totalAccesses: 0
    },
    isRunning: false,
    isPaused: false,
    animationSpeed: 1000,
    currentStep: 0,
    simulationQueue: []
};

// Page Replacement Algorithms
class PageReplacementAlgorithms {
    constructor() {
        this.fifoQueue = [];
        this.lruMap = new Map();
        this.timeCounter = 0;
    }

    reset() {
        this.fifoQueue = [];
        this.lruMap = new Map();
        this.timeCounter = 0;
    }

    // FIFO Algorithm
    fifo(pageRequest) {
        const { processId, pageNumber } = pageRequest;
        const pageKey = `${processId}-${pageNumber}`;

        // Check if page is in memory
        const frameIndex = state.memory.findIndex(
            frame => frame && frame.processId === processId && frame.pageNumber === pageNumber
        );

        if (frameIndex !== -1) {
            // Page Hit
            state.statistics.pageHits++;
            return {
                type: 'HIT',
                frameIndex,
                victim: null
            };
        }

        // Page Fault
        state.statistics.pageFaults++;

        // Find empty frame
        const emptyFrame = state.memory.findIndex(frame => frame === null);
        if (emptyFrame !== -1) {
            state.memory[emptyFrame] = { processId, pageNumber, timestamp: Date.now() };
            this.fifoQueue.push({ processId, pageNumber, frameIndex: emptyFrame });
            state.statistics.swapIns++;
            return {
                type: 'MISS',
                frameIndex: emptyFrame,
                victim: null
            };
        }

        // Need to replace - use FIFO
        const victim = this.fifoQueue.shift();
        const victimFrame = victim.frameIndex;

        state.swapSpace.push(state.memory[victimFrame]);
        state.memory[victimFrame] = { processId, pageNumber, timestamp: Date.now() };
        this.fifoQueue.push({ processId, pageNumber, frameIndex: victimFrame });

        state.statistics.swapOuts++;
        state.statistics.swapIns++;

        return {
            type: 'MISS',
            frameIndex: victimFrame,
            victim: victim
        };
    }

    // LRU Algorithm
    lru(pageRequest) {
        const { processId, pageNumber } = pageRequest;
        const pageKey = `${processId}-${pageNumber}`;
        this.timeCounter++;

        // Check if page is in memory
        const frameIndex = state.memory.findIndex(
            frame => frame && frame.processId === processId && frame.pageNumber === pageNumber
        );

        if (frameIndex !== -1) {
            // Page Hit - update access time
            state.statistics.pageHits++;
            this.lruMap.set(pageKey, this.timeCounter);
            state.memory[frameIndex].lastAccess = this.timeCounter;
            return {
                type: 'HIT',
                frameIndex,
                victim: null
            };
        }

        // Page Fault
        state.statistics.pageFaults++;

        // Find empty frame
        const emptyFrame = state.memory.findIndex(frame => frame === null);
        if (emptyFrame !== -1) {
            state.memory[emptyFrame] = { 
                processId, 
                pageNumber, 
                timestamp: Date.now(),
                lastAccess: this.timeCounter
            };
            this.lruMap.set(pageKey, this.timeCounter);
            state.statistics.swapIns++;
            return {
                type: 'MISS',
                frameIndex: emptyFrame,
                victim: null
            };
        }

        // Find LRU page
        let lruTime = Infinity;
        let victimFrame = 0;

        state.memory.forEach((frame, index) => {
            if (frame) {
                const key = `${frame.processId}-${frame.pageNumber}`;
                const accessTime = this.lruMap.get(key) || 0;
                if (accessTime < lruTime) {
                    lruTime = accessTime;
                    victimFrame = index;
                }
            }
        });

        const victim = state.memory[victimFrame];
        state.swapSpace.push(victim);
        state.memory[victimFrame] = { 
            processId, 
            pageNumber, 
            timestamp: Date.now(),
            lastAccess: this.timeCounter
        };
        this.lruMap.set(pageKey, this.timeCounter);

        state.statistics.swapOuts++;
        state.statistics.swapIns++;

        return {
            type: 'MISS',
            frameIndex: victimFrame,
            victim: victim
        };
    }

    // Optimal Algorithm
    optimal(pageRequest, futureRequests) {
        const { processId, pageNumber } = pageRequest;

        // Check if page is in memory
        const frameIndex = state.memory.findIndex(
            frame => frame && frame.processId === processId && frame.pageNumber === pageNumber
        );

        if (frameIndex !== -1) {
            // Page Hit
            state.statistics.pageHits++;
            return {
                type: 'HIT',
                frameIndex,
                victim: null
            };
        }

        // Page Fault
        state.statistics.pageFaults++;

        // Find empty frame
        const emptyFrame = state.memory.findIndex(frame => frame === null);
        if (emptyFrame !== -1) {
            state.memory[emptyFrame] = { processId, pageNumber, timestamp: Date.now() };
            state.statistics.swapIns++;
            return {
                type: 'MISS',
                frameIndex: emptyFrame,
                victim: null
            };
        }

        // Find page that won't be used for longest time
        let farthest = -1;
        let victimFrame = 0;

        state.memory.forEach((frame, index) => {
            if (frame) {
                let nextUse = Infinity;

                for (let i = 0; i < futureRequests.length; i++) {
                    if (futureRequests[i].processId === frame.processId && 
                        futureRequests[i].pageNumber === frame.pageNumber) {
                        nextUse = i;
                        break;
                    }
                }

                if (nextUse > farthest) {
                    farthest = nextUse;
                    victimFrame = index;
                }
            }
        });

        const victim = state.memory[victimFrame];
        state.swapSpace.push(victim);
        state.memory[victimFrame] = { processId, pageNumber, timestamp: Date.now() };

        state.statistics.swapOuts++;
        state.statistics.swapIns++;

        return {
            type: 'MISS',
            frameIndex: victimFrame,
            victim: victim
        };
    }
}

// Initialize algorithm handler
const algorithms = new PageReplacementAlgorithms();

// DOM Elements
const elements = {
    ramSize: document.getElementById('ramSize'),
    pageSize: document.getElementById('pageSize'),
    algorithm: document.getElementById('algorithm'),
    fileInput: document.getElementById('fileInput'),
    initButton: document.getElementById('initButton'),
    startButton: document.getElementById('startButton'),
    stepButton: document.getElementById('stepButton'),
    pauseButton: document.getElementById('pauseButton'),
    resetButton: document.getElementById('resetButton'),
    speedSlider: document.getElementById('speedSlider'),
    speedValue: document.getElementById('speedValue'),
    compareButton: document.getElementById('compareButton'),

    frameCount: document.getElementById('frameCount'),
    fileList: document.getElementById('fileList'),
    ramVisualization: document.getElementById('ramVisualization'),
    swapVisualization: document.getElementById('swapVisualization'),

    ramUsed: document.getElementById('ramUsed'),
    ramFree: document.getElementById('ramFree'),
    swapUsed: document.getElementById('swapUsed'),
    swapTotal: document.getElementById('swapTotal'),

    pageFaults: document.getElementById('pageFaults'),
    pageHits: document.getElementById('pageHits'),
    swapOuts: document.getElementById('swapOuts'),
    swapIns: document.getElementById('swapIns'),
    hitRate: document.getElementById('hitRate'),
    totalAccesses: document.getElementById('totalAccesses'),

    activityLog: document.getElementById('activityLog'),
    comparisonResults: document.getElementById('comparisonResults')
};

// Event Listeners
function initializeEventListeners() {
    elements.ramSize.addEventListener('change', updateFrameCount);
    elements.algorithm.addEventListener('change', (e) => {
        state.algorithm = e.target.value;
        addLog(`Algorithm changed to: ${e.target.value.toUpperCase()}`);
    });

    elements.fileInput.addEventListener('change', handleFileUpload);
    elements.initButton.addEventListener('click', initializeSimulation);
    elements.startButton.addEventListener('click', startSimulation);
    elements.stepButton.addEventListener('click', stepSimulation);
    elements.pauseButton.addEventListener('click', pauseSimulation);
    elements.resetButton.addEventListener('click', resetSimulation);
    elements.compareButton.addEventListener('click', compareAlgorithms);

    elements.speedSlider.addEventListener('input', (e) => {
        state.animationSpeed = parseInt(e.target.value);
        elements.speedValue.textContent = `${state.animationSpeed}ms`;
    });
}

// Update frame count
function updateFrameCount() {
    state.ramSize = parseInt(elements.ramSize.value);
    state.numFrames = Math.floor((state.ramSize * 1024) / PAGE_SIZE);
    elements.frameCount.textContent = state.numFrames;
    addLog(`RAM size set to ${state.ramSize} KB (${state.numFrames} frames)`);
}

// Handle file upload
function handleFileUpload(event) {
    const files = Array.from(event.target.files);

    files.forEach((file, index) => {
        const fileData = {
            id: state.files.length,
            name: file.name,
            size: file.size,
            pages: Math.ceil(file.size / PAGE_SIZE)
        };
        state.files.push(fileData);
        addLog(`File loaded: ${file.name} (${formatBytes(file.size)}, ${fileData.pages} pages)`);
    });

    displayFiles();
}

// Display loaded files
function displayFiles() {
    if (state.files.length === 0) {
        elements.fileList.innerHTML = '<p class="empty-state">No files loaded. Upload files to begin simulation.</p>';
        return;
    }

    elements.fileList.innerHTML = '';
    state.files.forEach(file => {
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';
        fileItem.innerHTML = `
            <h4>📄 ${file.name}</h4>
            <p>Size: ${formatBytes(file.size)}</p>
            <p>Pages: ${file.pages}</p>
            <p>Process ID: ${file.id}</p>
        `;
        elements.fileList.appendChild(fileItem);
    });
}

// Initialize simulation
function initializeSimulation() {
    if (state.files.length === 0) {
        alert('Please upload at least one file first!');
        return;
    }

    state.ramSize = parseInt(elements.ramSize.value);
    state.numFrames = Math.floor((state.ramSize * 1024) / PAGE_SIZE);
    state.memory = new Array(state.numFrames).fill(null);
    state.swapSpace = [];

    // Generate simulation queue (page reference string)
    state.simulationQueue = generatePageReferenceString();

    // Reset statistics
    resetStatistics();
    algorithms.reset();

    // Enable control buttons
    elements.startButton.disabled = false;
    elements.stepButton.disabled = false;

    // Render memory visualization
    renderMemoryVisualization();

    addLog(`Simulation initialized with ${state.numFrames} frames using ${state.algorithm.toUpperCase()} algorithm`, 'success');
    addLog(`Generated ${state.simulationQueue.length} page references from ${state.files.length} file(s)`);
}

// Generate page reference string from loaded files
function generatePageReferenceString() {
    const references = [];

    // For each file, generate page accesses
    state.files.forEach(file => {
        // Simulate sequential access
        for (let page = 0; page < file.pages; page++) {
            references.push({
                processId: file.id,
                pageNumber: page,
                fileName: file.name
            });
        }

        // Add some random accesses for realism
        const randomAccesses = Math.min(20, file.pages * 2);
        for (let i = 0; i < randomAccesses; i++) {
            references.push({
                processId: file.id,
                pageNumber: Math.floor(Math.random() * file.pages),
                fileName: file.name
            });
        }
    });

    // Shuffle for more realistic access pattern
    for (let i = references.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [references[i], references[j]] = [references[j], references[i]];
    }

    return references;
}

// Start simulation
async function startSimulation() {
    if (state.isRunning) return;

    state.isRunning = true;
    state.isPaused = false;
    elements.startButton.disabled = true;
    elements.pauseButton.disabled = false;
    elements.stepButton.disabled = true;

    addLog('Simulation started', 'success');

    while (state.currentStep < state.simulationQueue.length && state.isRunning && !state.isPaused) {
        await stepSimulation();
        await sleep(state.animationSpeed);
    }

    if (state.currentStep >= state.simulationQueue.length) {
        addLog('Simulation completed!', 'success');
        state.isRunning = false;
        elements.pauseButton.disabled = true;
    }
}

// Step through simulation
async function stepSimulation() {
    if (state.currentStep >= state.simulationQueue.length) {
        addLog('Simulation completed!', 'success');
        return;
    }

    const pageRequest = state.simulationQueue[state.currentStep];
    const futureRequests = state.simulationQueue.slice(state.currentStep + 1);

    let result;
    switch (state.algorithm) {
        case 'fifo':
            result = algorithms.fifo(pageRequest);
            break;
        case 'lru':
            result = algorithms.lru(pageRequest);
            break;
        case 'optimal':
            result = algorithms.optimal(pageRequest, futureRequests);
            break;
    }

    state.statistics.totalAccesses++;

    // Log the result
    const logMessage = `Step ${state.currentStep + 1}: ${result.type} - Process ${pageRequest.processId}, Page ${pageRequest.pageNumber} → Frame ${result.frameIndex}`;
    addLog(logMessage, result.type === 'HIT' ? 'success' : 'warning');

    // Update visualization
    renderMemoryVisualization();
    highlightFrame(result.frameIndex, result.type === 'HIT' ? 'hit' : 'miss');
    updateStatistics();

    state.currentStep++;

    return result;
}

// Pause simulation
function pauseSimulation() {
    state.isPaused = true;
    state.isRunning = false;
    elements.startButton.disabled = false;
    elements.pauseButton.disabled = true;
    elements.stepButton.disabled = false;
    addLog('Simulation paused');
}

// Reset simulation
function resetSimulation() {
    state.isRunning = false;
    state.isPaused = false;
    state.currentStep = 0;
    state.memory = new Array(state.numFrames).fill(null);
    state.swapSpace = [];
    resetStatistics();
    algorithms.reset();

    elements.startButton.disabled = state.files.length === 0;
    elements.stepButton.disabled = state.files.length === 0;
    elements.pauseButton.disabled = true;

    renderMemoryVisualization();
    updateStatistics();
    addLog('Simulation reset', 'warning');
}

// Reset statistics
function resetStatistics() {
    state.statistics = {
        pageFaults: 0,
        pageHits: 0,
        swapOuts: 0,
        swapIns: 0,
        totalAccesses: 0
    };
    updateStatistics();
}

// Update statistics display
function updateStatistics() {
    elements.pageFaults.textContent = state.statistics.pageFaults;
    elements.pageHits.textContent = state.statistics.pageHits;
    elements.swapOuts.textContent = state.statistics.swapOuts;
    elements.swapIns.textContent = state.statistics.swapIns;
    elements.totalAccesses.textContent = state.statistics.totalAccesses;

    const hitRate = state.statistics.totalAccesses > 0 
        ? ((state.statistics.pageHits / state.statistics.totalAccesses) * 100).toFixed(2)
        : 0;
    elements.hitRate.textContent = `${hitRate}%`;

    // Update memory stats
    const usedFrames = state.memory.filter(frame => frame !== null).length;
    const usedKB = Math.floor((usedFrames * PAGE_SIZE) / 1024);
    const freeKB = state.ramSize - usedKB;

    elements.ramUsed.textContent = `${usedKB} KB`;
    elements.ramFree.textContent = `${freeKB} KB`;
    elements.swapUsed.textContent = state.swapSpace.length;
    elements.swapTotal.textContent = `${state.ramSize * 2} KB`;
}

// Render memory visualization
function renderMemoryVisualization() {
    // Render RAM
    elements.ramVisualization.innerHTML = '';
    state.memory.forEach((frame, index) => {
        const frameElement = document.createElement('div');
        frameElement.className = `page-frame ${frame ? 'occupied' : 'empty'}`;
        frameElement.innerHTML = frame 
            ? `<div class="frame-number">F${index}</div>
               <div class="page-info">P${frame.processId}:${frame.pageNumber}</div>`
            : `<div class="frame-number">F${index}</div>
               <div class="page-info">Empty</div>`;
        elements.ramVisualization.appendChild(frameElement);
    });

    // Render Swap Space
    elements.swapVisualization.innerHTML = '';
    if (state.swapSpace.length === 0) {
        const emptyMsg = document.createElement('p');
        emptyMsg.className = 'empty-state';
        emptyMsg.textContent = 'No pages in swap space';
        elements.swapVisualization.appendChild(emptyMsg);
    } else {
        state.swapSpace.slice(-20).forEach((page, index) => {
            const pageElement = document.createElement('div');
            pageElement.className = 'page-frame occupied';
            pageElement.innerHTML = `<div class="frame-number">S${index}</div>
                                    <div class="page-info">P${page.processId}:${page.pageNumber}</div>`;
            elements.swapVisualization.appendChild(pageElement);
        });
    }
}

// Highlight frame animation
function highlightFrame(frameIndex, type) {
    const frames = elements.ramVisualization.children;
    if (frames[frameIndex]) {
        frames[frameIndex].classList.add(type);
        setTimeout(() => {
            frames[frameIndex].classList.remove(type);
        }, 500);
    }
}

// Compare all algorithms
async function compareAlgorithms() {
    if (state.files.length === 0) {
        alert('Please load files first!');
        return;
    }

    addLog('Starting algorithm comparison...', 'info');

    const algorithms_list = ['fifo', 'lru', 'optimal'];
    const results = [];

    for (const algo of algorithms_list) {
        // Save current state
        const originalAlgo = state.algorithm;
        const originalMemory = [...state.memory];
        const originalStats = { ...state.statistics };
        const originalStep = state.currentStep;

        // Reset for comparison
        state.algorithm = algo;
        state.memory = new Array(state.numFrames).fill(null);
        state.swapSpace = [];
        resetStatistics();
        algorithms.reset();
        state.currentStep = 0;

        // Run simulation
        const startTime = performance.now();
        while (state.currentStep < state.simulationQueue.length) {
            const pageRequest = state.simulationQueue[state.currentStep];
            const futureRequests = state.simulationQueue.slice(state.currentStep + 1);

            switch (algo) {
                case 'fifo':
                    algorithms.fifo(pageRequest);
                    break;
                case 'lru':
                    algorithms.lru(pageRequest);
                    break;
                case 'optimal':
                    algorithms.optimal(pageRequest, futureRequests);
                    break;
            }

            state.statistics.totalAccesses++;
            state.currentStep++;
        }
        const endTime = performance.now();

        // Store results
        const hitRate = ((state.statistics.pageHits / state.statistics.totalAccesses) * 100).toFixed(2);
        results.push({
            algorithm: algo.toUpperCase(),
            pageFaults: state.statistics.pageFaults,
            pageHits: state.statistics.pageHits,
            swapOuts: state.statistics.swapOuts,
            swapIns: state.statistics.swapIns,
            hitRate: hitRate,
            executionTime: (endTime - startTime).toFixed(2)
        });

        // Restore original state
        state.algorithm = originalAlgo;
        state.memory = originalMemory;
        state.statistics = originalStats;
        state.currentStep = originalStep;
    }

    // Display comparison results
    displayComparisonResults(results);
    addLog('Algorithm comparison completed', 'success');
}

// Display comparison results
function displayComparisonResults(results) {
    const tableHTML = `
        <table class="comparison-table">
            <thead>
                <tr>
                    <th>Algorithm</th>
                    <th>Page Faults</th>
                    <th>Page Hits</th>
                    <th>Hit Rate</th>
                    <th>Swap Outs</th>
                    <th>Swap Ins</th>
                    <th>Execution Time (ms)</th>
                </tr>
            </thead>
            <tbody>
                ${results.map(result => `
                    <tr>
                        <td><strong>${result.algorithm}</strong></td>
                        <td>${result.pageFaults}</td>
                        <td>${result.pageHits}</td>
                        <td>${result.hitRate}%</td>
                        <td>${result.swapOuts}</td>
                        <td>${result.swapIns}</td>
                        <td>${result.executionTime}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>

        <div style="margin-top: 20px; padding: 15px; background: #f0f9ff; border-radius: 8px;">
            <h3 style="color: #0369a1; margin-bottom: 10px;">Analysis:</h3>
            <p><strong>Best for Page Faults:</strong> ${getBestAlgorithm(results, 'pageFaults', false)}</p>
            <p><strong>Best Hit Rate:</strong> ${getBestAlgorithm(results, 'hitRate', true)}</p>
            <p><strong>Fastest Execution:</strong> ${getBestAlgorithm(results, 'executionTime', false)}</p>
        </div>
    `;

    elements.comparisonResults.innerHTML = tableHTML;
}

// Get best performing algorithm
function getBestAlgorithm(results, metric, higherIsBetter) {
    let best = results[0];
    results.forEach(result => {
        if (higherIsBetter) {
            if (parseFloat(result[metric]) > parseFloat(best[metric])) {
                best = result;
            }
        } else {
            if (parseFloat(result[metric]) < parseFloat(best[metric])) {
                best = result;
            }
        }
    });
    return `${best.algorithm} (${best[metric]}${metric === 'hitRate' ? '%' : metric === 'executionTime' ? 'ms' : ''})`;
}

// Add log entry
function addLog(message, type = 'info') {
    const logEntry = document.createElement('p');
    logEntry.className = `log-entry ${type}`;
    const timestamp = new Date().toLocaleTimeString();
    logEntry.textContent = `[${timestamp}] ${message}`;
    elements.activityLog.insertBefore(logEntry, elements.activityLog.firstChild);

    // Keep only last 50 entries
    while (elements.activityLog.children.length > 50) {
        elements.activityLog.removeChild(elements.activityLog.lastChild);
    }
}

// Utility: Format bytes
function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

// Utility: Sleep function
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Save simulation state
function saveSimulationState() {
    const simulationData = {
        ramSize: state.ramSize,
        algorithm: state.algorithm,
        files: state.files,
        statistics: state.statistics,
        timestamp: new Date().toISOString()
    };

    const dataStr = JSON.stringify(simulationData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `swapstore-simulation-${Date.now()}.json`;
    link.click();

    addLog('Simulation state saved', 'success');
}

// Export statistics to CSV
function exportStatistics() {
    const csv = [
        ['Metric', 'Value'],
        ['RAM Size (KB)', state.ramSize],
        ['Number of Frames', state.numFrames],
        ['Algorithm', state.algorithm.toUpperCase()],
        ['Total Page Accesses', state.statistics.totalAccesses],
        ['Page Faults', state.statistics.pageFaults],
        ['Page Hits', state.statistics.pageHits],
        ['Hit Rate (%)', ((state.statistics.pageHits / state.statistics.totalAccesses) * 100).toFixed(2)],
        ['Swap Outs', state.statistics.swapOuts],
        ['Swap Ins', state.statistics.swapIns],
        ['Files Loaded', state.files.length]
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `swapstore-stats-${Date.now()}.csv`;
    link.click();

    addLog('Statistics exported to CSV', 'success');
}

// Initialize keyboard shortcuts
function initializeKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        // Ctrl+Space: Start/Pause
        if (e.ctrlKey && e.code === 'Space') {
            e.preventDefault();
            if (state.isRunning && !state.isPaused) {
                pauseSimulation();
            } else {
                startSimulation();
            }
        }

        // Ctrl+S: Step
        if (e.ctrlKey && e.key === 's') {
            e.preventDefault();
            if (!state.isRunning) {
                stepSimulation();
            }
        }

        // Ctrl+R: Reset
        if (e.ctrlKey && e.key === 'r') {
            e.preventDefault();
            resetSimulation();
        }
    });
}

// Initialize application
function initializeApp() {
    updateFrameCount();
    initializeEventListeners();
    initializeKeyboardShortcuts();
    renderMemoryVisualization();

    addLog('SwapStore initialized successfully', 'success');
    addLog('Upload files and click "Initialize Simulation" to begin');
    addLog('Keyboard shortcuts: Ctrl+Space (Start/Pause), Ctrl+S (Step), Ctrl+R (Reset)');
}

// Run initialization when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}

// Export functions for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        PageReplacementAlgorithms,
        formatBytes,
        generatePageReferenceString
    };
}
