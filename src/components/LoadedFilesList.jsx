import React, { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/tauri';

const LoadedFilesList = () => {
  const [files, setFiles] = useState([]);

  useEffect(() => {
    fetchFiles();
  }, []);

  const fetchFiles = async () => {
    try {
      const loaded = await invoke('get_loaded_files');
      setFiles(loaded);
    } catch (err) {}
  };

  const formatSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="loaded-files-list" style={{ width: '100%', maxWidth: 820, margin: '0 auto', background: '#fff', borderRadius: 12, boxShadow: '0 1px 8px rgba(0,0,0,0.04)', padding: '2rem' }}>
      <h2 style={{ fontWeight: 700, fontSize: 24, marginBottom: 20, display: 'flex', alignItems: 'center' }}>
        <span style={{ fontSize: 28, marginRight: 6 }}>📋</span> Loaded Files ({files.length})
      </h2>
      {files.length === 0 ? (
        <div style={{ color: '#888', textAlign: 'center', margin: '2rem 0' }}>No files loaded.</div>
      ) : (
        <table className="w-full text-sm" style={{width: '100%'}}>
          <thead>
            <tr>
              <th style={{ padding: '0.6rem', textAlign: 'left' }}>#</th>
              <th style={{ padding: '0.6rem', textAlign: 'left' }}>File Name</th>
              <th style={{ padding: '0.6rem', textAlign: 'left' }}>Size</th>
              <th style={{ padding: '0.6rem', textAlign: 'left' }}>Path</th>
            </tr>
          </thead>
          <tbody>
            {files.map((file, idx) => (
              <tr key={idx} style={{ borderBottom: '1px solid #f0f0f0' }}>
                <td style={{ padding: '0.6rem', fontFamily: 'mono', color: '#555' }}>{idx + 1}</td>
                <td style={{ padding: '0.6rem', fontWeight: 600 }}>{file.name}</td>
                <td style={{ padding: '0.6rem', color: '#0582ca', fontWeight: 700 }}>{formatSize(file.size)}</td>
                <td style={{ padding: '0.6rem', fontSize: 13, color: '#aaa', maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.path}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default LoadedFilesList;
