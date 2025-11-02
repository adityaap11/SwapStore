import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import { open } from '@tauri-apps/api/dialog';

const FileLoader = ({ onFilesLoaded }) => {
  const [loading, setLoading] = useState(false);
  const [loadedFiles, setLoadedFiles] = useState([]);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Always fetch from backend on mount
  useEffect(() => {
    fetchLoadedFiles();
    // Optionally, subscribe to refresh props if needed
  }, []);

  const fetchLoadedFiles = async () => {
    try {
      const files = await invoke('get_loaded_files');
      setLoadedFiles(files);
    } catch {
      setLoadedFiles([]);
    }
  };

  const handleSelectFile = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(false);

      const selected = await open({
        multiple: false,
        filters: [{ name: 'All Files', extensions: ['*'] }]
      });

      if (selected) {
        await invoke('load_file', { filePath: selected });
        setSuccess(true);
        await fetchLoadedFiles();
        if (onFilesLoaded) onFilesLoaded();
      }
      setLoading(false);
    } catch (err) {
      setError(err.toString());
      setLoading(false);
    }
  };

  const handleSelectMultipleFiles = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(false);

      const selected = await open({
        multiple: true,
        filters: [{ name: 'All Files', extensions: ['*'] }]
      });

      if (selected && selected.length > 0) {
        await invoke('load_multiple_files', { filePaths: selected });
        setSuccess(true);
        await fetchLoadedFiles();
        if (onFilesLoaded) onFilesLoaded();
      }
      setLoading(false);
    } catch (err) {
      setError(err.toString());
      setLoading(false);
    }
  };

  const handleClearFiles = async () => {
    try {
      setLoading(true);
      await invoke('clear_memory');
      await fetchLoadedFiles();
      setSuccess(false);
      setLoading(false);
      if (onFilesLoaded) onFilesLoaded();
    } catch (err) {
      setError('Could not clear backend memory.');
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold flex items-center gap-2">
          <span className="text-2xl">📁</span>
          File-Based Input
        </h3>
        {loadedFiles.length > 0 && (
          <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
            {loadedFiles.length} file{loadedFiles.length !== 1 ? 's' : ''} loaded
          </span>
        )}
      </div>
      {/* Action Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        <button
          onClick={handleSelectFile}
          disabled={loading}
          className="px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 transition-all flex items-center justify-center gap-2 font-semibold shadow-md hover:shadow-lg"
        >
          <span className="text-xl">📄</span>
          {loading ? 'Loading...' : 'Select Single File'}
        </button>

        <button
          onClick={handleSelectMultipleFiles}
          disabled={loading}
          className="px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-gray-300 transition-all flex items-center justify-center gap-2 font-semibold shadow-md hover:shadow-lg"
        >
          <span className="text-xl">📚</span>
          {loading ? 'Loading...' : 'Select Multiple Files'}
        </button>

        <button
          onClick={handleClearFiles}
          disabled={loadedFiles.length === 0 || loading}
          className="px-4 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:bg-gray-300 transition-all flex items-center justify-center gap-2 font-semibold shadow-md hover:shadow-lg"
        >
          <span className="text-xl">🗑️</span>
          Clear All Files
        </button>
      </div>

      {/* Feedback */}
      {loading && (
        <div className="bg-blue-50 border-l-4 border-blue-400 text-blue-700 px-4 py-3 rounded mb-4 flex items-center gap-3">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-700"></div>
          <span className="font-semibold">Loading files...</span>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border-l-4 border-green-400 text-green-700 px-4 py-3 rounded mb-4 flex items-center gap-2">
          <span className="text-xl">✅</span>
          <span className="font-semibold">Files loaded successfully!</span>
        </div>
      )}

      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded mb-4 flex items-center gap-2">
          <span className="text-xl">⚠️</span>
          <div>
            <strong>Error:</strong> {error}
          </div>
        </div>
      )}

      {/* Summary Only -- no table */}
      {loadedFiles.length === 0 && !loading && !error && (
        <div className="text-center py-8 text-gray-400">
          <div className="text-6xl mb-3">📂</div>
          <p className="text-lg font-semibold">No files loaded yet</p>
          <p className="text-sm">Click a button above to start loading files</p>
        </div>
      )}
    </div>
  );
};

export default FileLoader;
