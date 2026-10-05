import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Search, Filter, AlertCircle, CheckCircle, Target, 
  Database, Code, TrendingUp, GitCompare, X, Lightbulb,
  FileText, BarChart3, Brain, Award, ChevronDown, ChevronUp 
} from 'lucide-react';

/**
 * ClaimInspector - Extract and analyze research claims from papers
 * 
 * Categorizes claims into:
 * - Novelty claims: "We are the first to..."
 * - Performance claims: "We achieve state-of-the-art..."
 * - Method claims: "We propose a novel..."
 * - Dataset claims: "We evaluate on..."
 * - Comparison claims: "Compared to existing methods..."
 * 
 * For each claim shows:
 * - Claim text (exact from paper)
 * - Description
 * - Claim type
 * - Relevant section
 * - Evidence
 * - Related research
 * - Model analysis
 * - Confidence
 * - Recommended investigation
 */
const ClaimInspector = ({ paperId }) => {
  const [claims, setClaims] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [expandedClaims, setExpandedClaims] = useState({});
  const [sortBy, setSortBy] = useState('position'); // position, confidence, type

  useEffect(() => {
    fetchClaims();
  }, [paperId]);

  const fetchClaims = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `/api/v1/papers/${paperId}/claims`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setClaims(response.data.claims || []);
      setSummary(response.data.summary || null);
    } catch (err) {
      console.error('Error fetching claims:', err);
      setError('Failed to extract claims. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Get icon for claim type
  const getClaimIcon = (type) => {
    const icons = {
      novelty: Award,
      performance: TrendingUp,
      method: Code,
      dataset: Database,
      comparison: GitCompare,
    };
    return icons[type] || Target;
  };

  // Get color for claim type
  const getClaimColor = (type) => {
    const colors = {
      novelty: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
      performance: 'text-green-400 bg-green-500/10 border-green-500/30',
      method: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
      dataset: 'text-orange-400 bg-orange-500/10 border-orange-500/30',
      comparison: 'text-pink-400 bg-pink-500/10 border-pink-500/30',
    };
    return colors[type] || 'text-gray-400 bg-gray-500/10 border-gray-500/30';
  };

  // Filter and sort claims
  const filteredClaims = claims
    .filter(claim => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (!claim.claim_text.toLowerCase().includes(query) &&
            !claim.description.toLowerCase().includes(query)) {
          return false;
        }
      }
      // Type filter
      if (selectedTypes.length > 0 && !selectedTypes.includes(claim.claim_type)) {
        return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'confidence') return b.confidence - a.confidence;
      if (sortBy === 'type') return a.claim_type.localeCompare(b.claim_type);
      return a.position - b.position; // default: document order
    });

  // Toggle claim type filter
  const toggleTypeFilter = (type) => {
    setSelectedTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  // Toggle claim expansion
  const toggleClaim = (claimId) => {
    setExpandedClaims(prev => ({ ...prev, [claimId]: !prev[claimId] }));
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <span className="ml-4 text-gray-600">Extracting claims from paper...</span>
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

  if (!claims || claims.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-8 text-center">
        <FileText className="w-16 h-16 mx-auto text-gray-400 mb-4" />
        <h3 className="text-xl font-bold text-gray-700 mb-2">No Claims Found</h3>
        <p className="text-gray-500">
          No research claims were detected in this paper. This could mean the paper
          doesn't contain explicit claims or uses different phrasing.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Summary */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-3xl font-bold">Claim Inspector</h2>
            <p className="text-purple-100 text-sm mt-1">
              Research claims extracted and categorized from your paper
            </p>
          </div>
          {summary && (
            <div className="text-right">
              <div className="text-5xl font-bold">{summary.total_claims}</div>
              <div className="text-sm opacity-80">Total Claims</div>
            </div>
          )}
        </div>

        {/* Summary Statistics */}
        {summary && (
          <div className="grid grid-cols-5 gap-4 mt-6">
            {Object.entries(summary.by_type).map(([type, count]) => {
              const Icon = getClaimIcon(type);
              return (
                <div key={type} className="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
                  <Icon className="w-5 h-5 mb-2" />
                  <div className="text-2xl font-bold">{count}</div>
                  <div className="text-xs opacity-80 capitalize">{type}</div>
                </div>
              );
            })}
          </div>
        )}

        {summary && (
          <div className="mt-4 flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              <span>Avg Confidence: {(summary.average_confidence * 100).toFixed(0)}%</span>
            </div>
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4" />
              <span>High Confidence: {summary.high_confidence_claims}</span>
            </div>
          </div>
        )}
      </div>

      {/* Search and Filter Controls */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-wrap gap-4 items-center">
          {/* Search */}
          <div className="flex-1 min-w-[300px] relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search claims..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {/* Type Filters */}
          <div className="flex gap-2 flex-wrap">
            {['novelty', 'performance', 'method', 'dataset', 'comparison'].map(type => {
              const Icon = getClaimIcon(type);
              const isSelected = selectedTypes.includes(type);
              return (
                <button
                  key={type}
                  onClick={() => toggleTypeFilter(type)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all ${
                    isSelected
                      ? 'bg-purple-600 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="capitalize">{type}</span>
                </button>
              );
            })}
          </div>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="position">Document Order</option>
            <option value="confidence">Confidence</option>
            <option value="type">Type</option>
          </select>
        </div>

        {/* Active filters indicator */}
        {(selectedTypes.length > 0 || searchQuery) && (
          <div className="mt-3 flex items-center gap-2 text-sm text-gray-600">
            <Filter className="w-4 h-4" />
            <span>Showing {filteredClaims.length} of {claims.length} claims</span>
            {(selectedTypes.length > 0 || searchQuery) && (
              <button
                onClick={() => {
                  setSelectedTypes([]);
                  setSearchQuery('');
                }}
                className="text-purple-600 hover:text-purple-700 font-medium ml-2"
              >
                Clear filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* Claims List */}
      <div className="space-y-4">
        {filteredClaims.map((claim) => {
          const Icon = getClaimIcon(claim.claim_type);
          const isExpanded = expandedClaims[claim.claim_id];
          const colorClass = getClaimColor(claim.claim_type);

          return (
            <div
              key={claim.claim_id}
              className={`bg-white rounded-lg shadow-lg border-2 overflow-hidden transition-all ${colorClass}`}
            >
              {/* Claim Header - Always Visible */}
              <div
                className="p-6 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => toggleClaim(claim.claim_id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* Type Badge */}
                    <div className="flex items-center gap-2 mb-3">
                      <Icon className="w-5 h-5" />
                      <span className="text-sm font-semibold uppercase tracking-wide">
                        {claim.claim_type} Claim
                      </span>
                      <span className="text-xs px-2 py-1 bg-white/50 rounded">
                        {claim.section}
                      </span>
                    </div>

                    {/* Claim Text */}
                    <div className="mb-2">
                      <p className="text-lg font-medium text-gray-800 leading-relaxed">
                        "{claim.claim_text}"
                      </p>
                    </div>

                    {/* Description */}
                    <p className="text-sm text-gray-600 italic mb-3">
                      {claim.description}
                    </p>

                    {/* Metrics if present */}
                    {claim.metrics && claim.metrics.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {claim.metrics.map((metric, idx) => (
                          <span
                            key={idx}
                            className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-mono font-semibold"
                          >
                            {metric}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Quick Stats */}
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <BarChart3 className="w-4 h-4" />
                        <span>Confidence: {(claim.confidence * 100).toFixed(0)}%</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <FileText className="w-4 h-4" />
                        <span>Section: {claim.section}</span>
                      </div>
                    </div>
                  </div>

                  {/* Expand/Collapse Button */}
                  <button className="ml-4 p-2 hover:bg-gray-100 rounded-lg transition-colors">
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5" />
                    ) : (
                      <ChevronDown className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Expanded Details */}
              {isExpanded && (
                <div className="border-t border-gray-200 bg-gray-50 p-6 space-y-6">
                  {/* Evidence */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="w-4 h-4 text-gray-600" />
                      <h4 className="font-semibold text-gray-800">Evidence from Paper</h4>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                      <p className="text-sm text-gray-700 leading-relaxed italic">
                        {claim.evidence || 'Evidence unavailable'}
                      </p>
                    </div>
                  </div>

                  {/* Model Analysis */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Brain className="w-4 h-4 text-gray-600" />
                      <h4 className="font-semibold text-gray-800">Model Analysis</h4>
                    </div>
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <p className="text-sm text-blue-900 leading-relaxed">
                        {claim.model_analysis}
                      </p>
                    </div>
                  </div>

                  {/* Related Research */}
                  {claim.related_research && claim.related_research.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Target className="w-4 h-4 text-gray-600" />
                        <h4 className="font-semibold text-gray-800">Related Research</h4>
                      </div>
                      <div className="space-y-2">
                        {claim.related_research.map((paper, idx) => (
                          <div
                            key={idx}
                            className="bg-white p-3 rounded-lg border border-gray-200 flex items-center justify-between"
                          >
                            <div>
                              <p className="text-sm font-medium text-gray-800">
                                {paper.title || `Related Paper ${idx + 1}`}
                              </p>
                              {paper.similarity && (
                                <p className="text-xs text-gray-500 mt-1">
                                  Similarity: {(paper.similarity * 100).toFixed(0)}%
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recommended Investigation */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Lightbulb className="w-4 h-4 text-yellow-600" />
                      <h4 className="font-semibold text-gray-800">Recommended Investigation</h4>
                    </div>
                    <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                      <p className="text-sm text-yellow-900 leading-relaxed">
                        {claim.recommended_investigation}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Empty State for Filtered Results */}
      {filteredClaims.length === 0 && claims.length > 0 && (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <Filter className="w-12 h-12 mx-auto text-gray-400 mb-3" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">No Matching Claims</h3>
          <p className="text-gray-500">
            No claims match your current filters. Try adjusting your search or filter criteria.
          </p>
        </div>
      )}
    </div>
  );
};

export default ClaimInspector;
