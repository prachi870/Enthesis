import { useState } from 'react'
import { 
  Search, FileText, ExternalLink, MapPin, ChevronRight, Info, 
  AlertCircle, Eye, Link, BookOpen, Microscope
} from 'lucide-react'

const EvidenceExplorer = ({ finding, moduleKey, paperText, onNavigateToPaper }) => {
  const [showAllEvidence, setShowAllEvidence] = useState(false)

  // Extract evidence from finding
  const getEvidenceItems = () => {
    if (!finding.evidence || finding.evidence.length === 0) {
      return []
    }
    return finding.evidence
  }

  const evidenceItems = getEvidenceItems()

  // Find passage in paper text
  const findPassageInPaper = (keyword) => {
    if (!paperText || !keyword) return null

    const lowerText = paperText.toLowerCase()
    const lowerKeyword = keyword.toLowerCase()
    const index = lowerText.indexOf(lowerKeyword)

    if (index === -1) return null

    // Extract context around the keyword (200 chars before and after)
    const start = Math.max(0, index - 200)
    const end = Math.min(paperText.length, index + keyword.length + 200)
    const passage = paperText.substring(start, end)

    // Estimate section (crude - based on position in document)
    const position = index / paperText.length
    let estimatedSection = 'Document'
    if (position < 0.2) estimatedSection = 'Introduction/Abstract'
    else if (position < 0.4) estimatedSection = 'Related Work/Background'
    else if (position < 0.6) estimatedSection = 'Methods'
    else if (position < 0.8) estimatedSection = 'Results/Experiments'
    else estimatedSection = 'Discussion/Conclusion'

    return {
      passage,
      section: estimatedSection,
      position: (position * 100).toFixed(1)
    }
  }

  // Get passage for keyword-based findings
  const getDirectPassage = () => {
    if (finding.keyword && paperText) {
      return findPassageInPaper(finding.keyword)
    }
    return null
  }

  const directPassage = getDirectPassage()

  return (
    <div className="bg-slate-900/30 rounded-xl border border-slate-700/50 p-6 space-y-6">
      <div className="flex items-center space-x-3 mb-4">
        <Microscope className="w-6 h-6 text-blue-400" />
        <h3 className="text-xl font-semibold text-white">Evidence Explorer</h3>
      </div>

      {/* Finding Summary */}
      <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
        <div className="text-sm font-semibold text-slate-400 mb-2">Finding:</div>
        <p className="text-white font-medium mb-2">{finding.title}</p>
        <p className="text-sm text-slate-300">{finding.description}</p>
      </div>

      {/* Direct Paper Evidence */}
      {directPassage && (
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <FileText className="w-5 h-5 text-green-400" />
            <h4 className="text-lg font-semibold text-white">Paper Evidence</h4>
          </div>

          <div className="bg-slate-800/50 rounded-lg border border-slate-700 overflow-hidden">
            <div className="p-4 border-b border-slate-700 bg-slate-800/70">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2 text-sm text-slate-400">
                    <MapPin className="w-4 h-4" />
                    <span>Section: <span className="text-slate-200">{directPassage.section}</span></span>
                  </div>
                  <div className="text-sm text-slate-400">
                    Position: <span className="text-slate-200">{directPassage.position}%</span>
                  </div>
                </div>
                <button
                  onClick={() => onNavigateToPaper && onNavigateToPaper(finding.keyword)}
                  className="flex items-center space-x-2 px-3 py-1.5 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded-lg transition-colors text-sm text-blue-300"
                >
                  <Eye className="w-4 h-4" />
                  <span>View in Paper</span>
                </button>
              </div>
            </div>
            <div className="p-4">
              <div className="text-sm text-slate-300 leading-relaxed">
                <span className="text-slate-400">...</span>
                <span 
                  className="bg-yellow-400/20 px-1 rounded text-yellow-100 font-medium"
                  dangerouslySetInnerHTML={{ 
                    __html: directPassage.passage.replace(
                      new RegExp(`(${finding.keyword})`, 'gi'),
                      '<mark class="bg-yellow-300/50 text-yellow-900 px-1 rounded">$1</mark>'
                    )
                  }}
                />
                <span className="text-slate-400">...</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Evidence Items from Backend */}
      {evidenceItems.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Search className="w-5 h-5 text-purple-400" />
              <h4 className="text-lg font-semibold text-white">Supporting Evidence</h4>
            </div>
            <span className="text-sm text-slate-400">{evidenceItems.length} item(s)</span>
          </div>

          <div className="space-y-3">
            {evidenceItems.slice(0, showAllEvidence ? undefined : 3).map((evidence, idx) => (
              <EvidenceCard 
                key={idx} 
                evidence={evidence} 
                index={idx + 1}
                moduleKey={moduleKey}
              />
            ))}
          </div>

          {evidenceItems.length > 3 && (
            <button
              onClick={() => setShowAllEvidence(!showAllEvidence)}
              className="w-full py-2 text-sm text-blue-400 hover:text-blue-300 flex items-center justify-center space-x-2"
            >
              <span>{showAllEvidence ? 'Show Less' : `Show ${evidenceItems.length - 3} More`}</span>
              <ChevronRight className={`w-4 h-4 transform transition-transform ${showAllEvidence ? 'rotate-90' : ''}`} />
            </button>
          )}
        </div>
      )}

      {/* No Evidence Available */}
      {!directPassage && evidenceItems.length === 0 && (
        <div className="bg-amber-900/20 border border-amber-500/30 rounded-lg p-6 text-center">
          <AlertCircle className="w-12 h-12 text-amber-400 mx-auto mb-3" />
          <h4 className="text-lg font-semibold text-amber-300 mb-2">Evidence Unavailable</h4>
          <p className="text-sm text-amber-200 leading-relaxed">
            Direct evidence is not available for this finding. This may be a summary-level 
            finding based on aggregate patterns rather than specific passages.
          </p>
        </div>
      )}

      {/* Model Reasoning */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Info className="w-5 h-5 text-blue-400" />
          <h4 className="text-lg font-semibold text-white">Model Reasoning</h4>
        </div>

        <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
          <div className="text-sm font-semibold text-slate-400 mb-2">Why This Was Detected:</div>
          <p className="text-sm text-slate-300 leading-relaxed mb-4">
            {finding.whyDetected}
          </p>

          <div className="text-sm font-semibold text-slate-400 mb-2">Detection Method:</div>
          <p className="text-sm text-slate-300 leading-relaxed">
            {finding.detailedExplanation}
          </p>
        </div>

        {/* Confidence */}
        <div className="flex items-center justify-between bg-slate-800/30 rounded-lg p-4">
          <div>
            <div className="text-sm font-semibold text-slate-400 mb-1">Confidence Level:</div>
            <p className="text-xs text-slate-400">
              Based on pattern matching and statistical analysis
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-blue-400">
              {(finding.confidence * 100).toFixed(0)}%
            </div>
          </div>
        </div>
      </div>

      {/* Recommended Investigation */}
      <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <BookOpen className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <div className="text-sm font-semibold text-blue-300 mb-2">Recommended Investigation:</div>
            <p className="text-sm text-blue-200 leading-relaxed">
              {finding.recommendedAction}
            </p>
          </div>
        </div>
      </div>

      {/* Source Information */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-slate-800/30 rounded-lg p-3">
          <div className="text-xs font-semibold text-slate-400 mb-1">Source Model:</div>
          <p className="text-sm text-slate-200">{finding.source}</p>
        </div>
        <div className="bg-slate-800/30 rounded-lg p-3">
          <div className="text-xs font-semibold text-slate-400 mb-1">Affected Section:</div>
          <p className="text-sm text-slate-200">{finding.affectedSection}</p>
        </div>
      </div>

      {/* Limitation Notice */}
      {finding.limitation && (
        <div className="bg-amber-900/20 border border-amber-500/30 rounded-lg p-4">
          <div className="flex items-start space-x-2">
            <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <div className="text-sm font-semibold text-amber-300 mb-1">Analysis Limitation:</div>
              <p className="text-sm text-amber-200 leading-relaxed">
                {finding.limitation}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const EvidenceCard = ({ evidence, index, moduleKey }) => {
  // Different rendering based on evidence type
  if (evidence.paper_id) {
    // External research paper evidence
    return (
      <div className="bg-slate-800/50 rounded-lg border border-slate-700 p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-bold text-purple-400">{index}</span>
            </div>
            <div>
              <div className="text-sm font-semibold text-slate-400 mb-1">External Research:</div>
              <p className="text-white font-medium">{evidence.title || evidence.paper_id}</p>
            </div>
          </div>
          {evidence.similarity && (
            <div className="text-right">
              <div className="text-xs text-slate-400">Similarity</div>
              <div className="text-lg font-bold text-green-400">
                {(evidence.similarity * 100).toFixed(0)}%
              </div>
            </div>
          )}
        </div>

        {evidence.passage && (
          <div className="bg-slate-900/50 rounded p-3 mb-3">
            <p className="text-sm text-slate-300 italic leading-relaxed">
              "{evidence.passage}"
            </p>
          </div>
        )}

        <div className="flex items-center justify-between pt-3 border-t border-slate-700">
          <div className="text-xs text-slate-400">
            Paper ID: <span className="text-slate-300 font-mono">{evidence.paper_id}</span>
          </div>
          <div className="flex items-center space-x-2 text-xs text-purple-400">
            <ExternalLink className="w-3 h-3" />
            <span>External source</span>
          </div>
        </div>
      </div>
    )
  }

  if (evidence.passage) {
    // Text passage evidence
    return (
      <div className="bg-slate-800/50 rounded-lg border border-slate-700 p-4">
        <div className="flex items-start space-x-3 mb-3">
          <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-bold text-blue-400">{index}</span>
          </div>
          <div className="flex-1">
            <div className="text-sm font-semibold text-slate-400 mb-2">Text Passage:</div>
            <div className="bg-slate-900/50 rounded p-3">
              <p className="text-sm text-slate-300 italic leading-relaxed">
                "{evidence.passage}"
              </p>
            </div>
          </div>
        </div>

        {evidence.category && (
          <div className="text-xs text-slate-400 pt-2 border-t border-slate-700">
            Category: <span className="text-slate-300">{evidence.category.replace(/_/g, ' ')}</span>
          </div>
        )}
      </div>
    )
  }

  if (evidence.claim) {
    // Novelty claim evidence
    return (
      <div className="bg-slate-800/50 rounded-lg border border-slate-700 p-4">
        <div className="flex items-start space-x-3">
          <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-bold text-green-400">{index}</span>
          </div>
          <div className="flex-1">
            <div className="text-sm font-semibold text-slate-400 mb-2">Detected Claim:</div>
            <div className="bg-slate-900/50 rounded p-3">
              <p className="text-sm text-slate-300 italic leading-relaxed">
                "{evidence.claim}"
              </p>
            </div>
            {evidence.status && (
              <div className="mt-2 text-xs">
                <span className="text-slate-400">Status: </span>
                <span className={`font-medium ${
                  evidence.status === 'novel' ? 'text-green-400' : 'text-orange-400'
                }`}>
                  {evidence.status}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  if (evidence.type === 'keyword') {
    // Keyword-based evidence
    return (
      <div className="bg-slate-800/50 rounded-lg border border-slate-700 p-4">
        <div className="flex items-start space-x-3">
          <div className="w-8 h-8 bg-yellow-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-bold text-yellow-400">{index}</span>
          </div>
          <div className="flex-1">
            <div className="text-sm font-semibold text-slate-400 mb-2">Search Instruction:</div>
            <p className="text-sm text-slate-300 leading-relaxed">
              {evidence.passage}
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (evidence.type === 'reference') {
    // Reference-based evidence
    return (
      <div className="bg-slate-800/50 rounded-lg border border-slate-700 p-4">
        <div className="flex items-start space-x-3">
          <div className="w-8 h-8 bg-indigo-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-bold text-indigo-400">{index}</span>
          </div>
          <div className="flex-1">
            <div className="text-sm font-semibold text-slate-400 mb-2">Reference:</div>
            <p className="text-sm text-slate-300 leading-relaxed">
              {evidence.passage}
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (evidence.type === 'summary') {
    // Summary evidence
    return (
      <div className="bg-slate-800/50 rounded-lg border border-slate-700 p-4">
        <div className="flex items-start space-x-3">
          <div className="w-8 h-8 bg-slate-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-bold text-slate-400">{index}</span>
          </div>
          <div className="flex-1">
            <div className="text-sm font-semibold text-slate-400 mb-2">Summary:</div>
            <p className="text-sm text-slate-300 leading-relaxed">
              {evidence.passage}
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Generic evidence fallback
  return (
    <div className="bg-slate-800/50 rounded-lg border border-slate-700 p-4">
      <div className="flex items-start space-x-3">
        <div className="w-8 h-8 bg-slate-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
          <span className="text-sm font-bold text-slate-400">{index}</span>
        </div>
        <div className="flex-1">
          <div className="text-sm font-semibold text-slate-400 mb-2">Evidence:</div>
          <p className="text-sm text-slate-300 leading-relaxed">
            {JSON.stringify(evidence, null, 2)}
          </p>
        </div>
      </div>
    </div>
  )
}

export default EvidenceExplorer
