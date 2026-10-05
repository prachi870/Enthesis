import React, { useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle, XCircle, AlertCircle, TrendingUp, TrendingDown, Minus, ExternalLink, FileText } from 'lucide-react';

const BeforeAfterAnalysis = ({ paperId, beforeVersionId, afterVersionId, onBack }) => {
  const [comparison, setComparison] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    loadComparison();
  }, [paperId, beforeVersionId, afterVersionId]);

  const loadComparison = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `/api/v1/papers/${paperId}/versions/compare?version1_id=${beforeVersionId}&version2_id=${afterVersionId}`,
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

  const categorizeFindingsByModule = (findings) => {
    const categories = {
      weaknesses: [],
      clarity: [],
      novelty: [],
      reviewer_feedback: [],
      related_work: []
    };

    findings.forEach(finding => {
      const module = finding.module || 'other';
      if (categories[module]) {
        categories[module].push(finding);
      }
    });

    return categories;
  };

  const getMetricCounts = (findings) => {
    const categorized = categorizeFindingsByModule(findings);
    return {
      weaknesses: categorized.weaknesses.length,
      clarity: categorized.clarity.length,
      novelty: categorized.novelty.length,
      reviewer: categorized.reviewer_feedback.length
    };
  };

  const getChangeIcon = (beforeCount, afterCount) => {
    if (afterCount < beforeCount) return <TrendingDown className="w-5 h-5 text-green-600" />;
    if (afterCount > beforeCount) return <TrendingUp className="w-5 h-5 text-red-600" />;
    return <Minus className="w-5 h-5 text-gray-400" />;
  };

  const getChangeColor = (beforeCount, afterCount) => {
    if (afterCount < beforeCount) return 'text-green-600';
    if (afterCount > beforeCount) return 'text-red-600';
    return 'text-gray-600';
  };

  const getFindingEvidence = (finding) => {
    // Extract evidence/source information from finding
    const evidence = finding.evidence || finding.text || finding.source || finding.context || '';
    const location = finding.location || finding.section || finding.category || '';
    const severity = finding.severity || '';
    return { evidence, location, severity };
  };

  const renderFindingCard = (finding, type) => {
    const { evidence, location, severity } = getFindingEvidence(finding);
    const typeColors = {
      resolved: 'border-l-4 border-green-500 bg-green-50',
      remaining: 'border-l-4 border-yellow-500 bg-yellow-50',
      new: 'border-l-4 border-red-500 bg-red-50'
    };

    const typeIcons = {
      resolved: <CheckCircle className="w-5 h-5 text-green-600" />,
      remaining: <AlertCircle className="w-5 h-5 text-yellow-600" />,
      new: <XCircle className="w-5 h-5 text-red-600" />
    };

    const typeLabels = {
      resolved: 'Resolved',
      remaining: 'Remaining',
      new: 'New Finding'
    };

    const severityColors = {
      high: 'bg-red-100 text-red-700',
      medium: 'bg-yellow-100 text-yellow-700',
      low: 'bg-green-100 text-green-700'
    };

    return (
      <div className={`${typeColors[type]} p-4 rounded-r-lg mb-3`}>
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2 flex-wrap">
            {typeIcons[type]}
            <span className="font-semibold text-gray-900">{typeLabels[type]}</span>
            <span className="px-2 py-1 bg-white rounded text-xs font-medium text-gray-600">
              {finding.module || finding.type || 'Finding'}
            </span>
            {severity && (
              <span className={`px-2 py-1 rounded text-xs font-medium ${severityColors[severity] || 'bg-gray-100 text-gray-700'}`}>
                {severity} severity
              </span>
            )}
          </div>
        </div>
        
        <p className="text-gray-800 mb-2">
          {finding.description || finding.summary || finding.feedback || finding.text || 'No description available'}
        </p>

        {(evidence || location) && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="flex items-start gap-2 text-sm">
              <FileText className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                {location && (
                  <div className="text-gray-600 mb-1">
                    <span className="font-medium">Category:</span> {location.replace(/_/g, ' ')}
                  </div>
                )}
                {evidence && evidence !== location && (
                  <div className="text-gray-600 bg-white p-2 rounded border border-gray-200">
                    <span className="font-medium">Details:</span> {evidence.substring(0, 200)}
                    {evidence.length > 200 && '...'}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {finding.confidence && (
          <div className="mt-2 flex items-center gap-2">
            <div className="flex-1 bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-500 h-2 rounded-full"
                style={{ width: `${finding.confidence * 100}%` }}
              ></div>
            </div>
            <span className="text-xs text-gray-600">
              {(finding.confidence * 100).toFixed(0)}% confidence
            </span>
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        <span className="ml-3 text-lg text-gray-600">Analyzing differences...</span>
      </div>
    );
  }

  if (!comparison) {
    return (
      <div className="text-center p-12">
        <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-500" />
        <p className="text-gray-600">Failed to load comparison data</p>
      </div>
    );
  }

  const { version1, version2, comparison: compData } = comparison;

  // Get all findings by category
  const beforeFindings = compData.findings_changes.removed.concat(compData.findings_changes.persistent);
  const afterFindings = compData.findings_changes.added.concat(compData.findings_changes.persistent);

  const beforeCounts = getMetricCounts(beforeFindings);
  const afterCounts = getMetricCounts(afterFindings);

  const resolvedFindings = compData.findings_changes.removed;
  const remainingFindings = compData.findings_changes.persistent;
  const newFindings = compData.findings_changes.added;

  // Filter findings by selected category
  const filterByCategory = (findings) => {
    if (selectedCategory === 'all') return findings;
    return findings.filter(f => f.module === selectedCategory);
  };

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
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Before vs After Analysis</h2>
        <p className="text-gray-600">
          Comparing Version {version1.version_number} → Version {version2.version_number}
        </p>
      </div>

      {/* Important Notice */}
      <div className="mx-6 mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <strong>Analysis Note:</strong> This comparison shows findings detected by the analysis system. 
            "Resolved" means the finding was not detected in the newer version. "New" means it was detected in 
            the newer version but not before. All findings should be manually verified in context.
          </div>
        </div>
      </div>

      {/* Before vs After Metrics */}
      <div className="p-6">
        <div className="grid grid-cols-2 gap-6 mb-8">
          {/* BEFORE Column */}
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-6 border-2 border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">BEFORE</h3>
              <span className="px-3 py-1 bg-gray-200 text-gray-700 text-sm font-semibold rounded-full">
                Version {version1.version_number}
              </span>
            </div>

            <div className="space-y-4">
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <div className="text-sm text-gray-600 mb-1">Potential Weaknesses</div>
                <div className="text-3xl font-bold text-gray-900">{beforeCounts.weaknesses}</div>
              </div>

              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <div className="text-sm text-gray-600 mb-1">Clarity Findings</div>
                <div className="text-3xl font-bold text-gray-900">{beforeCounts.clarity}</div>
              </div>

              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <div className="text-sm text-gray-600 mb-1">Novelty Concerns</div>
                <div className="text-3xl font-bold text-gray-900">{beforeCounts.novelty}</div>
              </div>

              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <div className="text-sm text-gray-600 mb-1">Reviewer-Style Concerns</div>
                <div className="text-3xl font-bold text-gray-900">{beforeCounts.reviewer}</div>
              </div>
            </div>
          </div>

          {/* AFTER Column */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 border-2 border-blue-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">AFTER</h3>
              <span className="px-3 py-1 bg-blue-200 text-blue-700 text-sm font-semibold rounded-full">
                Version {version2.version_number}
              </span>
            </div>

            <div className="space-y-4">
              <div className="bg-white rounded-lg p-4 border border-blue-200">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Potential Weaknesses</div>
                    <div className="text-3xl font-bold text-gray-900">{afterCounts.weaknesses}</div>
                  </div>
                  <div className="flex flex-col items-center">
                    {getChangeIcon(beforeCounts.weaknesses, afterCounts.weaknesses)}
                    <span className={`text-sm font-semibold mt-1 ${getChangeColor(beforeCounts.weaknesses, afterCounts.weaknesses)}`}>
                      {afterCounts.weaknesses - beforeCounts.weaknesses >= 0 ? '+' : ''}
                      {afterCounts.weaknesses - beforeCounts.weaknesses}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg p-4 border border-blue-200">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Clarity Findings</div>
                    <div className="text-3xl font-bold text-gray-900">{afterCounts.clarity}</div>
                  </div>
                  <div className="flex flex-col items-center">
                    {getChangeIcon(beforeCounts.clarity, afterCounts.clarity)}
                    <span className={`text-sm font-semibold mt-1 ${getChangeColor(beforeCounts.clarity, afterCounts.clarity)}`}>
                      {afterCounts.clarity - beforeCounts.clarity >= 0 ? '+' : ''}
                      {afterCounts.clarity - beforeCounts.clarity}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg p-4 border border-blue-200">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Novelty Concerns</div>
                    <div className="text-3xl font-bold text-gray-900">{afterCounts.novelty}</div>
                  </div>
                  <div className="flex flex-col items-center">
                    {getChangeIcon(beforeCounts.novelty, afterCounts.novelty)}
                    <span className={`text-sm font-semibold mt-1 ${getChangeColor(beforeCounts.novelty, afterCounts.novelty)}`}>
                      {afterCounts.novelty - beforeCounts.novelty >= 0 ? '+' : ''}
                      {afterCounts.novelty - beforeCounts.novelty}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg p-4 border border-blue-200">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Reviewer-Style Concerns</div>
                    <div className="text-3xl font-bold text-gray-900">{afterCounts.reviewer}</div>
                  </div>
                  <div className="flex flex-col items-center">
                    {getChangeIcon(beforeCounts.reviewer, afterCounts.reviewer)}
                    <span className={`text-sm font-semibold mt-1 ${getChangeColor(beforeCounts.reviewer, afterCounts.reviewer)}`}>
                      {afterCounts.reviewer - beforeCounts.reviewer >= 0 ? '+' : ''}
                      {afterCounts.reviewer - beforeCounts.reviewer}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-2">
              <CheckCircle className="w-6 h-6 text-green-600" />
              <span className="font-semibold text-gray-900">Resolved Findings</span>
            </div>
            <div className="text-3xl font-bold text-green-600">{resolvedFindings.length}</div>
            <div className="text-sm text-gray-600 mt-1">
              Not detected in new version
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-2">
              <AlertCircle className="w-6 h-6 text-yellow-600" />
              <span className="font-semibold text-gray-900">Remaining Findings</span>
            </div>
            <div className="text-3xl font-bold text-yellow-600">{remainingFindings.length}</div>
            <div className="text-sm text-gray-600 mt-1">
              Present in both versions
            </div>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-2">
              <XCircle className="w-6 h-6 text-red-600" />
              <span className="font-semibold text-gray-900">New Findings</span>
            </div>
            <div className="text-3xl font-bold text-red-600">{newFindings.length}</div>
            <div className="text-sm text-gray-600 mt-1">
              Detected in new version
            </div>
          </div>
        </div>

        {/* Category Filter */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-sm font-medium text-gray-700">Filter by category:</span>
            <div className="flex gap-2">
              {['all', 'weaknesses', 'clarity', 'novelty', 'reviewer_feedback'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    selectedCategory === cat
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {cat === 'all' ? 'All' : cat.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Detailed Findings */}
        <div className="space-y-8">
          {/* Resolved Findings */}
          {filterByCategory(resolvedFindings).length > 0 && (
            <div>
              <div className="flex items-center gap-3 mb-4">
                <CheckCircle className="w-6 h-6 text-green-600" />
                <h3 className="text-xl font-bold text-gray-900">
                  Resolved Findings ({filterByCategory(resolvedFindings).length})
                </h3>
              </div>
              <div className="space-y-3">
                {filterByCategory(resolvedFindings).map((finding, idx) => (
                  <div key={idx}>
                    {renderFindingCard(finding, 'resolved')}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Remaining Findings */}
          {filterByCategory(remainingFindings).length > 0 && (
            <div>
              <div className="flex items-center gap-3 mb-4">
                <AlertCircle className="w-6 h-6 text-yellow-600" />
                <h3 className="text-xl font-bold text-gray-900">
                  Remaining Findings ({filterByCategory(remainingFindings).length})
                </h3>
              </div>
              <div className="space-y-3">
                {filterByCategory(remainingFindings).map((finding, idx) => (
                  <div key={idx}>
                    {renderFindingCard(finding, 'remaining')}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* New Findings */}
          {filterByCategory(newFindings).length > 0 && (
            <div>
              <div className="flex items-center gap-3 mb-4">
                <XCircle className="w-6 h-6 text-red-600" />
                <h3 className="text-xl font-bold text-gray-900">
                  New Findings ({filterByCategory(newFindings).length})
                </h3>
              </div>
              <div className="space-y-3">
                {filterByCategory(newFindings).map((finding, idx) => (
                  <div key={idx}>
                    {renderFindingCard(finding, 'new')}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* No findings in selected category */}
          {filterByCategory(resolvedFindings).length === 0 &&
           filterByCategory(remainingFindings).length === 0 &&
           filterByCategory(newFindings).length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <AlertCircle className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>No findings in the selected category</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BeforeAfterAnalysis;
