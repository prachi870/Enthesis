import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  AlertCircle, CheckCircle, Info, X, ChevronRight,
  FileText, TrendingUp, Code, Search, Beaker,
  BarChart3, MessageSquare, Target, Shield
} from 'lucide-react';

/**
 * WeaknessHeatmap - Visual heatmap of paper sections with detected issues
 * 
 * Shows 8 standard paper sections:
 * - Abstract, Introduction, Related Work, Methodology
 * - Experiments, Results, Discussion, Conclusion
 * 
 * For each section displays:
 * - Heat level (color-coded: green/yellow/orange/red)
 * - Number of findings
 * - Finding categories
 * - Descriptions
 * - Confidence
 * - Evidence
 * - Recommended actions
 * 
 * Categories:
 * - Missing Baseline
 * - Weak Evaluation
 * - Unclear Method
 * - Limited Novelty
 * - Insufficient Evidence
 * - Poor Clarity
 * 
 * Uses cautious language - "Potential issues detected"
 */
const WeaknessHeatmap = ({ paperId }) => {
  const [heatmapData, setHeatmapData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSection, setSelectedSection] = useState(null);

  useEffect(() => {
    fetchHeatmap();
  }, [paperId]);

  const fetchHeatmap = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `/api/v1/papers/${paperId}/weakness-heatmap`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setHeatmapData(response.data);
    } catch (err) {
      console.error('Error fetching weakness heatmap:', err);
      setError('Failed to generate weakness heatmap. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Get section icon
  const getSectionIcon = (section) => {
    const icons = {
      abstract: FileText,
      introduction: Target,
      related_work: Search,
      methodology: Code,
      experiments: Beaker,
      results: BarChart3,
      discussion: MessageSquare,
      conclusion: CheckCircle
    };
    return icons[section] || FileText;
  };

  // Get heat color classes
  const getHeatColorClass = (color) => {
    const colors = {
      green: 'bg-green-100 border-green-300 text-green-800 hover:bg-green-200',
      yellow: 'bg-yellow-100 border-yellow-300 text-yellow-800 hover:bg-yellow-200',
      orange: 'bg-orange-100 border-orange-300 text-orange-800 hover:bg-orange-200',
      red: 'bg-red-100 border-red-300 text-red-800 hover:bg-red-200'
    };
    return colors[color] || colors.green;
  };

  // Get severity badge color
  const getSeverityColor = (severity) => {
    const colors = {
      high: 'bg-red-500 text-white',
      medium: 'bg-orange-500 text-white',
      low: 'bg-yellow-500 text-white'
    };
    return colors[severity] || colors.medium;
  };

  // Get category icon
  const getCategoryIcon = (category) => {
    const normalized = category.toLowerCase().replace(/\s+/g, '_');
    const icons = {
      missing_baseline: TrendingUp,
      weak_evaluation: BarChart3,
      unclear_method: Code,
      limited_novelty: Target,
      insufficient_evidence: Shield,
      poor_clarity: FileText
    };
    return icons[normalized] || AlertCircle;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
          <span className="ml-4 text-gray-600">Generating weakness heatmap...</span>
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

  if (!heatmapData) {
    return null;
  }

  const { sections, heat_map, summary } = heatmapData;

  return (
    <div className="space-y-6">
      {/* Header with Summary */}
      <div className="bg-gradient-to-r from-red-600 to-orange-600 text-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-3xl font-bold">Weakness Heatmap</h2>
            <p className="text-red-100 text-sm mt-1">
              Visual analysis of potential issues across paper sections
            </p>
          </div>
          {summary && (
            <div className="text-right">
              <div className="text-5xl font-bold">{summary.total_findings}</div>
              <div className="text-sm opacity-80">Potential Issues</div>
            </div>
          )}
        </div>

        {/* Summary Stats */}
        {summary && (
          <div className="grid grid-cols-4 gap-4 mt-6">
            <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
              <div className="text-sm opacity-80">Sections Analyzed</div>
              <div className="text-2xl font-bold">{summary.sections_analyzed}</div>
            </div>
            <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
              <div className="text-sm opacity-80">Sections w/ Issues</div>
              <div className="text-2xl font-bold">{summary.sections_with_issues}</div>
            </div>
            <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
              <div className="text-sm opacity-80">High Severity</div>
              <div className="text-2xl font-bold">{summary.by_severity?.high || 0}</div>
            </div>
            <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
              <div className="text-sm opacity-80">Overall Health</div>
              <div className="text-lg font-bold capitalize">
                {summary.overall_health?.replace('_', ' ')}
              </div>
            </div>
          </div>
        )}

        {/* Hotspots */}
        {summary && summary.hotspots && summary.hotspots.length > 0 && (
          <div className="mt-4 p-3 bg-white/10 rounded-lg backdrop-blur-sm">
            <div className="text-sm font-semibold mb-2">🔥 Top Sections Requiring Attention:</div>
            <div className="flex flex-wrap gap-2">
              {summary.hotspots.map((hotspot, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 bg-white/20 rounded-full text-xs font-medium"
                >
                  {hotspot.section} ({hotspot.findings_count})
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Heatmap Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Object.entries(heat_map).map(([sectionKey, heatInfo]) => {
          const SectionIcon = getSectionIcon(sectionKey);
          const sectionName = sectionKey.replace(/_/g, ' ');
          const sectionWeaknesses = sections[sectionKey] || [];
          const colorClass = getHeatColorClass(heatInfo.color);

          return (
            <button
              key={sectionKey}
              onClick={() => setSelectedSection(sectionKey)}
              className={`relative p-6 rounded-lg border-2 transition-all duration-200 text-left ${colorClass}`}
            >
              {/* Heat Indicator */}
              <div className="absolute top-2 right-2">
                <div
                  className={`w-3 h-3 rounded-full ${
                    heatInfo.color === 'red'
                      ? 'bg-red-500'
                      : heatInfo.color === 'orange'
                      ? 'bg-orange-500'
                      : heatInfo.color === 'yellow'
                      ? 'bg-yellow-500'
                      : 'bg-green-500'
                  }`}
                ></div>
              </div>

              {/* Section Info */}
              <SectionIcon className="w-8 h-8 mb-3" />
              <h3 className="font-bold text-lg capitalize mb-1">{sectionName}</h3>
              
              {heatInfo.findings_count > 0 ? (
                <div className="mt-2">
                  <div className="text-sm font-semibold">
                    {heatInfo.findings_count} potential issue{heatInfo.findings_count > 1 ? 's' : ''} detected
                  </div>
                  <div className="text-xs mt-1 capitalize opacity-75">
                    Heat: {heatInfo.level}
                  </div>
                </div>
              ) : (
                <div className="text-sm text-green-700 mt-2">
                  ✓ No issues detected
                </div>
              )}

              <ChevronRight className="absolute bottom-2 right-2 w-5 h-5 opacity-50" />
            </button>
          );
        })}
      </div>

      {/* Detailed Section View Modal */}
      {selectedSection && sections[selectedSection] && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className={`p-6 ${getHeatColorClass(heat_map[selectedSection].color)}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {React.createElement(getSectionIcon(selectedSection), { className: 'w-8 h-8' })}
                  <div>
                    <h3 className="text-2xl font-bold capitalize">
                      {selectedSection.replace(/_/g, ' ')}
                    </h3>
                    <p className="text-sm mt-1">
                      {sections[selectedSection].length} potential issue
                      {sections[selectedSection].length > 1 ? 's' : ''} detected
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedSection(null)}
                  className="p-2 hover:bg-black/10 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              {sections[selectedSection].length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                  <p className="text-lg font-semibold text-gray-700">
                    No issues detected in this section
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    This section appears to be well-structured
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {sections[selectedSection].map((weakness, idx) => {
                    const CategoryIcon = getCategoryIcon(weakness.category);
                    return (
                      <div
                        key={idx}
                        className="bg-gray-50 rounded-lg border-2 border-gray-200 overflow-hidden"
                      >
                        {/* Weakness Header */}
                        <div className="bg-white p-4 border-b border-gray-200">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3 flex-1">
                              <CategoryIcon className="w-6 h-6 text-gray-600 flex-shrink-0 mt-1" />
                              <div className="flex-1">
                                <h4 className="font-bold text-lg text-gray-800">
                                  {weakness.category}
                                </h4>
                                <p className="text-sm text-gray-600 mt-1">
                                  {weakness.description}
                                </p>
                              </div>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getSeverityColor(weakness.severity)}`}>
                              {weakness.severity} severity
                            </span>
                          </div>
                        </div>

                        {/* Weakness Details */}
                        <div className="p-4 space-y-4">
                          {/* Explanation */}
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <Info className="w-4 h-4 text-blue-600" />
                              <div className="text-sm font-semibold text-gray-700">
                                What This Means
                              </div>
                            </div>
                            <p className="text-sm text-gray-700 leading-relaxed pl-6">
                              {weakness.explanation}
                            </p>
                          </div>

                          {/* Evidence */}
                          {weakness.evidence && (
                            <div>
                              <div className="flex items-center gap-2 mb-2">
                                <FileText className="w-4 h-4 text-purple-600" />
                                <div className="text-sm font-semibold text-gray-700">
                                  Evidence from Paper
                                </div>
                              </div>
                              <div className="bg-white p-3 rounded border border-gray-200 pl-6">
                                <p className="text-sm text-gray-600 italic leading-relaxed">
                                  {weakness.evidence}
                                </p>
                              </div>
                            </div>
                          )}

                          {/* Confidence */}
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <Shield className="w-4 h-4 text-green-600" />
                              <div className="text-sm font-semibold text-gray-700">
                                Detection Confidence
                              </div>
                            </div>
                            <div className="flex items-center gap-3 pl-6">
                              <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-green-500"
                                  style={{ width: `${weakness.confidence * 100}%` }}
                                ></div>
                              </div>
                              <span className="text-sm font-mono text-gray-600">
                                {(weakness.confidence * 100).toFixed(0)}%
                              </span>
                            </div>
                            {weakness.match_count > 1 && (
                              <p className="text-xs text-gray-500 mt-1 pl-6">
                                Based on {weakness.match_count} pattern matches
                              </p>
                            )}
                          </div>

                          {/* Recommended Action */}
                          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r">
                            <div className="flex items-start gap-2">
                              <Target className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                              <div>
                                <div className="text-sm font-semibold text-blue-900 mb-1">
                                  Recommended Action
                                </div>
                                <p className="text-sm text-blue-800 leading-relaxed">
                                  {weakness.recommended_action}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Info className="w-5 h-5" />
          Heatmap Legend
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 rounded-full bg-green-500"></div>
            <div>
              <div className="text-sm font-semibold">None/Minimal</div>
              <div className="text-xs text-gray-500">No issues detected</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 rounded-full bg-yellow-500"></div>
            <div>
              <div className="text-sm font-semibold">Low</div>
              <div className="text-xs text-gray-500">Minor concerns</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 rounded-full bg-orange-500"></div>
            <div>
              <div className="text-sm font-semibold">Medium</div>
              <div className="text-xs text-gray-500">Moderate issues</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 rounded-full bg-red-500"></div>
            <div>
              <div className="text-sm font-semibold">High</div>
              <div className="text-xs text-gray-500">Attention needed</div>
            </div>
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-yellow-900">
            <strong>Important:</strong> This analysis detects <strong>potential issues</strong> using
            pattern-based methods. Not all detected issues are actual problems, and some real issues may
            not be detected. Use this as a guide for manual review - never as definitive judgment of quality.
            Language used throughout is intentionally cautious ("potential", "may", "could").
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeaknessHeatmap;
