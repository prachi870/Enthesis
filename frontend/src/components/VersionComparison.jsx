import React, { useState, useEffect } from 'react';
import { ArrowLeft, TrendingUp, TrendingDown, Minus, Plus, X, AlertCircle, Loader } from 'lucide-react';

const VersionComparison = ({ paperId, version1Id, version2Id, onBack }) => {
  const [comparison, setComparison] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('findings');

  useEffect(() => {
    loadComparison();
  }, [paperId, version1Id, version2Id]);

  const loadComparison = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `/api/v1/papers/${paperId}/versions/compare?version1_id=${version1Id}&version2_id=${version2Id}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      if (response.ok) {
        const data = await response.json();
        setComparison(data);
      }
    } catch (error) {
      console.error('Failed to load comparison:', error);
    } finally {
      setLoading(false);
    }
  };

  const getChangeIcon = (change) => {
    if (change > 0) return <TrendingUp className="w-4 h-4 text-green-600" />;
    if (change < 0) return <TrendingDown className="w-4 h-4 text-red-600" />;
    return <Minus className="w-4 h-4 text-gray-400" />;
  };

  const getChangeColor = (change) => {
    if (change > 0) return 'text-green-600';
    if (change < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const formatChange = (change) => {
    if (change > 0) return `+${change}`;
    return change.toString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader className="w-8 h-8 animate-spin text-blue-500" />
        <span className="ml-3 text-lg text-gray-600">Analyzing differences...</span>
      </div>
    );
  }

  if (!comparison) {
    return (
      <div className="text-center p-12">
        <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-500" />
        <p className="text-gray-600">Failed to load comparison data</p>
        <button
          onClick={onBack}
          className="mt-4 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
        >
          Go Back
        </button>
      </div>
    );
  }

  const { version1, version2, comparison: compData } = comparison;

  return (
    <div className="bg-white rounded-lg shadow-sm">
      {/* Header */}
      <div className="border-b border-gray-200 p-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Versions
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Version Comparison</h2>
            <p className="text-gray-600">
              Comparing changes between Version {version1.version_number} and Version {version2.version_number}
            </p>
          </div>
        </div>
      </div>

      {/* Version Info Cards */}
      <div className="grid grid-cols-2 gap-4 p-6 bg-gray-50">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-sm text-gray-500 mb-1">Baseline Version</div>
          <div className="font-semibold text-gray-900">Version {version1.version_number}</div>
          <div className="text-sm text-gray-600 mt-1">{version1.filename}</div>
          <div className="text-xs text-gray-500 mt-1">
            {new Date(version1.uploaded_at).toLocaleDateString()}
          </div>
        </div>
        <div className="bg-white border border-blue-200 rounded-lg p-4">
          <div className="text-sm text-gray-500 mb-1">Comparison Version</div>
          <div className="font-semibold text-gray-900">Version {version2.version_number}</div>
          <div className="text-sm text-gray-600 mt-1">{version2.filename}</div>
          <div className="text-xs text-gray-500 mt-1">
            {new Date(version2.uploaded_at).toLocaleDateString()}
          </div>
        </div>
      </div>

      {/* Important Notice */}
      <div className="mx-6 mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-yellow-800">
            <strong>Important:</strong> This comparison shows detected changes between versions. 
            Changes in metrics do not indicate "improvement" or "worsening" - they reflect measurable 
            differences in the analysis. Review all changes critically.
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 px-6">
        <div className="flex gap-4">
          {['findings', 'metrics', 'summary'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {activeTab === 'findings' && (
          <div className="space-y-6">
            {/* Added Findings */}
            {compData.findings_changes.added.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Plus className="w-5 h-5 text-green-600" />
                  <h3 className="text-lg font-semibold text-gray-900">
                    Added Findings ({compData.findings_changes.added.length})
                  </h3>
                </div>
                <div className="space-y-3">
                  {compData.findings_changes.added.map((finding, idx) => (
                    <div key={idx} className="border-l-4 border-green-500 bg-green-50 p-4 rounded-r-lg">
                      <div className="font-medium text-gray-900 mb-1">{finding.type}</div>
                      <div className="text-sm text-gray-700">{finding.description}</div>
                      {finding.confidence && (
                        <div className="mt-2 text-xs text-gray-600">
                          Confidence: {(finding.confidence * 100).toFixed(0)}%
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Removed Findings */}
            {compData.findings_changes.removed.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <X className="w-5 h-5 text-red-600" />
                  <h3 className="text-lg font-semibold text-gray-900">
                    Removed Findings ({compData.findings_changes.removed.length})
                  </h3>
                </div>
                <div className="space-y-3">
                  {compData.findings_changes.removed.map((finding, idx) => (
                    <div key={idx} className="border-l-4 border-red-500 bg-red-50 p-4 rounded-r-lg">
                      <div className="font-medium text-gray-900 mb-1">{finding.type}</div>
                      <div className="text-sm text-gray-700">{finding.description}</div>
                      {finding.confidence && (
                        <div className="mt-2 text-xs text-gray-600">
                          Confidence: {(finding.confidence * 100).toFixed(0)}%
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Persistent Findings */}
            {compData.findings_changes.persistent.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Minus className="w-5 h-5 text-gray-600" />
                  <h3 className="text-lg font-semibold text-gray-900">
                    Persistent Findings ({compData.findings_changes.persistent.length})
                  </h3>
                </div>
                <div className="space-y-3">
                  {compData.findings_changes.persistent.map((finding, idx) => (
                    <div key={idx} className="border-l-4 border-gray-400 bg-gray-50 p-4 rounded-r-lg">
                      <div className="font-medium text-gray-900 mb-1">{finding.type}</div>
                      <div className="text-sm text-gray-700">{finding.description}</div>
                      {finding.confidence && (
                        <div className="mt-2 text-xs text-gray-600">
                          Confidence: {(finding.confidence * 100).toFixed(0)}%
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {compData.findings_changes.added.length === 0 &&
             compData.findings_changes.removed.length === 0 &&
             compData.findings_changes.persistent.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No findings to compare
              </div>
            )}
          </div>
        )}

        {activeTab === 'metrics' && (
          <div className="space-y-6">
            {/* Novelty Changes */}
            {compData.novelty_changes && (
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Novelty Metrics</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Version {version1.version_number}</div>
                    <div className="text-2xl font-bold text-gray-900">
                      {(compData.novelty_changes.v1_score * 100).toFixed(1)}%
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Version {version2.version_number}</div>
                    <div className="text-2xl font-bold text-gray-900">
                      {(compData.novelty_changes.v2_score * 100).toFixed(1)}%
                    </div>
                  </div>
                </div>
                <div className={`mt-3 flex items-center gap-2 ${getChangeColor(compData.novelty_changes.change)}`}>
                  {getChangeIcon(compData.novelty_changes.change)}
                  <span className="font-semibold">
                    {formatChange((compData.novelty_changes.change * 100).toFixed(1))}% change detected
                  </span>
                </div>
              </div>
            )}

            {/* Weakness Changes */}
            {compData.weakness_changes && (
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Weakness Metrics</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Version {version1.version_number}</div>
                    <div className="text-2xl font-bold text-gray-900">
                      {(compData.weakness_changes.v1_score * 100).toFixed(1)}%
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Version {version2.version_number}</div>
                    <div className="text-2xl font-bold text-gray-900">
                      {(compData.weakness_changes.v2_score * 100).toFixed(1)}%
                    </div>
                  </div>
                </div>
                <div className={`mt-3 flex items-center gap-2 ${getChangeColor(compData.weakness_changes.change)}`}>
                  {getChangeIcon(compData.weakness_changes.change)}
                  <span className="font-semibold">
                    {formatChange((compData.weakness_changes.change * 100).toFixed(1))}% change detected
                  </span>
                </div>
              </div>
            )}

            {/* Clarity Changes */}
            {compData.clarity_changes && (
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Clarity Metrics</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Version {version1.version_number}</div>
                    <div className="text-2xl font-bold text-gray-900">
                      {(compData.clarity_changes.v1_score * 100).toFixed(1)}%
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Version {version2.version_number}</div>
                    <div className="text-2xl font-bold text-gray-900">
                      {(compData.clarity_changes.v2_score * 100).toFixed(1)}%
                    </div>
                  </div>
                </div>
                <div className={`mt-3 flex items-center gap-2 ${getChangeColor(compData.clarity_changes.change)}`}>
                  {getChangeIcon(compData.clarity_changes.change)}
                  <span className="font-semibold">
                    {formatChange((compData.clarity_changes.change * 100).toFixed(1))}% change detected
                  </span>
                </div>
              </div>
            )}

            {/* Reviewer Changes */}
            {compData.reviewer_changes && (
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Reviewer Feedback Metrics</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Version {version1.version_number}</div>
                    <div className="text-2xl font-bold text-gray-900">
                      {(compData.reviewer_changes.v1_score * 100).toFixed(1)}%
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Version {version2.version_number}</div>
                    <div className="text-2xl font-bold text-gray-900">
                      {(compData.reviewer_changes.v2_score * 100).toFixed(1)}%
                    </div>
                  </div>
                </div>
                <div className={`mt-3 flex items-center gap-2 ${getChangeColor(compData.reviewer_changes.change)}`}>
                  {getChangeIcon(compData.reviewer_changes.change)}
                  <span className="font-semibold">
                    {formatChange((compData.reviewer_changes.change * 100).toFixed(1))}% change detected
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'summary' && (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Comparison Summary</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Total Findings Added:</span>
                  <span className="font-semibold text-green-600">
                    {compData.findings_changes.added.length}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Total Findings Removed:</span>
                  <span className="font-semibold text-red-600">
                    {compData.findings_changes.removed.length}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Persistent Findings:</span>
                  <span className="font-semibold text-gray-600">
                    {compData.findings_changes.persistent.length}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
              <h4 className="font-semibold text-gray-900 mb-2">Analysis Note</h4>
              <p className="text-sm text-gray-700">
                This comparison identifies measurable changes between the two versions. 
                Changes in metrics or findings should not be interpreted as "better" or "worse" 
                without careful review of the specific context and content. Each change requires 
                critical evaluation by the researcher.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VersionComparison;
