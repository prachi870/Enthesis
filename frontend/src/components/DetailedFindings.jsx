import { useState } from 'react'
import { 
  AlertTriangle, Target, Lightbulb, CheckCircle, Brain, Search, 
  FileText, MessageSquare, ChevronDown, ChevronUp, ExternalLink,
  Info, TrendingUp, AlertCircle
} from 'lucide-react'

const DetailedFindings = ({ moduleKey, moduleData, moduleName }) => {
  const [expandedFindings, setExpandedFindings] = useState({})

  const toggleFinding = (id) => {
    setExpandedFindings(prev => ({
      ...prev,
      [id]: !prev[id]
    }))
  }

  // Transform backend findings into structured format
  const transformFindings = () => {
    if (!moduleData?.findings) return []

    const findings = []

    switch (moduleKey) {
      case 'related_work':
        return transformRelatedWorkFindings(moduleData)
      case 'novelty':
        return transformNoveltyFindings(moduleData)
      case 'weaknesses':
        return transformWeaknessFindings(moduleData)
      case 'clarity':
        return transformClarityFindings(moduleData)
      case 'reviewer_feedback':
        return transformReviewerFindings(moduleData)
      default:
        return []
    }
  }

  const transformRelatedWorkFindings = (data) => {
    const findings = []

    data.findings.forEach((finding, idx) => {
      if (finding.type === 'methods_extracted' && finding.items?.length > 0) {
        finding.items.forEach((method, methodIdx) => {
          findings.push({
            id: `method_${idx}_${methodIdx}`,
            type: 'method',
            icon: Target,
            color: 'blue',
            title: `Potential Method Reference: "${method}"`,
            description: `The system identified "${method}" as a possible technical method or algorithm mentioned in the paper.`,
            detailedExplanation: `This was detected through pattern matching and named entity recognition (NER) applied to technical terminology. The system searches for capitalized terms, acronyms, and phrases that match known method naming patterns in academic papers.`,
            whyDetected: `Pattern matching identified this as a technical term based on: (1) Capitalization pattern, (2) Context within technical discussion, (3) Frequency of occurrence in methodological sections.`,
            confidence: data.confidence,
            evidence: [{
              passage: `Search for occurrences of "${method}" in the paper text to verify context.`,
              type: 'keyword'
            }],
            source: data.model,
            affectedSection: 'Methods/Related Work sections',
            recommendedAction: `Verify that "${method}" is correctly cited and compared. Ensure proper attribution if this is an existing method from prior work.`,
            limitation: 'Using baseline pattern matching. Full semantic understanding requires fine-tuned SciBERT model (Phase 2).'
          })
        })
      }

      if (finding.type === 'datasets_extracted' && finding.items?.length > 0) {
        finding.items.forEach((dataset, datasetIdx) => {
          findings.push({
            id: `dataset_${idx}_${datasetIdx}`,
            type: 'dataset',
            icon: FileText,
            color: 'green',
            title: `Possible Dataset Reference: "${dataset}"`,
            description: `The system detected "${dataset}" as a potential dataset or benchmark mentioned in the evaluation.`,
            detailedExplanation: `Dataset names are identified through pattern recognition that looks for common dataset naming conventions, capitalized entities in evaluation contexts, and terms frequently appearing near performance metrics.`,
            whyDetected: `Detected as potential dataset based on: (1) Capitalization pattern, (2) Proximity to evaluation/results sections, (3) Co-occurrence with metrics or performance numbers.`,
            confidence: data.confidence,
            evidence: [{
              passage: `Search for "${dataset}" in experimental sections to confirm usage.`,
              type: 'keyword'
            }],
            source: data.model,
            affectedSection: 'Experiments/Evaluation sections',
            recommendedAction: `Confirm that "${dataset}" is properly cited with version information and access details. Verify that evaluation methodology on this dataset is clearly described.`,
            limitation: 'Baseline extraction may detect spurious matches. SPECTER2 embeddings for semantic search will improve accuracy (Phase 2).'
          })
        })
      }
    })

    // Add similar papers as findings
    if (data.evidence?.length > 0) {
      data.evidence.slice(0, 3).forEach((paper, idx) => {
        findings.push({
          id: `similar_paper_${idx}`,
          type: 'similar_work',
          icon: Search,
          color: 'purple',
          title: `Potential Related Work: ${paper.title || 'Similar Paper'}`,
          description: `Model-detected similar paper with ${(paper.similarity * 100).toFixed(0)}% similarity score.`,
          detailedExplanation: `This paper was identified through semantic similarity matching. The system compares the current paper's content against a corpus of related academic papers to find potentially relevant prior work.`,
          whyDetected: `Similarity detected through: (1) Overlapping technical vocabulary, (2) Similar research domain indicators, (3) Matching methodological approaches.`,
          confidence: paper.similarity,
          evidence: [{
            passage: `Paper ID: ${paper.paper_id}. Review for relevant citations.`,
            type: 'reference'
          }],
          source: 'SPECTER2 Semantic Search (simulated)',
          affectedSection: 'Related Work section',
          recommendedAction: `Review this paper to determine if it should be cited. Check for overlapping contributions, methodological similarities, or relevant comparisons.`,
          limitation: 'Using illustrative similar papers. Full S2ORC corpus integration needed for comprehensive related work discovery (Phase 2).'
        })
      })
    }

    return findings
  }

  const transformNoveltyFindings = (data) => {
    const findings = []
    const noveltyData = data.findings[0]

    if (!noveltyData) return findings

    // Overall novelty assessment
    findings.push({
      id: 'novelty_overall',
      type: 'novelty_score',
      icon: TrendingUp,
      color: 'purple',
      title: `Novelty Assessment: ${(noveltyData.novelty_score * 100).toFixed(1)}%`,
      description: `The system analyzed ${noveltyData.novel_claims} potential novel contributions against ${noveltyData.non_novel_claims} references to existing work.`,
      detailedExplanation: `Novelty is assessed by identifying claims of originality ("we are the first to...", "novel approach") and cross-checking against references to prior work. The score represents the balance between claimed novelty and acknowledged existing approaches.`,
      whyDetected: `Analysis based on: (1) Pattern detection for novelty claims (${noveltyData.novel_claims} found), (2) Prior work references (${noveltyData.non_novel_claims} found), (3) Entailment checking logic comparing claims to existing work.`,
      confidence: data.confidence,
      evidence: data.evidence?.slice(0, 3).map(ev => ({
        passage: ev.claim || 'Novelty claim detected',
        type: 'claim'
      })) || [],
      source: data.model,
      affectedSection: 'Introduction, Contributions sections',
      recommendedAction: noveltyData.novelty_score > 0.7 
        ? `Strong novelty signals detected. Ensure contributions are clearly articulated and differentiated from prior work.`
        : `Moderate novelty score. Consider strengthening the novelty claims or providing clearer differentiation from existing approaches.`,
      limitation: 'Using pattern-based NLI baseline. Full entailment checking requires fine-tuned DeBERTa model on SciFact dataset (Phase 2).',
      metrics: {
        'Novel Claims': noveltyData.novel_claims,
        'Prior Work References': noveltyData.non_novel_claims,
        'Entailment Supported': noveltyData.entailment_supported,
        'Entailment Contradicted': noveltyData.entailment_contradicted
      }
    })

    return findings
  }

  const transformWeaknessFindings = (data) => {
    const findings = []

    data.findings.forEach((finding, idx) => {
      const category = finding.category || finding.type
      const relatedEvidence = data.evidence?.filter(e => e.category === category).slice(0, 2) || []

      findings.push({
        id: `weakness_${idx}`,
        type: 'weakness',
        icon: AlertTriangle,
        color: 'orange',
        title: `Potential Weakness: ${category?.replace(/_/g, ' ')}`,
        description: `The system detected ${finding.count} potential ${category?.replace(/_/g, ' ')} issue(s) that may require investigation.`,
        detailedExplanation: `This weakness category was identified through pattern-based analysis looking for common issues in academic papers. The detection algorithm searches for indicators such as missing baselines, incomplete evaluations, or insufficient experimental rigor.`,
        whyDetected: `Detected through: (1) Pattern matching on ${finding.count} instances, (2) Structural analysis of evaluation sections, (3) Comparison against standard experimental reporting practices.`,
        confidence: data.confidence,
        evidence: relatedEvidence.map(ev => ({
          passage: ev.passage?.substring(0, 200) + '...' || 'Evidence passage',
          type: 'text_excerpt'
        })),
        source: data.model,
        affectedSection: finding.category?.includes('eval') ? 'Evaluation section' : 
                         finding.category?.includes('baseline') ? 'Experiments section' :
                         'Multiple sections',
        recommendedAction: `Review the identified passages to determine if this is a genuine weakness. Consider: (1) Is there sufficient experimental validation? (2) Are baselines clearly identified? (3) Is the evaluation comprehensive?`,
        limitation: 'Pattern-based detection may produce false positives. Human expert review is recommended to confirm actual weaknesses.',
        impact: finding.count > 3 ? 'High - Multiple instances detected' : 
                finding.count > 1 ? 'Moderate - Some instances found' : 
                'Low - Single instance detected'
      })
    })

    return findings
  }

  const transformClarityFindings = (data) => {
    const findings = []
    const clarityData = data.findings[0]

    if (!clarityData) return findings

    // Overall clarity assessment
    findings.push({
      id: 'clarity_overall',
      type: 'clarity_score',
      icon: Lightbulb,
      color: 'yellow',
      title: `Writing Clarity: ${clarityData.clarity_score?.toFixed(2)}/1.00`,
      description: `The system assessed writing quality based on sentence structure, passive voice usage, hedging language, and technical clarity.`,
      detailedExplanation: `Clarity is measured through multiple readability metrics including average sentence length, passive voice frequency, hedging words, vague phrases, and word repetition. The score represents overall writing quality where 1.0 is optimal clarity.`,
      whyDetected: `Calculated from: (1) Avg sentence length: ${clarityData.features?.avg_sentence_length?.toFixed(1)} words, (2) Passive voice count: ${clarityData.features?.passive_voice_count}, (3) Hedging patterns, (4) Vague phrase frequency.`,
      confidence: data.confidence,
      evidence: [{
        passage: clarityData.interpretation || 'Comprehensive readability analysis completed.',
        type: 'summary'
      }],
      source: data.model,
      affectedSection: 'Entire document',
      recommendedAction: clarityData.clarity_score > 0.8 
        ? `Good clarity score. Minor improvements may include reducing passive voice or simplifying complex sentences.`
        : clarityData.clarity_score > 0.6
        ? `Moderate clarity. Consider: (1) Shortening long sentences, (2) Using more active voice, (3) Reducing hedging language.`
        : `Clarity needs improvement. Focus on: (1) Sentence simplification, (2) Active voice, (3) Clearer technical explanations.`,
      limitation: 'Pattern-based analysis. Does not assess semantic clarity or logical flow. Full clarity assessment requires deep semantic understanding.',
      metrics: clarityData.features || {}
    })

    // Add specific recommendations if available
    if (clarityData.recommendations) {
      clarityData.recommendations.forEach((rec, idx) => {
        if (rec.includes('⚠️')) {
          findings.push({
            id: `clarity_issue_${idx}`,
            type: 'clarity_issue',
            icon: AlertCircle,
            color: 'amber',
            title: 'Clarity Improvement Opportunity',
            description: rec.replace('⚠️', '').trim(),
            detailedExplanation: 'This recommendation was generated based on statistical analysis of the paper\'s writing patterns.',
            whyDetected: 'Automated analysis of sentence structure and language patterns.',
            confidence: 0.7,
            evidence: [],
            source: 'Clarity analyzer',
            affectedSection: 'Writing style',
            recommendedAction: rec.replace('⚠️', '').trim(),
            limitation: null
          })
        }
      })
    }

    return findings
  }

  const transformReviewerFindings = (data) => {
    const findings = []

    data.findings.slice(0, 5).forEach((finding, idx) => {
      findings.push({
        id: `reviewer_${idx}`,
        type: 'reviewer_comment',
        icon: MessageSquare,
        color: 'indigo',
        title: `Reviewer-Style Comment: ${finding.aspect || 'General Feedback'}`,
        description: finding.feedback || 'Model-generated reviewer feedback based on common review patterns.',
        detailedExplanation: `This feedback was generated by analyzing the paper through the lens of typical reviewer concerns. The system identifies potential issues that reviewers commonly raise about methodology, evaluation, clarity, and contributions.`,
        whyDetected: `Generated based on: (1) Pattern analysis of reviewer feedback corpus, (2) Common concerns in ${finding.aspect} areas, (3) Severity assessment: ${finding.severity || 'moderate'}.`,
        confidence: data.confidence,
        evidence: [{
          passage: finding.feedback?.substring(0, 200) || 'Reviewer feedback',
          type: 'feedback'
        }],
        source: data.model,
        affectedSection: finding.aspect === 'methodology' ? 'Methods section' :
                         finding.aspect === 'evaluation' ? 'Experiments section' :
                         finding.aspect === 'novelty' ? 'Contributions section' :
                         'Multiple sections',
        recommendedAction: `Review this ${finding.severity || 'moderate'} concern. Consider whether the paper adequately addresses this point or if revisions are needed.`,
        limitation: 'Generated from pattern-based reviewer feedback model. Actual human reviewer comments may differ. Use as guidance, not absolute truth.',
        severity: finding.severity
      })
    })

    return findings
  }

  const allFindings = transformFindings()

  if (allFindings.length === 0) {
    return (
      <div className="text-center py-12 text-slate-400">
        <Info className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p>No detailed findings available for this module yet.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold text-white">
          {moduleName} - Detailed Findings
        </h3>
        <span className="text-sm text-slate-400">
          {allFindings.length} finding{allFindings.length !== 1 ? 's' : ''}
        </span>
      </div>

      {allFindings.map((finding) => {
        const isExpanded = expandedFindings[finding.id]
        const Icon = finding.icon

        return (
          <div
            key={finding.id}
            className={`bg-slate-900/50 backdrop-blur-lg rounded-xl border border-slate-700 hover:border-slate-600 transition-all duration-200 overflow-hidden`}
          >
            {/* Finding Header - Always Visible */}
            <div
              onClick={() => toggleFinding(finding.id)}
              className="p-6 cursor-pointer hover:bg-slate-800/30 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4 flex-1">
                  <div className={`w-12 h-12 bg-${finding.color}-500/20 rounded-lg flex items-center justify-center flex-shrink-0`}>
                    <Icon className={`w-6 h-6 text-${finding.color}-400`} />
                  </div>
                  
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold text-white mb-2">
                      {finding.title}
                    </h4>
                    <p className="text-sm text-slate-300 leading-relaxed">
                      {finding.description}
                    </p>
                  </div>
                </div>

                <button className="ml-4 p-2 hover:bg-slate-700 rounded-lg transition-colors flex-shrink-0">
                  {isExpanded ? (
                    <ChevronUp className="w-5 h-5 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-slate-400" />
                  )}
                </button>
              </div>

              {/* Confidence Badge */}
              <div className="flex items-center space-x-4 mt-4">
                <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-${finding.color}-500/10 border border-${finding.color}-500/30`}>
                  <span className="text-xs font-medium text-slate-400">Confidence:</span>
                  <span className={`text-sm font-bold text-${finding.color}-400`}>
                    {(finding.confidence * 100).toFixed(0)}%
                  </span>
                </div>

                {finding.severity && (
                  <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full ${
                    finding.severity === 'critical' ? 'bg-red-500/20 border border-red-500/30' :
                    finding.severity === 'major' ? 'bg-orange-500/20 border border-orange-500/30' :
                    'bg-yellow-500/20 border border-yellow-500/30'
                  }`}>
                    <span className="text-xs font-medium">
                      {finding.severity} severity
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Expanded Details */}
            {isExpanded && (
              <div className="border-t border-slate-700 p-6 space-y-6 bg-slate-800/20">
                {/* Detailed Explanation */}
                <div>
                  <div className="flex items-center space-x-2 mb-3">
                    <Info className="w-4 h-4 text-blue-400" />
                    <h5 className="text-sm font-semibold text-blue-400">Detailed Explanation</h5>
                  </div>
                  <p className="text-sm text-slate-300 leading-relaxed pl-6">
                    {finding.detailedExplanation}
                  </p>
                </div>

                {/* Evidence */}
                {finding.evidence && finding.evidence.length > 0 && (
                  <div>
                    <div className="flex items-center space-x-2 mb-3">
                      <FileText className="w-4 h-4 text-green-400" />
                      <h5 className="text-sm font-semibold text-green-400">Evidence</h5>
                    </div>
                    <div className="space-y-2 pl-6">
                      {finding.evidence.map((ev, idx) => (
                        <div key={idx} className="bg-slate-900/50 rounded-lg p-3 border border-slate-700">
                          <p className="text-sm text-slate-300 leading-relaxed italic">
                            "{ev.passage}"
                          </p>
                          {ev.type && (
                            <span className="text-xs text-slate-500 mt-2 block">
                              Type: {ev.type}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Why Detected */}
                <div>
                  <div className="flex items-center space-x-2 mb-3">
                    <Search className="w-4 h-4 text-purple-400" />
                    <h5 className="text-sm font-semibold text-purple-400">Why This Was Detected</h5>
                  </div>
                  <p className="text-sm text-slate-300 leading-relaxed pl-6">
                    {finding.whyDetected}
                  </p>
                </div>

                {/* Source & Section */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs font-semibold text-slate-400 mb-2">Source Model</div>
                    <p className="text-sm text-slate-300">{finding.source}</p>
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-400 mb-2">Affected Section</div>
                    <p className="text-sm text-slate-300">{finding.affectedSection}</p>
                  </div>
                </div>

                {/* Metrics */}
                {finding.metrics && Object.keys(finding.metrics).length > 0 && (
                  <div>
                    <div className="text-xs font-semibold text-slate-400 mb-3">Metrics</div>
                    <div className="grid grid-cols-2 gap-3 pl-6">
                      {Object.entries(finding.metrics).map(([key, value]) => (
                        <div key={key} className="bg-slate-900/50 rounded-lg p-3">
                          <div className="text-xs text-slate-400">{key}</div>
                          <div className="text-sm font-semibold text-white mt-1">{value}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Impact */}
                {finding.impact && (
                  <div>
                    <div className="text-xs font-semibold text-slate-400 mb-2">Impact Assessment</div>
                    <p className="text-sm text-slate-300 pl-6">{finding.impact}</p>
                  </div>
                )}

                {/* Recommended Action */}
                <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
                  <div className="flex items-start space-x-2">
                    <CheckCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <h5 className="text-sm font-semibold text-blue-400 mb-2">
                        Recommended Action
                      </h5>
                      <p className="text-sm text-blue-200 leading-relaxed">
                        {finding.recommendedAction}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Limitation */}
                {finding.limitation && (
                  <div className="bg-amber-900/20 border border-amber-500/30 rounded-lg p-4">
                    <div className="flex items-start space-x-2">
                      <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <h5 className="text-sm font-semibold text-amber-400 mb-2">
                          Model Limitation
                        </h5>
                        <p className="text-sm text-amber-200 leading-relaxed">
                          {finding.limitation}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

export default DetailedFindings
