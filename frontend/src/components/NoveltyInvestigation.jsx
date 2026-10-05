import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Search, Filter, AlertTriangle, CheckCircle, AlertCircle,
  Info, X, ChevronDown, ChevronUp, ExternalLink, Target,
  FileText, Lightbulb, TrendingUp, GitCompare, Book,
  Shield, HelpCircle, ArrowRight, Layers
} from 'lucide-react';

/**
 * NoveltyInvestigation - Detailed NLI-style analysis of research claims
 * 
 * For each claim shows:
 * 1. Claim text
 * 2. Relevant existing research
 * 3. Evidence (from paper and literature)
 * 4. NLI result (classification)
 * 5. Detailed explanation
 * 
 * Classifications:
 * - Supported: Claim backed by existing work
 * - Contradicted: Claim conflicts with evidence
 * - Potentially Overlapping: Similar claims exist
 * - Potentially Novel: Appears unique
 * - Insufficient Evidence: Can't determine
 * - Uncertain: Mixed signals
 * 
 * Uses cautious language throughout - never definitive judgments.
 */
const NoveltyInvestigation = ({ paperId }) => {
  const [investigations, setInvestigations] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClassifications, setSelectedClassifications] = useState([]);
  const [expandedClaims, setExpandedClaims] = useState({});
  const [showOnlyVerification, setShowOnlyVerification] = useState(false);

  useEffect(() => {
    fetchInvestigations();
  }, [paperId]);

  const fetchInvestigations = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `/api/v1/papers/${paperId}/novelty-investigation`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setInvestigations(response.data.investigations || []);
      setSummary(response.data.summary || null);
    } catch (err) {
      console.error('Error fetching novelty investigations:', err);
      setError('Failed to investigate novelty. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Classification display info
  const getClassificationInfo = (type) => {
    const info = {
      supported: {
        icon: CheckCircle,
        color: 'text-green-400 bg-green-500/10 border-green-500/30',
        badgeColor: 'bg-green-500 text-white',
        label: 'Supported',
        description: 'Claim is backed by existing work in the literature'
      },
      contradicted: {
        icon: AlertTriangle,
        color: 'text-red-400 bg-red-500/10 border-red-500/30',
        badgeColor: 'bg-red-500 text-white',
        label: 'Contradicted',
        description: 'Potential contradiction with existing evidence detected'
      },
      potentially_overlapping: {
        icon: Layers,
        color: 'text-orange-400 bg-orange-500/10 border-orange-500/30',
        badgeColor: 'bg-orange-500 text-white',
        label: 'Potentially Overlapping',
        description: 'Similar claims may already be established'
      },
      potentially_novel: {
        icon: Target,
        color: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
        badgeColor: 'bg-purple-500 text-white',
        label: 'Potentially Novel',
        description: 'Claim appears to present unique contributions'
      },
      insufficient_evidence: {
        icon: HelpCircle,
        color: 'text-gray-400 bg-gray-500/10 border-gray-500/30',
        badgeColor: 'bg-gray-500 text-white',
        label: 'Insufficient Evidence',
        description: 'Not enough information to make confident assessment'
      },
      uncertain: {
        icon: AlertCircle,
        color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30',
        badgeColor: 'bg-yellow-500 text-white',
        label: 'Uncertain',
        description: 'Mixed signals make classification unclear'
      }
    };
    return info[type] || info.uncertain;
  };

  // Filter and search
  const filteredInvestigations = investigations.filter(inv => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (!inv.claim_text.toLowerCase().includes(query) &&
          !inv.explanation.toLowerCase().includes(query)) {
        return false;
      }
    }
    // Classification filter
    if (selectedClassifications.length > 0 &&
        !selectedClassifications.includes(inv.nli_result.type)) {
      return false;
    }
    // Verification filter
    if (showOnlyVerification && !inv.requires_verification) {
      return false;
    }
    return true;
  });

  // Toggle classification filter
  const toggleClassificationFilter = (type) => {
    setSelectedClassifications(prev =>
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          <span className="ml-4 text-gray-600">Investigating claim novelty...</span>
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

  if (!investigations || investigations.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-8 text-center">
        <FileText className="w-16 h-16 mx-auto text-gray-400 mb-4" />
        <h3 className="text-xl font-bold text-gray-700 mb-2">No Claims to Investigate</h3>
        <p className="text-gray-500">
          No research claims were found in this paper. Upload a paper with explicit
          research claims to see novelty investigation results.
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
            <h2 className="text-3xl font-bold">Novelty Investigation</h2>
            <p className="text-purple-100 text-sm mt-1">
              NLI-style analysis of research claims against existing literature
            </p>
          </div>
          {summary && (
            <div className="text-right">
              <div className="text-5xl font-bold">{summary.total_claims}</div>
              <div className="text-sm opacity-80">Claims Analyzed</div>
            </div>
          )}
        </div>

        {/* Summary Statistics */}
        {summary && summary.by_classification && (
          <div className="grid grid-cols-3 gap-4 mt-6">
            {Object.entries(summary.by_classification).map(([type, count]) => {
              const info = getClassificationInfo(type);
              const Icon = info.icon;
              return (
                <div key={type} className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
                  <Icon className="w-5 h-5 mb-2" />
                  <div className="text-2xl font-bold">{count}</div>
                  <div className="text-xs opacity-80">{info.label}</div>
                </div>
              );
            })}
          </div>
        )}

        {/* Key Metrics */}
        {summary && (
          <div className="mt-4 flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              <span>Avg Confidence: {(summary.average_confidence * 100).toFixed(0)}%</span>
            </div>
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              <span>Requires Verification: {summary.requires_verification_count}</span>
            </div>
            {summary.related_papers_available > 0 && (
              <div className="flex items-center gap-2">
                <Book className="w-4 h-4" />
                <span>Related Papers: {summary.related_papers_available}</span>
              </div>
            )}
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
              placeholder="Search investigations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {/* Verification Filter */}
          <button
            onClick={() => setShowOnlyVerification(!showOnlyVerification)}
            className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all ${
              showOnlyVerification
                ? 'bg-yellow-500 text-white shadow-lg'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <AlertCircle className="w-4 h-4" />
            Needs Verification
          </button>
        </div>

        {/* Classification Filters */}
        <div className="mt-4 flex flex-wrap gap-2">
          {['supported', 'contradicted', 'potentially_overlapping', 'potentially_novel', 'insufficient_evidence', 'uncertain'].map(type => {
            const info = getClassificationInfo(type);
            const Icon = info.icon;
            const isSelected = selectedClassifications.includes(type);
            return (
              <button
                key={type}
                onClick={() => toggleClassificationFilter(type)}
                className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all ${
                  isSelected
                    ? info.badgeColor + ' shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{info.label}</span>
              </button>
            );
          })}
        </div>

        {/* Active filters indicator */}
        {(selectedClassifications.length > 0 || searchQuery || showOnlyVerification) && (
          <div className="mt-3 flex items-center gap-2 text-sm text-gray-600">
            <Filter className="w-4 h-4" />
            <span>Showing {filteredInvestigations.length} of {investigations.length} claims</span>
            <button
              onClick={() => {
                setSelectedClassifications([]);
                setSearchQuery('');
                setShowOnlyVerification(false);
              }}
              className="text-purple-600 hover:text-purple-700 font-medium ml-2"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>

      {/* Investigations List */}
      <div className="space-y-4">
        {filteredInvestigations.map((inv) => {
          const classInfo = getClassificationInfo(inv.nli_result.type);
          const Icon = classInfo.icon;
          const isExpanded = expandedClaims[inv.claim_id];

          return (
            <div
              key={inv.claim_id}
              className={`bg-white rounded-lg shadow-lg border-2 overflow-hidden transition-all ${classInfo.color}`}
            >
              {/* Claim Header */}
              <div
                className="p-6 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => toggleClaim(inv.claim_id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* Classification Badge */}
                    <div className="flex items-center gap-3 mb-3">
                      <span className={`px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 ${classInfo.badgeColor}`}>
                        <Icon className="w-4 h-4" />
                        {classInfo.label}
                      </span>
                      {inv.requires_verification && (
                        <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-lg text-xs font-semibold flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          Verification Required
                        </span>
                      )}
                      <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded capitalize">
                        {inv.claim_type}
                      </span>
                    </div>

                    {/* Claim Text */}
                    <p className="text-lg font-medium text-gray-800 leading-relaxed mb-3">
                      "{inv.claim_text}"
                    </p>

                    {/* Quick Info */}
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Shield className="w-4 h-4" />
                        <span>Confidence: {(inv.confidence * 100).toFixed(0)}%</span>
                      </div>
                      {inv.relevant_research && inv.relevant_research.length > 0 && (
                        <div className="flex items-center gap-1">
                          <Book className="w-4 h-4" />
                          <span>{inv.relevant_research.length} Related Paper(s)</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Expand Button */}
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
                <div className="border-t border-gray-200 bg-gray-50">
                  {/* Investigation Flow */}
                  <div className="p-6 space-y-6">
                    {/* Step 1: Relevant Research */}
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                          1
                        </div>
                        <h4 className="font-bold text-gray-800 text-lg">Relevant Existing Research</h4>
                      </div>
                      {inv.relevant_research && inv.relevant_research.length > 0 ? (
                        <div className="space-y-3 ml-10">
                          {inv.relevant_research.map((paper, idx) => (
                            <div
                              key={idx}
                              className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm"
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <p className="font-semibold text-gray-800 mb-1">
                                    {paper.title || `Related Paper ${idx + 1}`}
                                  </p>
                                  {paper.retrieval_reason && (
                                    <p className="text-sm text-gray-600 mb-2">
                                      {paper.retrieval_reason}
                                    </p>
                                  )}
                                  <div className="flex items-center gap-4 text-xs text-gray-500">
                                    <span>Relevance: {(paper.relevance * 100).toFixed(0)}%</span>
                                    <span className="capitalize">{paper.relationship?.replace(/_/g, ' ')}</span>
                                  </div>
                                </div>
                                <ExternalLink className="w-4 h-4 text-gray-400 flex-shrink-0 ml-3" />
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="ml-10 p-4 bg-white rounded-lg border border-gray-200 text-sm text-gray-600">
                          No closely related research papers were found in the analysis.
                        </div>
                      )}
                    </div>

                    <ArrowRight className="w-6 h-6 text-gray-400 mx-auto" />

                    {/* Step 2: Evidence */}
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                          2
                        </div>
                        <h4 className="font-bold text-gray-800 text-lg">Evidence</h4>
                      </div>
                      <div className="ml-10 space-y-3">
                        {/* Evidence from paper */}
                        <div>
                          <div className="text-sm font-semibold text-gray-700 mb-2">From Your Paper:</div>
                          <div className="bg-white p-4 rounded-lg border border-gray-200">
                            <p className="text-sm text-gray-700 italic leading-relaxed">
                              {inv.evidence.from_paper}
                            </p>
                          </div>
                        </div>

                        {/* Evidence from literature */}
                        {inv.evidence.from_literature && inv.evidence.from_literature.length > 0 && (
                          <div>
                            <div className="text-sm font-semibold text-gray-700 mb-2">From Literature:</div>
                            <div className="bg-white p-4 rounded-lg border border-gray-200">
                              <div className="text-sm text-gray-700">
                                Found {inv.evidence.from_literature.length} related paper(s) with{' '}
                                <span className="font-semibold capitalize">{inv.evidence.strength}</span> evidence
                                {' '}strength.
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <ArrowRight className="w-6 h-6 text-gray-400 mx-auto" />

                    {/* Step 3: NLI Result */}
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                          3
                        </div>
                        <h4 className="font-bold text-gray-800 text-lg">NLI Classification Result</h4>
                      </div>
                      <div className="ml-10">
                        <div className={`p-6 rounded-lg border-2 ${classInfo.color}`}>
                          <div className="flex items-center gap-3 mb-4">
                            <Icon className="w-8 h-8" />
                            <div>
                              <div className="text-xl font-bold text-gray-800">{classInfo.label}</div>
                              <div className="text-sm text-gray-600">{classInfo.description}</div>
                            </div>
                          </div>

                          {/* NLI Scores */}
                          <div className="mt-4 space-y-2">
                            <div className="text-xs font-semibold text-gray-500 uppercase mb-2">
                              Analysis Scores
                            </div>
                            {Object.entries(inv.nli_result.scores).map(([key, value]) => (
                              <div key={key} className="flex items-center gap-2">
                                <span className="text-xs capitalize min-w-[80px]">{key}:</span>
                                <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-purple-600"
                                    style={{ width: `${value * 100}%` }}
                                  ></div>
                                </div>
                                <span className="text-xs font-mono">{value.toFixed(2)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    <ArrowRight className="w-6 h-6 text-gray-400 mx-auto" />

                    {/* Step 4: Explanation */}
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                          4
                        </div>
                        <h4 className="font-bold text-gray-800 text-lg">Detailed Explanation</h4>
                      </div>
                      <div className="ml-10">
                        <div className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded-r-lg">
                          <div className="flex items-start gap-3">
                            <Lightbulb className="w-5 h-5 text-blue-600 flex-shrink-0 mt-1" />
                            <p className="text-sm text-blue-900 leading-relaxed">
                              {inv.explanation}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredInvestigations.length === 0 && investigations.length > 0 && (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <Filter className="w-12 h-12 mx-auto text-gray-400 mb-3" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">No Matching Investigations</h3>
          <p className="text-gray-500">
            No investigations match your current filters. Try adjusting your search or filter criteria.
          </p>
        </div>
      )}

      {/* Disclaimer */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-yellow-900">
            <strong>Important:</strong> This analysis uses pattern-based NLP and should not be considered
            definitive. All classifications use cautious language (potential, possible, appears to be) and
            require expert verification. Manual literature review is strongly recommended before making
            final novelty claims.
          </div>
        </div>
      </div>
    </div>
  );
};

export default NoveltyInvestigation;
