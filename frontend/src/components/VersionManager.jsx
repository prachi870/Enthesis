import React, { useState, useEffect } from 'react';
import { Upload, Clock, FileText, GitCompare, Loader, ArrowLeftRight } from 'lucide-react';

const VersionManager = ({ paperId, onVersionSelect, onCompare, onBeforeAfter }) => {
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedVersions, setSelectedVersions] = useState([]);

  useEffect(() => {
    if (paperId) {
      loadVersions();
    }
  }, [paperId]);

  const loadVersions = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `/api/v1/papers/${paperId}/versions`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      if (response.ok) {
        const data = await response.json();
        setVersions(data);
      }
    } catch (error) {
      console.error('Failed to load versions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(
        `/api/v1/papers/${paperId}/versions/upload`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        }
      );

      if (response.ok) {
        await loadVersions();
      }
    } catch (error) {
      console.error('Failed to upload version:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleVersionToggle = (versionId) => {
    setSelectedVersions(prev => {
      if (prev.includes(versionId)) {
        return prev.filter(id => id !== versionId);
      } else if (prev.length < 2) {
        return [...prev, versionId];
      } else {
        return [prev[1], versionId];
      }
    });
  };

  const handleCompare = () => {
    if (selectedVersions.length === 2 && onCompare) {
      onCompare(selectedVersions[0], selectedVersions[1]);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader className="w-6 h-6 animate-spin text-blue-500" />
        <span className="ml-2 text-gray-600">Loading versions...</span>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Paper Versions</h2>
        <div className="flex items-center gap-3">
          {selectedVersions.length === 2 && (
            <>
              <button
                onClick={() => onBeforeAfter && onBeforeAfter(selectedVersions[0], selectedVersions[1])}
                className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
              >
                <ArrowLeftRight className="w-4 h-4" />
                Before vs After
              </button>
              <button
                onClick={handleCompare}
                className="flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
              >
                <GitCompare className="w-4 h-4" />
                Detailed Compare
              </button>
            </>
          )}
          <label className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 cursor-pointer transition-colors">
            <Upload className="w-4 h-4" />
            {uploading ? 'Uploading...' : 'Upload New Version'}
            <input
              type="file"
              accept=".pdf"
              onChange={handleFileUpload}
              className="hidden"
              disabled={uploading}
            />
          </label>
        </div>
      </div>

      {selectedVersions.length > 0 && (
        <div className="mb-4 p-3 bg-purple-50 rounded-lg">
          <p className="text-sm text-purple-700">
            {selectedVersions.length === 1
              ? '1 version selected. Select one more to compare.'
              : '2 versions selected. Choose "Before vs After" for a summary view or "Detailed Compare" for in-depth analysis.'}
          </p>
        </div>
      )}

      {versions.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p>No versions uploaded yet. Upload your first version to get started.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {versions.map((version) => (
            <div
              key={version.id}
              className={`border rounded-lg p-4 transition-all cursor-pointer ${
                selectedVersions.includes(version.id)
                  ? 'border-purple-500 bg-purple-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => handleVersionToggle(version.id)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm font-semibold rounded-full">
                      Version {version.version_number}
                    </span>
                    {version.has_analysis && (
                      <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded">
                        Analyzed
                      </span>
                    )}
                    {selectedVersions.includes(version.id) && (
                      <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded">
                        Selected
                      </span>
                    )}
                  </div>
                  <p className="text-gray-900 font-medium mb-1">{version.filename}</p>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Clock className="w-4 h-4" />
                    <span>Uploaded {formatDate(version.uploaded_at)}</span>
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onVersionSelect) onVersionSelect(version);
                  }}
                  className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded transition-colors"
                >
                  View
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default VersionManager;
