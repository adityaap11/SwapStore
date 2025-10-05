// src/components/KVOperations.jsx
import React, { useState } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import './KVOperations.css';

const KVOperations = ({ onOperation }) => {
    const [key, setKey] = useState('');
    const [value, setValue] = useState('');
    const [result, setResult] = useState('');
    const [loading, setLoading] = useState(false);

    const handlePut = async () => {
        if (!key.trim() || !value.trim()) {
            setResult('❌ Please enter both key and value');
            return;
        }

        setLoading(true);
        try {
            await invoke('put_value', { key: key.trim(), value: value.trim() });
            setResult(`✅ PUT successful: ${key} → ${value}`);
            
            // Notify parent component
            if (onOperation) {
                onOperation('PUT', key.trim(), value.trim());
            }
            
            // Clear inputs
            setKey('');
            setValue('');
        } catch (error) {
            setResult(`❌ PUT failed: ${error}`);
            console.error('PUT operation failed:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleGet = async () => {
        if (!key.trim()) {
            setResult('❌ Please enter a key to retrieve');
            return;
        }

        setLoading(true);
        try {
            const retrievedValue = await invoke('get_value', { key: key.trim() });
            if (retrievedValue !== null && retrievedValue !== undefined) {
                setResult(`✅ GET successful: ${key} → ${retrievedValue}`);
            } else {
                setResult(`❌ Key not found: ${key}`);
            }
            
            // Notify parent component
            if (onOperation) {
                onOperation('GET', key.trim(), retrievedValue);
            }
            
        } catch (error) {
            setResult(`❌ GET failed: ${error}`);
            console.error('GET operation failed:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleClear = async () => {
        try {
            await invoke('clear_memory');
            setResult('✅ Memory cleared successfully');
            
            // Notify parent component
            if (onOperation) {
                onOperation('CLEAR', '', '');
            }
            
            setKey('');
            setValue('');
        } catch (error) {
            setResult(`❌ Clear failed: ${error}`);
            console.error('Clear operation failed:', error);
        }
    };

    const quickTestData = [
        { key: 'user1', value: 'Alice' },
        { key: 'user2', value: 'Bob' },
        { key: 'user3', value: 'Charlie' },
        { key: 'user4', value: 'Diana' },
        { key: 'user5', value: 'Eve' },
        { key: 'user6', value: 'Frank' },
        { key: 'user7', value: 'Grace' }
    ];

    const loadTestData = async () => {
        setLoading(true);
        let successCount = 0;
        
        for (const item of quickTestData) {
            try {
                await invoke('put_value', { key: item.key, value: item.value });
                successCount++;
                
                // Notify parent component for each operation
                if (onOperation) {
                    onOperation('PUT', item.key, item.value);
                }
                
                // Small delay to see progressive loading
                await new Promise(resolve => setTimeout(resolve, 200));
            } catch (error) {
                console.error(`Failed to load ${item.key}:`, error);
            }
        }
        
        setResult(`✅ Loaded ${successCount}/${quickTestData.length} test entries`);
        setLoading(false);
    };

    return (
        <div className="kv-operations">
            <div className="operations-header">
                <h3>Key-Value Operations</h3>
                <p>Store and retrieve data to see memory management in action</p>
            </div>

            <div className="operation-form">
                <div className="input-group">
                    <label htmlFor="key-input">Key:</label>
                    <input
                        id="key-input"
                        type="text"
                        value={key}
                        onChange={(e) => setKey(e.target.value)}
                        placeholder="Enter key (e.g., user1)"
                        disabled={loading}
                    />
                </div>

                <div className="input-group">
                    <label htmlFor="value-input">Value:</label>
                    <input
                        id="value-input"
                        type="text"
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                        placeholder="Enter value (e.g., Alice)"
                        disabled={loading}
                    />
                </div>

                <div className="button-group">
                    <button 
                        onClick={handlePut} 
                        disabled={loading}
                        className="btn-put"
                    >
                        {loading ? 'Processing...' : 'PUT (Store)'}
                    </button>
                    <button 
                        onClick={handleGet} 
                        disabled={loading}
                        className="btn-get"
                    >
                        {loading ? 'Processing...' : 'GET (Retrieve)'}
                    </button>
                </div>
            </div>

            <div className="quick-actions">
                <h4>Quick Actions</h4>
                <div className="button-group">
                    <button 
                        onClick={loadTestData} 
                        disabled={loading}
                        className="btn-test"
                    >
                        Load Test Data
                    </button>
                    <button 
                        onClick={handleClear} 
                        disabled={loading}
                        className="btn-clear"
                    >
                        Clear All
                    </button>
                </div>
            </div>

            <div className="result-area">
                <h4>Result</h4>
                <div className="result-display">
                    {result || 'No operations performed yet'}
                </div>
            </div>
        </div>
    );
};

export default KVOperations;
