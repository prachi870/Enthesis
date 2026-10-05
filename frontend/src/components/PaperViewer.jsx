import { useState, useEffect, useRef } from 'react'
import { 
  Search, BookOpen, ChevronLeft, ChevronRight, Maximize2, Minimize2,
  Lightbulb, AlertTriangle, Target, Zap, FileText, ExternalLink
} from 'lucide-react'

const PaperViewer = ({ paperId, paperText, analysisData }) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedFinding, setSelectedFinding] = useState(null)
  const [highlightedText, setHighlightedText] = useState(null)
  const [currentSection, setCurrentSection] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const paperRef = useRef(null)

  // Split paper into sections (by double newlines or major headings)
  const sections = paperText ? paperText.split(/\n\n+/).filter(s => s.trim().length > 50) : []
  
  // Extract all findings from all modules
  const allFindings = []
  
  if (analysisData?.results) {
    // Module 1: Related Work
    if (analysisData.results.related_work?.findings) {
      analysisData.results.related_work.findings.forEach((finding, idx) => {
        if (finding.type === 'methods_extracted') {
          finding.items?.forEach(method => {
            allFindings.push({
              id: `related_work_method_${idx}_${method}`,
              module: 'Related Work',
              type: 'method',
              title: `Method: ${method}`,
              description: `Technical method or algorithm identified in the paper`,
              confidence: analysisData.results.related_work.confidence,
              keyword: method,
              icon: Target,
              color: 'blue',
              explanation: 'Detected through pattern matching and NER on technical terminology',
              evidence: analysisData.results.related_work.evidence?.slice(0, 2) || []
            })
          })
        }
        if (finding.type === 'datasets_extracted') {
          finding.items?.forEach(dataset => {
            allFindings.push({
              id: `related_work_dataset_${idx}_${dataset}`,
              module: 'Related Work',
              type: 'dataset',
              title: `Dataset: ${dataset}`,
              description: `Dataset or benchmark mentioned in the paper`,
              confidence: analysisData.results.related_work.confidence,
              keyword: dataset,
              icon: FileText,
              color: 'green',
              explanation: 'Identified through dataset name recognition and citation analysis',
              evidence: analysisData.results.related_work.evidence?.slice(0, 2) || []
            })
          })
        }
      })
    }

    // Module 2: Novelty
    if (analysisData.results.novelty?.findings?.[0]) {
      const novelty = analysisData.results.novelty.findings[0]
      allFindings.push({
        id: 'novelty_analysis',
        module: 'Novelty Analysis',
        type: 'novelty',
        title: `Novelty Score: ${(novelty.novelty_score * 100).toFixed(0)}%`,
        description: novelty.summary || `${novelty.novel_claims} novel contributions detected`,
        confidence: analysisData.results.novelty.confidence,
        keyword: null,
        icon: Zap,
        color: 'purple',
        explanation: `Based on ${novelty.novel_claims} novel claims vs ${novelty.non_novel_claims} existing work references. Analyzed using NLI-style entailment checking.`,
        evidence: analysisData.results.novelty.evidence || [],
        metrics: {
          'Novel Claims': novelty.novel_claims,
          'Existing Work': novelty.non_novel_claims,
          'Novelty Score': `${(novelty.novelty_score * 100).toFixed(1)}%`
        }
      })
    }

    // Module 3: Weaknesses
    if (analysisData.results.weaknesses?.findings) {
      analysisData.results.weaknesses.findings.forEach((finding, idx) => {
        allFindings.push({
          id: `weakness_${idx}`,
          module: 'Weaknesses Detection',
          type: 'weakness',
          title: `${finding.category?.replace(/_/g, ' ') || 'Issue'}: ${finding.count} found`,
          description: finding.description || `Potential ${finding.category} issues detected`,
          confidence: analysisData.results.weaknesses.confidence,
          keyword: null,
          icon: AlertTriangle,
          color: 'red',
          explanation: `Pattern-based detection identified ${finding.count} instances of ${finding.category}`,
          evidence: analysisData.results.weaknesses.evidence?.filter(e => 
            e.category === finding.category
          ).slice(0, 3) || []
        })
      })
    }

    // Module 5: Clarity
    if (analysisData.results.clarity?.findings?.[0]) {
      const clarity = analysisData.results.clarity.findings[0]
      allFindings.push({
        id: 'clarity_assessment',
        module: 'Clarity Assessment',
        type: 'clarity',
        title: `Clarity Score: ${clarity.clarity_score?.toFixed(2)} / 1.00`,
        description: clarity.interpretation || 'Writing clarity and readability assessment',
        confidence: analysisData.results.clarity.confidence,
        keyword: null,
        icon: Lightbulb,
        color: 'yellow',
        explanation: `Analysis of sentence structure, passive voice, hedging, and vagueness patterns`,
        evidence: [],
        metrics: clarity.features || {}
      })
    }

    // Module 4: Reviewer Feedback
    if (analysisData.results.reviewer_feedback?.findings) {
      analysisData.results.reviewer_feedback.findings.slice(0, 5).forEach((finding, idx) => {
        allFindings.push({
          id: `reviewer_${idx}`,
          module: 'Reviewer Feedback',
          type: 'feedback',
          title: finding.aspect || 'Reviewer Comment',
          description: finding.feedback || '',
          confidence: analysisData.results.reviewer_feedback.confidence,
          keyword: null,
          icon: BookOpen,
          color: 'indigo',
          explanation: `Generated based on common reviewer patterns`,
          severity: finding.severity,
          evidence: []
        })
      })
    }
  }

  // Find text passages that match a keyword
  const findTextPassages = (keyword) => {
    if (!keyword || !paperText) return []
    const regex = new RegExp(`(.{0,100})(${keyword})(.{0,100})`, 'gi')
    const matches = []
    let match
    while ((match = regex.exec(paperText)) !== null && matches.length < 5) {
      matches.push({
        before: match[1],
        keyword: match[2],
        after: match[3],
        fullText: match[0]
      })
    }
    return matches
  }

  // Search within paper
  const searchMatches = searchTerm && paperText 
    ? paperText.split(/\n+/).filter(para => 
        para.toLowerCase().includes(searchTerm.toLowerCase())
      ).slice(0, 10)
    : []

  // Handle finding selection
  const handleFindingClick = (finding) => {
    setSelectedFinding(finding)
    
    // If finding has a keyword, highlight it in the paper
    if (finding.keyword) {
      setHighlightedText(finding.keyword)
      
      // Scroll to first occurrence
      if (paperRef.current && finding.keyword) {
        const firstMatch = paperText.toLowerCase().indexOf(finding.keyword.toLowerCase())
        if (firstMatch !== -1) {
          // Find which section this is in
          let charCount = 0
          for (let i = 0; i < sections.length; i++) {
            charCount += sections[i].length + 2
            if (charCount > firstMatch) {
              setCurrentSection(i)
              setTimeout(() => {
                paperRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
              }, 100)
              break
            }
          }
        }
      }
    }
  }

  // Highlight text in content
  const highlightContent = (text) => {
    if (!highlightedText && !searchTerm) return text
    
    const terms = [highlightedText, searchTerm].filter(Boolean)
    let result = text
    
    terms.forEach(term => {
      const regex = new RegExp(`(${term})`, 'gi')
      result = result.replace(regex, '<mark class="bg-yellow-300/50 text-yellow-900 px-1 rounded">$1</mark>')
    })
    
    return result
  }

  return (
    <div className={`${isFullscreen ? 'fixed inset-0 z-50' : ''} flex h-screen bg-slate-900`}>
      {/* LEFT PANEL - Paper Content */}
      <div className="flex-1 flex flex-col border-r border-slate-700">
        {/* Paper Header */}
        <div className="bg-slate-800/50 backdrop-blur-lg border-b border-slate-700 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <BookOpen className="w-5 h-5 text-blue-400" />
              <h2 className="text-lg font-semibold text-white">Research Paper</h2>
            </div>
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
            >
              {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
            </button>
          </div>
          
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search in paper..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-900/50 border border-slate-600 rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
            />
          </div>
          
          {searchMatches.length > 0 && (
            <div className="mt-2 text-xs text-slate-400">
              Found {searchMatches.length} matches
            </div>
          )}
        </div>

        {/* Paper Content */}
        <div className="flex-1 overflow-y-auto p-8 bg-slate-900/30">
          <div className="max-w-4xl mx-auto bg-white/5 backdrop-blur-sm rounded-lg border border-slate-700/50 shadow-2xl">
            <div className="p-12" ref={paperRef}>
              {/* Navigation */}
              {sections.length > 1 && (
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-700">
                  <button
                    onClick={() => setCurrentSection(Math.max(0, currentSection - 1))}
                    disabled={currentSection === 0}
                    className="flex items-center space-x-2 text-slate-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span className="text-sm">Previous</span>
                  </button>
                  <span className="text-sm text-slate-400">
                    Section {currentSection + 1} of {sections.length}
                  </span>
                  <button
                    onClick={() => setCurrentSection(Math.min(sections.length - 1, currentSection + 1))}
                    disabled={currentSection === sections.length - 1}
                    className="flex items-center space-x-2 text-slate-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="text-sm">Next</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Paper Text */}
              {searchMatches.length > 0 && searchTerm ? (
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold text-white mb-4">Search Results</h3>
                  {searchMatches.map((match, idx) => (
                    <div 
                      key={idx}
                      className="bg-slate-800/30 rounded-lg p-4 border border-slate-700/50"
                    >
                      <p 
                        className="text-slate-300 leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: highlightContent(match) }}
                      />
                    </div>
                  ))}
                </div>
              ) : sections[currentSection] ? (
                <div className="prose prose-invert prose-slate max-w-none">
                  <div 
                    className="text-slate-300 leading-relaxed whitespace-pre-wrap"
                    dangerouslySetInnerHTML={{ 
                      __html: highlightContent(sections[currentSection]) 
                    }}
                  />
                </div>
              ) : (
                <div className="text-center text-slate-400 py-12">
                  No paper content available
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL - AI Findings */}
      <div className="w-[500px] flex flex-col bg-slate-800/30 backdrop-blur-lg">
        {/* Findings Header */}
        <div className="bg-slate-800/50 border-b border-slate-700 p-4">
          <h2 className="text-lg font-semibold text-white mb-2">AI Findings</h2>
          <p className="text-sm text-slate-400">
            {allFindings.length} findings from {analysisData ? Object.keys(analysisData.results || {}).length : 0} modules
          </p>
        </div>

        {/* Findings List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {allFindings.length === 0 ? (
            <div className="text-center text-slate-400 py-12">
              <Lightbulb className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No findings available yet</p>
            </div>
          ) : (
            allFindings.map(finding => {
              const Icon = finding.icon
              const isSelected = selectedFinding?.id === finding.id
              
              return (
                <div
                  key={finding.id}
                  onClick={() => handleFindingClick(finding)}
                  className={`bg-slate-900/50 rounded-lg border p-4 cursor-pointer transition-all duration-200 ${
                    isSelected 
                      ? `border-${finding.color}-500 shadow-lg shadow-${finding.color}-500/20` 
                      : 'border-slate-700/50 hover:border-slate-600 hover:bg-slate-900/70'
                  }`}
                >
                  {/* Finding Header */}
                  <div className="flex items-start space-x-3 mb-3">
                    <div className={`w-10 h-10 bg-${finding.color}-500/20 rounded-lg flex items-center justify-center flex-shrink-0`}>
                      <Icon className={`w-5 h-5 text-${finding.color}-400`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-xs font-medium text-${finding.color}-400`}>
                          {finding.module}
                        </span>
                        <span className="text-xs text-slate-500">
                          {(finding.confidence * 100).toFixed(0)}%
                        </span>
                      </div>
                      <h3 className="text-sm font-semibold text-white mb-1 break-words">
                        {finding.title}
                      </h3>
                    </div>
                  </div>

                  {/* Finding Description */}
                  <p className="text-xs text-slate-300 mb-3 leading-relaxed">
                    {finding.description}
                  </p>

                  {/* Why Detected */}
                  <div className="bg-slate-800/50 rounded-lg p-3 mb-3">
                    <div className="text-xs font-medium text-slate-400 mb-1">
                      Why detected:
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {finding.explanation}
                    </p>
                  </div>

                  {/* Severity (for weaknesses/feedback) */}
                  {finding.severity && (
                    <div className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs mb-3 ${
                      finding.severity === 'critical' ? 'bg-red-500/20 text-red-300' :
                      finding.severity === 'major' ? 'bg-orange-500/20 text-orange-300' :
                      'bg-yellow-500/20 text-yellow-300'
                    }`}>
                      <span>Severity: {finding.severity}</span>
                    </div>
                  )}

                  {/* Metrics */}
                  {finding.metrics && Object.keys(finding.metrics).length > 0 && (
                    <div className="bg-slate-800/30 rounded-lg p-3 mb-3">
                      <div className="text-xs font-medium text-slate-400 mb-2">Metrics:</div>
                      <div className="space-y-1">
                        {Object.entries(finding.metrics).map(([key, value]) => (
                          <div key={key} className="flex justify-between text-xs">
                            <span className="text-slate-400">{key}:</span>
                            <span className="text-slate-200 font-mono">{value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Evidence */}
                  {finding.evidence && finding.evidence.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-xs font-medium text-slate-400">
                        Evidence ({finding.evidence.length}):
                      </div>
                      {finding.evidence.slice(0, 2).map((ev, idx) => (
                        <div key={idx} className="bg-slate-800/30 rounded p-2">
                          {ev.paper_id && (
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs text-slate-400">{ev.title || ev.paper_id}</span>
                              {ev.similarity && (
                                <span className="text-xs text-green-400">
                                  {(ev.similarity * 100).toFixed(0)}%
                                </span>
                              )}
                            </div>
                          )}
                          {ev.passage && (
                            <p className="text-xs text-slate-300 leading-relaxed">
                              {ev.passage.substring(0, 150)}...
                            </p>
                          )}
                          {ev.claim && (
                            <p className="text-xs text-slate-300 italic">
                              "{ev.claim}"
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Click to highlight */}
                  {finding.keyword && (
                    <div className="mt-3 pt-3 border-t border-slate-700/50">
                      <div className="flex items-center space-x-2 text-xs text-blue-400">
                        <ExternalLink className="w-3 h-3" />
                        <span>Click to highlight in paper</span>
                      </div>
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}

export default PaperViewer
