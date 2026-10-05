import { useState } from 'react'
import { 
  Search, Brain, AlertTriangle, Lightbulb, MessageSquare, 
  TrendingUp, ChevronRight, Info, Target, FileText, Activity
} from 'lucide-react'

const ResearchHealthOverview = ({ analysisData, onNavigateToModule }) => {
  const [selectedIndicator, setSelectedIndicator] = useState(null)

  // Calculate indicators from actual module results
  const calculateIndicators = () => {
    const indicators = []

    // Indicator 1: Related Work Coverage
    const relatedWork = analysisData?.results?.related_work
    if (relatedWork) {
      const methodsCount = relatedWork.findings?.find(f => f.type === 'methods_extracted')?.count || 0
      const datasetsCount = relatedWork.findings?.find(f => f.type === 'datasets_extracted')?.count || 0
      const similarPapers = relatedWork.evidence?.length || 0
      const totalFindings = methodsCount + datasetsCount + similarPapers

      indicators.push({
        id: 'related_work',
        title: 'Related Work Coverage',
        icon: Search,
        color: 'blue',
        status: totalFindings > 15 ? 'good' : totalFindings > 5 ? 'moderate' : 'needs_attention',
        statusLabel: totalFindings > 15 ? 'Comprehensive' : totalFindings > 5 ? 'Adequate' : 'Limited',
        findingsCount: totalFindings,
        confidence: relatedWork.confidence,
        description: `Identified ${methodsCount} methods, ${datasetsCount} datasets, and ${similarPapers} potentially related papers through automated analysis.`,
        keyFindings: [
          `${methodsCount} technical methods detected`,
          `${datasetsCount} datasets identified`,
          `${similarPapers} similar papers found`
        ],
        interpretation: totalFindings > 15 
          ? 'System detected substantial references to prior work, methods, and datasets.'
          : totalFindings > 5
          ? 'Moderate coverage of related work detected. Consider verifying completeness.'
          : 'Limited related work references detected. Manual review recommended.',
        limitation: 'Automated detection using pattern matching. May miss implicit references or misidentify non-technical terms.'
      })
    }

    // Indicator 2: Novelty Evidence
    const novelty = analysisData?.results?.novelty
    if (novelty?.findings?.[0]) {
      const noveltyData = novelty.findings[0]
      const noveltyScore = noveltyData.novelty_score || 0
      const novelClaims = noveltyData.novel_claims || 0
      const existingWork = noveltyData.non_novel_claims || 0

      indicators.push({
        id: 'novelty',
        title: 'Novelty Evidence',
        icon: Brain,
        color: 'purple',
        status: noveltyScore > 0.7 ? 'good' : noveltyScore > 0.4 ? 'moderate' : 'needs_attention',
        statusLabel: noveltyScore > 0.7 ? 'Strong' : noveltyScore > 0.4 ? 'Moderate' : 'Weak',
        findingsCount: novelClaims + existingWork,
        confidence: novelty.confidence,
        score: (noveltyScore * 100).toFixed(1),
        description: `Detected ${novelClaims} potential novel claims and ${existingWork} references to existing work through NLI-style analysis.`,
        keyFindings: [
          `Novelty score: ${(noveltyScore * 100).toFixed(1)}%`,
          `${novelClaims} potential novel contributions`,
          `${existingWork} existing work references`,
          noveltyData.summary || 'Claims analyzed'
        ],
        interpretation: noveltyScore > 0.7
          ? 'Strong novelty signals detected. Contributions appear well-differentiated from prior work.'
          : noveltyScore > 0.4
          ? 'Moderate novelty indicators. Consider strengthening differentiation from existing approaches.'
          : 'Limited novelty evidence detected. Verify that contributions are clearly articulated.',
        limitation: 'Pattern-based novelty detection. Full semantic entailment checking requires fine-tuned NLI model (Phase 2).'
      })
    }

    // Indicator 3: Methodology Rigor
    const weaknesses = analysisData?.results?.weaknesses
    if (weaknesses) {
      const totalIssues = weaknesses.findings?.reduce((sum, f) => sum + (f.count || 0), 0) || 0
      const categories = weaknesses.findings?.length || 0

      indicators.push({
        id: 'methodology',
        title: 'Methodology Indicators',
        icon: Target,
        color: 'orange',
        status: totalIssues === 0 ? 'good' : totalIssues < 3 ? 'moderate' : 'needs_attention',
        statusLabel: totalIssues === 0 ? 'Clean' : totalIssues < 3 ? 'Minor Concerns' : 'Review Needed',
        findingsCount: totalIssues,
        confidence: weaknesses.confidence,
        description: `Detected ${totalIssues} potential methodological concerns across ${categories} categories through pattern-based analysis.`,
        keyFindings: weaknesses.findings?.slice(0, 3).map(f => 
          `${f.count} ${f.category?.replace(/_/g, ' ') || 'issues'} detected`
        ) || ['Analysis in progress'],
        interpretation: totalIssues === 0
          ? 'No obvious methodological issues detected by automated analysis.'
          : totalIssues < 3
          ? 'Minor potential issues detected. Human review recommended to assess significance.'
          : 'Multiple potential concerns detected. Thorough review of methodology recommended.',
        limitation: 'Pattern-based weakness detection. False positives are possible. Expert review required to confirm actual issues.'
      })
    }

    // Indicator 4: Writing Clarity
    const clarity = analysisData?.results?.clarity
    if (clarity?.findings?.[0]) {
      const clarityData = clarity.findings[0]
      const clarityScore = clarityData.clarity_score || 0
      const features = clarityData.features || {}

      indicators.push({
        id: 'clarity',
        title: 'Writing Clarity',
        icon: Lightbulb,
        color: 'yellow',
        status: clarityScore > 0.8 ? 'good' : clarityScore > 0.6 ? 'moderate' : 'needs_attention',
        statusLabel: clarityScore > 0.8 ? 'Clear' : clarityScore > 0.6 ? 'Adequate' : 'Needs Improvement',
        findingsCount: Object.keys(features).length,
        confidence: clarity.confidence,
        score: clarityScore.toFixed(2),
        description: `Overall clarity score of ${clarityScore.toFixed(2)}/1.00 based on readability metrics including sentence structure and language patterns.`,
        keyFindings: [
          `Clarity score: ${clarityScore.toFixed(2)}/1.00`,
          features.avg_sentence_length ? `Avg sentence: ${features.avg_sentence_length.toFixed(1)} words` : null,
          features.passive_voice_count ? `Passive voice: ${features.passive_voice_count} instances` : null,
          clarityData.interpretation || 'Readability analyzed'
        ].filter(Boolean),
        interpretation: clarityScore > 0.8
          ? 'Good writing clarity detected. Paper appears well-structured and readable.'
          : clarityScore > 0.6
          ? 'Adequate clarity. Minor improvements possible in sentence structure or language precision.'
          : 'Clarity improvements recommended. Consider simplifying complex sentences and reducing passive voice.',
        limitation: 'Statistical readability analysis. Does not assess semantic clarity or logical argument flow.'
      })
    }

    // Indicator 5: Reviewer Readiness
    const reviewerFeedback = analysisData?.results?.reviewer_feedback
    if (reviewerFeedback) {
      const feedbackCount = reviewerFeedback.findings?.length || 0
      const criticalIssues = reviewerFeedback.findings?.filter(f => f.severity === 'critical').length || 0
      const majorIssues = reviewerFeedback.findings?.filter(f => f.severity === 'major').length || 0

      indicators.push({
        id: 'reviewer_readiness',
        title: 'Reviewer Readiness',
        icon: MessageSquare,
        color: 'indigo',
        status: criticalIssues === 0 && majorIssues === 0 ? 'good' : 
                criticalIssues === 0 && majorIssues < 2 ? 'moderate' : 'needs_attention',
        statusLabel: criticalIssues === 0 && majorIssues === 0 ? 'Ready' : 
                     criticalIssues === 0 && majorIssues < 2 ? 'Minor Revisions' : 'Needs Work',
        findingsCount: feedbackCount,
        confidence: reviewerFeedback.confidence,
        description: `Generated ${feedbackCount} reviewer-style comments including ${criticalIssues} critical and ${majorIssues} major concerns.`,
        keyFindings: [
          `${feedbackCount} feedback items generated`,
          criticalIssues > 0 ? `${criticalIssues} critical concerns` : 'No critical issues',
          majorIssues > 0 ? `${majorIssues} major concerns` : 'No major issues',
          'Pattern-based feedback generation'
        ],
        interpretation: criticalIssues === 0 && majorIssues === 0
          ? 'No critical reviewer concerns detected. Paper appears ready for submission review.'
          : criticalIssues === 0 && majorIssues < 2
          ? 'Minor concerns detected. Addressing these may strengthen the submission.'
          : 'Multiple concerns detected. Review and address feedback before submission.',
        limitation: 'Generated from reviewer pattern analysis. Actual peer review may raise different concerns.'
      })
    }

    return indicators
  }

  const indicators = calculateIndicators()

  // Calculate overall summary
  const goodCount = indicators.filter(i => i.status === 'good').length
  const moderateCount = indicators.filter(i => i.status === 'moderate').length
  const needsAttentionCount = indicators.filter(i => i.status === 'needs_attention').length

  return (
    <div className="space-y-6">
      {/* Header with Disclaimer */}
      <div className="bg-slate-900/70 backdrop-blur-lg rounded-xl border border-slate-700/50 p-6 shadow-xl">
        <div className="flex items-start space-x-4">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
            <Activity className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-white mb-2">Research Health Overview</h2>
            <p className="text-slate-300 mb-4">
              System-generated indicators summarizing automated analysis results. These are research tools, not acceptance predictions or peer-review scores.
            </p>
            
            {/* Summary Stats */}
            <div className="flex items-center space-x-6 text-sm">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-slate-300">{goodCount} Good</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <span className="text-slate-300">{moderateCount} Moderate</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                <span className="text-slate-300">{needsAttentionCount} Needs Attention</span>
              </div>
            </div>
          </div>

          <div className="bg-blue-900/30 border border-blue-500/30 rounded-lg px-4 py-2">
            <div className="text-xs text-blue-400 mb-1">Indicators</div>
            <div className="text-3xl font-bold text-white">{indicators.length}/5</div>
          </div>
        </div>

        {/* Important Disclaimer */}
        <div className="mt-4 bg-amber-900/20 border border-amber-500/30 rounded-lg p-4">
          <div className="flex items-start space-x-2">
            <Info className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-amber-200">
              <strong>Important:</strong> These indicators are generated by automated analysis tools. 
              They do not predict publication acceptance, reviewer decisions, or scientific quality. 
              Human expert review is essential for comprehensive evaluation.
            </div>
          </div>
        </div>
      </div>

      {/* Indicators Grid */}
      <div className="grid grid-cols-1 gap-4">
        {indicators.map(indicator => {
          const Icon = indicator.icon
          const statusColors = {
            good: { bg: 'bg-green-500/10', border: 'border-green-500/30', text: 'text-green-400', dot: 'bg-green-500' },
            moderate: { bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', text: 'text-yellow-400', dot: 'bg-yellow-500' },
            needs_attention: { bg: 'bg-orange-500/10', border: 'border-orange-500/30', text: 'text-orange-400', dot: 'bg-orange-500' }
          }
          const colors = statusColors[indicator.status]

          return (
            <div
              key={indicator.id}
              className={`bg-slate-900/70 backdrop-blur-lg rounded-xl border ${colors.border} hover:border-${indicator.color}-500/50 transition-all duration-300 cursor-pointer`}
              onClick={() => setSelectedIndicator(selectedIndicator === indicator.id ? null : indicator.id)}
            >
              <div className="p-6">
                {/* Indicator Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start space-x-4 flex-1">
                    <div className={`w-14 h-14 bg-${indicator.color}-500/20 rounded-xl flex items-center justify-center flex-shrink-0`}>
                      <Icon className={`w-7 h-7 text-${indicator.color}-400`} />
                    </div>
                    
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-white mb-2">{indicator.title}</h3>
                      <p className="text-sm text-slate-300 mb-3">{indicator.description}</p>
                      
                      {/* Status Badge */}
                      <div className="flex items-center space-x-3">
                        <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full ${colors.bg} border ${colors.border}`}>
                          <div className={`w-2 h-2 ${colors.dot} rounded-full`}></div>
                          <span className={`text-sm font-medium ${colors.text}`}>{indicator.statusLabel}</span>
                        </div>
                        
                        {indicator.confidence && (
                          <div className="text-sm text-slate-400">
                            Confidence: <span className="font-semibold text-white">{(indicator.confidence * 100).toFixed(0)}%</span>
                          </div>
                        )}
                        
                        {indicator.score && (
                          <div className="text-sm text-slate-400">
                            Score: <span className="font-semibold text-white">{indicator.score}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Findings Count */}
                  <div className="text-right ml-4">
                    <div className="text-3xl font-bold text-white">{indicator.findingsCount}</div>
                    <div className="text-xs text-slate-400">Findings</div>
                  </div>
                </div>

                {/* Key Findings - Always Visible */}
                <div className="bg-slate-800/30 rounded-lg p-4 mb-4">
                  <div className="text-xs font-semibold text-slate-400 mb-2">Key Findings:</div>
                  <ul className="space-y-1">
                    {indicator.keyFindings.map((finding, idx) => (
                      <li key={idx} className="text-sm text-slate-300 flex items-start space-x-2">
                        <ChevronRight className="w-4 h-4 text-slate-500 flex-shrink-0 mt-0.5" />
                        <span>{finding}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Expanded Details */}
                {selectedIndicator === indicator.id && (
                  <div className="border-t border-slate-700 pt-4 space-y-4 animate-fadeIn">
                    {/* Interpretation */}
                    <div>
                      <div className="text-sm font-semibold text-slate-400 mb-2">System Interpretation:</div>
                      <p className="text-sm text-slate-300 leading-relaxed">
                        {indicator.interpretation}
                      </p>
                    </div>

                    {/* Limitation */}
                    <div className="bg-amber-900/20 border border-amber-500/30 rounded-lg p-3">
                      <div className="text-xs font-semibold text-amber-400 mb-1">Analysis Limitation:</div>
                      <p className="text-xs text-amber-200 leading-relaxed">
                        {indicator.limitation}
                      </p>
                    </div>

                    {/* Link to Detailed Analysis */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        if (onNavigateToModule) onNavigateToModule(indicator.id)
                      }}
                      className={`w-full px-4 py-3 bg-${indicator.color}-500/10 hover:bg-${indicator.color}-500/20 border border-${indicator.color}-500/30 rounded-lg flex items-center justify-center space-x-2 transition-colors`}
                    >
                      <FileText className={`w-5 h-5 text-${indicator.color}-400`} />
                      <span className={`font-semibold text-${indicator.color}-400`}>
                        View Detailed Analysis
                      </span>
                      <ChevronRight className={`w-4 h-4 text-${indicator.color}-400`} />
                    </button>
                  </div>
                )}

                {/* View Details Toggle */}
                {selectedIndicator !== indicator.id && (
                  <button
                    className="text-sm text-slate-400 hover:text-white flex items-center space-x-1 transition-colors"
                  >
                    <span>View interpretation & details</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Overall Summary Note */}
      <div className="bg-slate-900/70 backdrop-blur-lg rounded-xl border border-slate-700/50 p-6">
        <h4 className="text-lg font-semibold text-white mb-3">Understanding These Indicators</h4>
        <div className="space-y-2 text-sm text-slate-300">
          <p>
            • <strong>Related Work Coverage</strong> summarizes detected methods, datasets, and similar papers
          </p>
          <p>
            • <strong>Novelty Evidence</strong> analyzes claims of originality and differentiation from prior work
          </p>
          <p>
            • <strong>Methodology Indicators</strong> identifies potential experimental or evaluation concerns
          </p>
          <p>
            • <strong>Writing Clarity</strong> assesses readability through linguistic metrics
          </p>
          <p>
            • <strong>Reviewer Readiness</strong> generates anticipated reviewer concerns based on patterns
          </p>
        </div>
        <p className="mt-4 text-xs text-slate-400 italic">
          These are analysis tools to support research development, not quality judgments or acceptance predictions.
        </p>
      </div>
    </div>
  )
}

export default ResearchHealthOverview
