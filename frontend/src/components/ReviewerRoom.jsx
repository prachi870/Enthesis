import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  AlertCircle, CheckCircle, Info, X, Users, 
  Code, Target, BarChart3, FileText, Beaker,
  TrendingUp, Shield, Lightbulb, AlertTriangle,
  MessageSquare, ChevronRight, Award
} from 'lucide-react';

/**
 * ReviewerRoom - AI-generated reviewer-style feedback organized by categories
 * 
 * Categories:
 * - Methodology: Concerns about approaches and techniques
 * - Novelty: Questions about originality
 * - Evaluation: Issues with experiments and validation
 * - Clarity: Writing and presentation concerns
 * - Experimental Design: Problems with experimental rigor
 * 
 * For each pattern shows:
 * - Pattern name
 * - Description
 * - Detected concern
 * - Evidence from paper
 * - Related patterns
 * - Confidence
 * - Recommended investigation
 * 
 * CLEARLY LABELED: "AI-generated reviewer-style feedback"
 * Does NOT represent actual human reviews or reviewer identities.
 */
const ReviewerRoom = ({ paperId }) => {
  const [roomData, setRoomData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedPattern, setSelectedPattern] = useState(null);

  useEffect(() => {
    fetchReviewerRoom();
  }, [paperId]);

  const fetchReviewerRoom = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `/api/v1/papers/${paperId}/reviewer-room`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setRoomData(response.data);
    } catch (err) {
      console.error('Error fetching reviewer room:', err);
      setError('Failed to load reviewer room. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Get category icon
  const getCategoryIcon = (category) => {
    const icons = {
      methodology: Code,
      novelty: Target,
      evaluation: BarChart3,
      clarity: FileText,
      experimental_design: Beaker
    };
    return icons[category] || AlertCircle;
  };

  // Get category color
  const getCategoryColor = (category) => {
    const colors = {
      methodology: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
      novelty: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
      evaluation: 'text-green-400 bg-green-500/10 border-green-500/30',
      clarity: 'text-orange-400 bg-orange-500/10 border-orange-500/30',
      experimental_design: 'text-red-400 bg-red-500/10 border-red-500/30'
    };
    return colors[category] || 'text-gray-400 bg-gray-500/10 border-gray-500/30';
  };

  // Get severity badge color
  const getSeverityColor = (severity) => {
    const colors = {
      major: 'bg-red-500 text-white',
      moderate: 'bg-orange-500 text-white',
      minor: 'bg-yellow-500 text-white'
    };
    return colors[severity] || colors.moderate;
  };

  // Get reviewer style icon
  const getReviewerStyleIcon = (style) => {
    const icons = {
      thorough: Users,
      critical: AlertTriangle,
      methodical: BarChart3,
      constructive: Lightbulb,
      practical: Code
    };
    return icons[style] || MessageSquare;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          <span className="ml-4 text-gray-600">Loading reviewer room...</span>
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

  if (!roomData || !roomData.categories || Object.keys(roomData.categories).length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-8 text-center">
        <MessageSquare className="w-16 h-16 mx-auto text-gray-400 mb-4" />
        <h3 className="text-xl font-bold text-gray-700 mb-2">No Reviewer Feedback Available</h3>
        <p className="text-gray-500">
          Complete the analysis pipeline to generate AI reviewer-style feedback.
        </p>
      </div>
    );
  }

  const { categories, style_clusters, summary_stats, ai_generated_notice, disclaimer } = roomData;

  return (
    <div className="space-y-6">
      {/* AI-Generated Notice - PROMINENT */}
      <div className="bg-gradient-to-r from-yellow-400 to-orange-400 text-gray-900 rounded-lg shadow-lg p-4 border-2 border-yellow-500">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-6 h-6 flex-shrink-0 mt-0.5" />
          <div>
            <div className="font-bold text-lg mb-1">{ai_generated_notice}</div>
            <p className="text-sm">{disclaimer}</p>
          </div>
        </div>
      </div>

      {/* Header with Summary */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-3xl font-bold">Reviewer Room</h2>
            <p className="text-indigo-100 text-sm mt-1">
              AI-generated reviewer-style feedback patterns organized by category
            </p>
          </div>
          {summary_stats && (
            <div className="text-right">
              <div className="text-5xl font-bold">{summary_stats.total_patterns}</div>
              <div className="text-sm opacity-80">Feedback Patterns</div>
            </div>
          )}
        </div>

        {/* Summary Stats */}
        {summary_stats && (
          <div className="grid grid-cols-4 gap-4 mt-6">
            <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
              <div className="text-sm opacity-80">Categories</div>
              <div className="text-2xl font-bold">{summary_stats.categories_with_feedback}</div>
            </div>
            <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
              <div className="text-sm opacity-80">Major Concerns</div>
              <div className="text-2xl font-bold">{summary_stats.severity_distribution?.major || 0}</div>
            </div>
            <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
              <div className="text-sm opacity-80">Reviewer Styles</div>
              <div className="text-2xl font-bold">{summary_stats.style_cluster_count}</div>
            </div>
            <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
              <div className="text-sm opacity-80">Overall</div>
              <div className="text-lg font-bold capitalize">
                {summary_stats.overall_assessment?.replace(/_/g, ' ')}
              </div>
            </div>
          </div>
        )}

        {/* Recommendation */}
        {summary_stats && summary_stats.recommendation && (
          <div className="mt-4 p-3 bg-white/10 rounded-lg backdrop-blur-sm">
            <div className="text-sm font-semibold mb-1">💡 Overall Recommendation:</div>
            <div className="text-sm">{summary_stats.recommendation}</div>
          </div>
        )}
      </div>

      {/* Reviewer Style Clusters */}
      {style_clusters && style_clusters.length > 0 && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Users className="w-6 h-6" />
            Detected Reviewer Style Patterns
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {style_clusters.map((cluster, idx) => {
              const Icon = getReviewerStyleIcon(cluster.style);
              return (
                <div key={idx} className="bg-gray-50 rounded-lg p-4 border-2 border-gray-200">
                  <div className="flex items-start gap-3">
                    <Icon className="w-6 h-6 text-indigo-600 flex-shrink-0 mt-1" />
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-800 mb-1">{cluster.name}</h4>
                      <p className="text-sm text-gray-600 mb-2">{cluster.characteristics}</p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>{cluster.pattern_count} patterns</span>
                        <span>Confidence: {(cluster.avg_confidence * 100).toFixed(0)}%</span>
                      </div>
                      <div className="mt-2 flex gap-2">
                        {cluster.severity_distribution.major > 0 && (
                          <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs">
                            {cluster.severity_distribution.major} major
                          </span>
                        )}
                        {cluster.severity_distribution.moderate > 0 && (
                          <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs">
                            {cluster.severity_distribution.moderate} moderate
                          </span>
                        )}
                        {cluster.severity_distribution.minor > 0 && (
                          <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs">
                            {cluster.severity_distribution.minor} minor
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Category Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.entries(categories).map(([categoryKey, patterns]) => {
          const Icon = getCategoryIcon(categoryKey);
          const colorClass = getCategoryColor(categoryKey);
          const categoryName = categoryKey.replace(/_/g, ' ').split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');

          return (
            <button
              key={categoryKey}
              onClick={() => setSelectedCategory(categoryKey)}
              className={`relative p-6 rounded-lg border-2 transition-all duration-200 text-left ${colorClass} hover:shadow-lg`}
            >
              <Icon className="w-8 h-8 mb-3" />
              <h3 className="font-bold text-lg mb-2">{categoryName}</h3>
              <div className="text-sm opacity-90 mb-3">
                {patterns.length} pattern{patterns.length > 1 ? 's' : ''} detected
              </div>
              
              {/* Severity indicator */}
              <div className="flex gap-1">
                {['major', 'moderate', 'minor'].map(severity => {
                  const count = patterns.filter(p => p.severity === severity).length;
                  if (count > 0) {
                    return (
                      <span
                        key={severity}
                        className={`px-2 py-1 rounded text-xs font-semibold ${getSeverityColor(severity)}`}
                      >
                        {count} {severity}
                      </span>
                    );
                  }
                  return null;
                })}
              </div>

              <ChevronRight className="absolute bottom-2 right-2 w-5 h-5 opacity-50" />
            </button>
          );
        })}
      </div>

      {/* Category Detail Modal */}
      {selectedCategory && categories[selectedCategory] && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className={`p-6 ${getCategoryColor(selectedCategory)}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {React.createElement(getCategoryIcon(selectedCategory), { className: 'w-8 h-8' })}
                  <div>
                    <h3 className="text-2xl font-bold capitalize">
                      {selectedCategory.replace(/_/g, ' ')}
                    </h3>
                    <p className="text-sm mt-1">
                      {categories[selectedCategory].length} reviewer pattern{categories[selectedCategory].length > 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedCategory(null)}
                  className="p-2 hover:bg-black/10 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Modal Content - Pattern List */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              <div className="space-y-4">
                {categories[selectedCategory].map((pattern, idx) => {
                  const StyleIcon = getReviewerStyleIcon(pattern.reviewer_style);
                  return (
                    <button
                      key={idx}
                      onClick={() => setSelectedPattern(pattern)}
                      className="w-full bg-gray-50 rounded-lg border-2 border-gray-200 hover:border-indigo-300 p-4 text-left transition-all"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-bold text-lg text-gray-800">
                              {pattern.pattern_name}
                            </h4>
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getSeverityColor(pattern.severity)}`}>
                              {pattern.severity}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{pattern.description}</p>
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <StyleIcon className="w-3 h-3" />
                              {pattern.reviewer_style}
                            </span>
                            <span className="flex items-center gap-1">
                              <Shield className="w-3 h-3" />
                              {(pattern.confidence * 100).toFixed(0)}% confidence
                            </span>
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0 ml-3" />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pattern Detail Modal */}
      {selectedPattern && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            {/* Pattern Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-2xl font-bold">{selectedPattern.pattern_name}</h3>
                  <p className="text-sm text-indigo-100 mt-1">{selectedPattern.description}</p>
                </div>
                <button
                  onClick={() => setSelectedPattern(null)}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getSeverityColor(selectedPattern.severity)}`}>
                  {selectedPattern.severity} severity
                </span>
                <span className="px-3 py-1 bg-white/20 rounded-full text-sm font-semibold">
                  {selectedPattern.reviewer_style} reviewer
                </span>
              </div>
            </div>

            {/* Pattern Details */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)] space-y-6">
              {/* Detected Concern */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                  <h4 className="font-bold text-gray-800">Detected Concern</h4>
                </div>
                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r">
                  <p className="text-sm text-red-900 leading-relaxed">
                    {selectedPattern.detected_concern}
                  </p>
                </div>
              </div>

              {/* Evidence */}
              {selectedPattern.evidence && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="w-5 h-5 text-blue-600" />
                    <h4 className="font-bold text-gray-800">Evidence from Your Paper</h4>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <p className="text-sm text-blue-900 italic leading-relaxed">
                      {selectedPattern.evidence}
                    </p>
                  </div>
                </div>
              )}

              {/* Confidence */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="w-5 h-5 text-green-600" />
                  <h4 className="font-bold text-gray-800">Detection Confidence</h4>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500"
                      style={{ width: `${selectedPattern.confidence * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-mono text-gray-600">
                    {(selectedPattern.confidence * 100).toFixed(0)}%
                  </span>
                </div>
              </div>

              {/* Related Patterns */}
              {selectedPattern.related_patterns && selectedPattern.related_patterns.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-5 h-5 text-purple-600" />
                    <h4 className="font-bold text-gray-800">Related Reviewer Patterns</h4>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selectedPattern.related_patterns.map((related, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-2 bg-purple-100 text-purple-800 rounded-lg text-sm font-medium"
                      >
                        {related}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommended Investigation */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Lightbulb className="w-5 h-5 text-yellow-600" />
                  <h4 className="font-bold text-gray-800">Recommended Investigation</h4>
                </div>
                <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-r">
                  <p className="text-sm text-yellow-900 leading-relaxed">
                    {selectedPattern.recommended_investigation}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Disclaimer Footer */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-900">
            <strong>Reminder:</strong> This feedback is generated by AI pattern analysis and represents
            simulated reviewer-style concerns based on common patterns in research papers. It does not
            come from actual human reviewers and should be used as a guide for self-review, not as
            definitive peer review. Always seek feedback from human experts in your field.
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReviewerRoom;
