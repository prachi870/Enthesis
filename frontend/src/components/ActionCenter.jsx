import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  AlertCircle, CheckCircle, Clock, Eye, Check, X,
  TrendingUp, Filter, Search, ChevronDown, ChevronUp,
  Flag, Target, FileText, Zap, AlertTriangle, Info
} from 'lucide-react';

/**
 * ActionCenter - Research Action Center for managing investigation tasks
 * 
 * Converts findings into actionable research tasks with:
 * - Title
 * - Description
 * - Source finding
 * - Evidence
 * - Priority (HIGH/MEDIUM/LOW)
 * - Status (not_started/in_progress/reviewed/resolved)
 * 
 * Students can mark actions:
 * - Not Started (initial)
 * - In Progress (working on it)
 * - Reviewed (examined the issue)
 * - Resolved (addressed the concern)
 * 
 * System NEVER auto-resolves - only student can change status.
 */
const ActionCenter = ({ paperId }) => {
  const [actionData, setActionData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedAction, setSelectedAction] = useState(null);
  const [filterPriority, setFilterPriority] = useState([]);
  const [filterStatus, setFilterStatus] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedActions, setExpandedActions] = useState({});

  useEffect(() => {
    fetchActions();
  }, [paperId]);

  const fetchActions = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `/api/v1/papers/${paperId}/action-center`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setActionData(response.data);
    } catch (err) {
      console.error('Error fetching actions:', err);
      setError('Failed to load action center. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (actionId, newStatus, notes = null) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `/api/v1/papers/${paperId}/actions/${actionId}/status`,
        null,
        {
          params: { status: newStatus, notes },
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      // Refresh actions
      await fetchActions();
    } catch (err) {
      console.error('Error updating status:', err);
      alert('Failed to update status. Please try again.');
    }
  };

  // Priority helpers
  const getPriorityColor = (priority) => {
    const colors = {
      high: 'text-red-600 bg-red-100 border-red-300',
      medium: 'text-orange-600 bg-orange-100 border-orange-300',
      low: 'text-blue-600 bg-blue-100 border-blue-300'
    };
    return colors[priority] || colors.medium;
  };

  const getPriorityBadgeColor = (priority) => {
    const colors = {
      high: 'bg-red-500 text-white',
      medium: 'bg-orange-500 text-white',
      low: 'bg-blue-500 text-white'
    };
    return colors[priority] || colors.medium;
  };

  // Status helpers
  const getStatusIcon = (status) => {
    const icons = {
      not_started: Clock,
      in_progress: TrendingUp,
      reviewed: Eye,
      resolved: CheckCircle
    };
    return icons[status] || Clock;
  };

  const getStatusColor = (status) => {
    const colors = {
      not_started: 'text-gray-600 bg-gray-100',
      in_progress: 'text-blue-600 bg-blue-100',
      reviewed: 'text-purple-600 bg-purple-100',
      resolved: 'text-green-600 bg-green-100'
    };
    return colors[status] || colors.not_started;
  };

  const getStatusLabel = (status) => {
    const labels = {
      not_started: 'Not Started',
      in_progress: 'In Progress',
      reviewed: 'Reviewed',
      resolved: 'Resolved'
    };
    return labels[status] || 'Unknown';
  };

  // Filter actions
  const filteredActions = actionData?.actions?.filter(action => {
    // Priority filter
    if (filterPriority.length > 0 && !filterPriority.includes(action.priority)) {
      return false;
    }
    // Status filter
    if (filterStatus.length > 0 && !filterStatus.includes(action.status)) {
      return false;
    }
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (!action.title.toLowerCase().includes(query) &&
          !action.description.toLowerCase().includes(query)) {
        return false;
      }
    }
    return true;
  }) || [];

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          <span className="ml-4 text-gray-600">Loading action center...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="flex items-center text-red-600">
          <AlertCircle className="w-6 h-6 mr-2" />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  if (!actionData || !actionData.actions || actionData.actions.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-8 text-center">
        <Target className="w-16 h-16 mx-auto text-gray-400 mb-4" />
        <h3 className="text-xl font-bold text-gray-700 mb-2">No Actions Generated</h3>
        <p className="text-gray-500">
          Complete the analysis pipeline to generate research investigation tasks.
        </p>
      </div>
    );
  }

  const { summary, by_priority } = actionData;

  return (
    <div className="space-y-6">
      {/* Header with Summary */}
      <div className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-3xl font-bold">Research Action Center</h2>
            <p className="text-indigo-100 text-sm mt-1">
              Prioritized research investigation tasks from your analysis
            </p>
          </div>
          {summary && (
            <div className="text-right">
              <div className="text-5xl font-bold">{summary.total_actions}</div>
              <div className="text-sm opacity-80">Action Items</div>
            </div>
          )}
        </div>

        {/* Summary Stats */}
        {summary && (
          <div className="grid grid-cols-4 gap-4 mt-6">
            <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
              <div className="text-sm opacity-80">Completion</div>
              <div className="text-3xl font-bold">{summary.completion_percentage}%</div>
            </div>
            <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
              <div className="text-sm opacity-80">High Priority</div>
              <div className="text-3xl font-bold text-red-300">{summary.by_priority?.high || 0}</div>
            </div>
            <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
              <div className="text-sm opacity-80">In Progress</div>
              <div className="text-3xl font-bold text-blue-300">{summary.by_status?.in_progress || 0}</div>
            </div>
            <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
              <div className="text-sm opacity-80">Resolved</div>
              <div className="text-3xl font-bold text-green-300">{summary.by_status?.resolved || 0}</div>
            </div>
          </div>
        )}

        {/* Progress Bar */}
        {summary && (
          <div className="mt-4">
            <div className="flex justify-between text-sm mb-1">
              <span>Overall Progress</span>
              <span>{summary.completion_percentage}% Complete</span>
            </div>
            <div className="w-full h-3 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-400 transition-all duration-500"
                style={{ width: `${summary.completion_percentage}%` }}
              ></div>
            </div>
          </div>
        )}
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-wrap gap-4 items-center">
          {/* Search */}
          <div className="flex-1 min-w-[250px] relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search actions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Priority Filter */}
          <div className="flex gap-2">
            {['high', 'medium', 'low'].map(priority => (
              <button
                key={priority}
                onClick={() => setFilterPriority(prev =>
                  prev.includes(priority) ? prev.filter(p => p !== priority) : [...prev, priority]
                )}
                className={`px-3 py-2 rounded-lg text-sm font-semibold capitalize transition-all ${
                  filterPriority.includes(priority)
                    ? getPriorityBadgeColor(priority)
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {priority}
              </button>
            ))}
          </div>

          {/* Status Filter */}
          <div className="flex gap-2">
            {['not_started', 'in_progress', 'reviewed', 'resolved'].map(status => {
              const Icon = getStatusIcon(status);
              const isSelected = filterStatus.includes(status);
              return (
                <button
                  key={status}
                  onClick={() => setFilterStatus(prev =>
                    prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]
                  )}
                  className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all ${
                    isSelected
                      ? getStatusColor(status) + ' ring-2 ring-offset-2'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {getStatusLabel(status)}
                </button>
              );
            })}
          </div>
        </div>

        {/* Active filters indicator */}
        {(filterPriority.length > 0 || filterStatus.length > 0 || searchQuery) && (
          <div className="mt-3 flex items-center gap-2 text-sm text-gray-600">
            <Filter className="w-4 h-4" />
            <span>Showing {filteredActions.length} of {actionData.actions.length} actions</span>
            <button
              onClick={() => {
                setFilterPriority([]);
                setFilterStatus([]);
                setSearchQuery('');
              }}
              className="text-indigo-600 hover:text-indigo-700 font-medium ml-2"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>

      {/* Actions by Priority */}
      {['high', 'medium', 'low'].map(priority => {
        const priorityActions = filteredActions.filter(a => a.priority === priority);
        if (priorityActions.length === 0) return null;

        return (
          <div key={priority} className="space-y-3">
            <div className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-lg uppercase ${getPriorityColor(priority)}`}>
              <Flag className="w-5 h-5" />
              {priority} Priority ({priorityActions.length})
            </div>

            {priorityActions.map((action) => {
              const StatusIcon = getStatusIcon(action.status);
              const isExpanded = expandedActions[action.action_id];

              return (
                <div
                  key={action.action_id}
                  className="bg-white rounded-lg shadow border-2 border-gray-200 hover:border-indigo-300 transition-all"
                >
                  {/* Action Header */}
                  <div className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-bold text-gray-800">{action.title}</h3>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getPriorityBadgeColor(action.priority)}`}>
                            {action.priority.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">{action.description}</p>
                        
                        {/* Metadata */}
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <FileText className="w-3 h-3" />
                            {action.source_module}
                          </span>
                          <span className="flex items-center gap-1">
                            <Target className="w-3 h-3" />
                            {action.source_finding_type}
                          </span>
                        </div>
                      </div>

                      {/* Status Dropdown */}
                      <div className="ml-4">
                        <select
                          value={action.status}
                          onChange={(e) => updateStatus(action.action_id, e.target.value)}
                          className={`px-4 py-2 rounded-lg text-sm font-semibold cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500 ${getStatusColor(action.status)}`}
                        >
                          <option value="not_started">Not Started</option>
                          <option value="in_progress">In Progress</option>
                          <option value="reviewed">Reviewed</option>
                          <option value="resolved">Resolved</option>
                        </select>
                      </div>

                      {/* Expand Button */}
                      <button
                        onClick={() => setExpandedActions(prev => ({
                          ...prev,
                          [action.action_id]: !prev[action.action_id]
                        }))}
                        className="ml-2 p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5 text-gray-600" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-gray-600" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="border-t border-gray-200 bg-gray-50 p-4 space-y-4">
                      {/* Evidence */}
                      {action.evidence && (
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <Info className="w-4 h-4 text-blue-600" />
                            <div className="text-sm font-semibold text-gray-700">Evidence from Paper</div>
                          </div>
                          <div className="bg-white p-3 rounded border border-gray-200">
                            <p className="text-sm text-gray-600 italic">{action.evidence}</p>
                          </div>
                        </div>
                      )}

                      {/* Recommended Action */}
                      {action.recommended_action && (
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <Zap className="w-4 h-4 text-yellow-600" />
                            <div className="text-sm font-semibold text-gray-700">Recommended Action</div>
                          </div>
                          <div className="bg-yellow-50 border-l-4 border-yellow-500 p-3 rounded-r">
                            <p className="text-sm text-yellow-900">{action.recommended_action}</p>
                          </div>
                        </div>
                      )}

                      {/* Notes */}
                      {action.notes && (
                        <div>
                          <div className="text-sm font-semibold text-gray-700 mb-2">Your Notes</div>
                          <div className="bg-white p-3 rounded border border-gray-200">
                            <p className="text-sm text-gray-600">{action.notes}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        );
      })}

      {/* Empty State */}
      {filteredActions.length === 0 && actionData.actions.length > 0 && (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <Filter className="w-12 h-12 mx-auto text-gray-400 mb-3" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">No Matching Actions</h3>
          <p className="text-gray-500">
            No actions match your current filters. Try adjusting your search or filter criteria.
          </p>
        </div>
      )}

      {/* Info Notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-900">
            <strong>Status Management:</strong> Only you can change action statuses. The system will never
            automatically mark items as resolved. Update statuses as you address each concern to track your progress.
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActionCenter;
