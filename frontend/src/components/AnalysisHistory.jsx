import React, { useState, useEffect } from 'react';
import { 
  History, Clock, CheckCircle, XCircle, AlertCircle, 
  Play, TrendingUp, Database, Cpu, FileText, 
  Calendar, User, Filter, ChevronDown, ChevronUp, Eye
} from 'lucide-react';

const AnalysisHistory = ({ paperId, onOpenRun }) => {
  const [history, setHistory] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedRun, setExpandedRun] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    if (paperId) {
      loadHistory();
      loadStatistics();
    }
  }, [paperId]);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `/api/v1/papers/${paperId}/history`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      if (response.ok) {
        const data = await response.json();
        setHistory(data);
      }
    } catch (error) {
      console.error('Failed to load history:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStatistics = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `/api/v1/papers/${paperId}/history/statistics/summary`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      if (response.ok) {
        const data = await response.json();
        setStatistics(data);
      }
    } catch (error) {
      console.error('Failed to load statistics:', error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'failed':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'partial':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'running':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5" />;
      case 'failed':
        return <XCircle className="w-5 h-5" />;
      case 'partial':
        return <AlertCircle className="w-5 h-5" />;
      case 'running':
        return <Play className="w-5 h-5" />;
      default:
        return <Clock className="w-5 h-5" />;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (seconds) => {
    if (!seconds) return 'N/A';
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const getTotalFindings = (findingsCount) => {
    if (!findingsCount) return 0;
    return Object.values(findingsCount).reduce((sum, count) => sum + count, 0);
  };

  const toggleExpanded = (runId) => {
    setExpandedRun(expandedRun === runId ? null : runId);
  };

  const handleOpenRun = (run) => {
    if (onOpenRun) {
      onOpenRun(run);
    }
  };

  const filteredHistory = filterStatus === 'all' 
    ? history 
    : history.filter(run => run.pipeline_status === filterStatus);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        <span className="ml-3 text-lg text-gray-600">Loading history...</span>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm">
      {/* Header */}
      <div className="border-b border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-2">
          <History className="w-8 h-8 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-900">Analysis History</h2>
        </div>
        <p className="text-gray-600">
          Complete record of all analysis runs for reproducibility
        </p>
      </div>

      {/* Statistics Overview */}
      {statistics && (
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Overview Statistics</h3>
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="text-sm text-gray-600 mb-1">Total Runs</div>
              <div className="text-2xl font-bold text-gray-900">{statistics.total_runs}</div>
            </div>
            <div className="bg-white rounded-lg p-4 border border-green-200">
              <div className="text-sm text-gray-600 mb-1">Successful</div>
              <div className="text-2xl font-bold text-green-600">{statistics.successful_runs}</div>
            </div>
            <div className="bg-white rounded-lg p-4 border border-red-200">
              <div className="text-sm text-gray-600 mb-1">Failed</div>
              <div className="text-2xl font-bold text-red-600">{statistics.failed_runs}</div>
            </div>
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="text-sm text-gray-600 mb-1">Avg Duration</div>
              <div className="text-2xl font-bold text-gray-900">
                {formatDuration(Math.round(statistics.average_duration))}
              </div>
            </div>
          </div>

          {/* Module Success Rates */}
          {Object.keys(statistics.modules_success_rate).length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Module Success Rates</h4>
              <div className="grid grid-cols-5 gap-2">
                {Object.entries(statistics.modules_success_rate).map(([module, stats]) => (
                  <div key={module} className="bg-white rounded p-2 border border-gray-200">
                    <div className="text-xs text-gray-600 mb-1">
                      {module.replace('_', ' ')}
                    </div>
                    <div className="text-lg font-bold text-gray-900">
                      {(stats.rate * 100).toFixed(0)}%
                    </div>
                    <div className="text-xs text-gray-500">
                      {stats.successful}/{stats.total}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Filter Controls */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Filter by status:</span>
          <div className="flex gap-2">
            {['all', 'completed', 'partial', 'failed', 'running'].map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  filterStatus === status
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Analysis Runs List */}
      <div className="p-6">
        {filteredHistory.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <History className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p>No analysis runs found</p>
            {filterStatus !== 'all' && (
              <button
                onClick={() => setFilterStatus('all')}
                className="mt-2 text-blue-600 hover:underline"
              >
                Clear filter
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredHistory.map((run) => (
              <div
                key={run.id}
                className="border border-gray-200 rounded-lg overflow-hidden hover:border-gray-300 transition-colors"
              >
                {/* Run Summary */}
                <div className="p-4 bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`flex items-center gap-2 px-3 py-1 rounded-full border ${getStatusColor(run.pipeline_status)}`}>
                          {getStatusIcon(run.pipeline_status)}
                          <span className="text-sm font-semibold">
                            {run.pipeline_status.toUpperCase()}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Calendar className="w-4 h-4" />
                          <span>{formatDate(run.run_date)}</span>
                        </div>
                        {run.version_id && (
                          <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded">
                            Version {run.version_id}
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-4 gap-4 text-sm">
                        <div>
                          <div className="text-gray-600">Completed Modules</div>
                          <div className="font-semibold text-gray-900">
                            {run.completed_modules.length} / 5
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-600">Total Findings</div>
                          <div className="font-semibold text-gray-900">
                            {getTotalFindings(run.findings_count)}
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-600">Duration</div>
                          <div className="font-semibold text-gray-900">
                            {formatDuration(run.duration_seconds)}
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-600">Trigger</div>
                          <div className="font-semibold text-gray-900 capitalize">
                            {run.trigger}
                          </div>
                        </div>
                      </div>

                      {run.failed_modules && run.failed_modules.length > 0 && (
                        <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded">
                          <div className="text-sm font-semibold text-red-700 mb-1">
                            Failed Modules:
                          </div>
                          {run.failed_modules.map((failure, idx) => (
                            <div key={idx} className="text-xs text-red-600">
                              • {failure.module}: {failure.error}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenRun(run)}
                        className="flex items-center gap-2 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
                      >
                        <Eye className="w-4 h-4" />
                        Open
                      </button>
                      <button
                        onClick={() => toggleExpanded(run.id)}
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded transition-colors"
                      >
                        {expandedRun === run.id ? (
                          <ChevronUp className="w-5 h-5" />
                        ) : (
                          <ChevronDown className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                {expandedRun === run.id && (
                  <div className="p-4 border-t border-gray-200 bg-white">
                    <div className="grid grid-cols-2 gap-6">
                      {/* Model Versions */}
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <Cpu className="w-5 h-5 text-blue-600" />
                          <h4 className="font-semibold text-gray-900">Model Versions</h4>
                        </div>
                        <div className="space-y-2">
                          {Object.entries(run.model_versions).map(([module, version]) => (
                            <div key={module} className="flex justify-between text-sm bg-gray-50 p-2 rounded">
                              <span className="text-gray-600">{module}:</span>
                              <span className="font-mono text-gray-900">{version}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Dataset Versions */}
                      {run.dataset_versions && Object.keys(run.dataset_versions).length > 0 && (
                        <div>
                          <div className="flex items-center gap-2 mb-3">
                            <Database className="w-5 h-5 text-green-600" />
                            <h4 className="font-semibold text-gray-900">Dataset Versions</h4>
                          </div>
                          <div className="space-y-2">
                            {Object.entries(run.dataset_versions).map(([module, version]) => (
                              <div key={module} className="flex justify-between text-sm bg-gray-50 p-2 rounded">
                                <span className="text-gray-600">{module}:</span>
                                <span className="font-mono text-gray-900">{version}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Findings Breakdown */}
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <TrendingUp className="w-5 h-5 text-purple-600" />
                          <h4 className="font-semibold text-gray-900">Findings Breakdown</h4>
                        </div>
                        <div className="space-y-2">
                          {Object.entries(run.findings_count).map(([module, count]) => (
                            <div key={module} className="flex justify-between text-sm bg-gray-50 p-2 rounded">
                              <span className="text-gray-600">{module.replace('_', ' ')}:</span>
                              <span className="font-semibold text-gray-900">{count}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Report Status */}
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <FileText className="w-5 h-5 text-orange-600" />
                          <h4 className="font-semibold text-gray-900">Report Status</h4>
                        </div>
                        <div className="bg-gray-50 p-3 rounded">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-sm text-gray-600">Generated:</span>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              run.report_generated === 'yes' 
                                ? 'bg-green-100 text-green-700' 
                                : 'bg-gray-200 text-gray-700'
                            }`}>
                              {run.report_generated}
                            </span>
                          </div>
                          {run.report_path && (
                            <div className="text-xs text-gray-600 font-mono">
                              {run.report_path}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Notes */}
                    {run.notes && (
                      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
                        <div className="text-sm font-semibold text-blue-900 mb-1">Notes:</div>
                        <div className="text-sm text-blue-800">{run.notes}</div>
                      </div>
                    )}

                    {/* Reproducibility Notice */}
                    <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                      <div className="flex items-start gap-2 text-sm text-yellow-800">
                        <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <div>
                          <strong>Reproducibility:</strong> This run used specific model and dataset
                          versions. Results are preserved exactly as generated and can be referenced
                          for comparison with future runs.
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalysisHistory;
