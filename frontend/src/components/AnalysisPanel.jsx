import { useState, useEffect } from 'react'
import { Brain, Search, AlertTriangle, FileText, CheckCircle2, Clock, XCircle, MessageSquare } from 'lucide-react'

const ModuleCard = ({ title, icon: Icon, status, moduleData, color }) => {
  const statusConfig = {
    done: { bg: 'bg-green-500/20', border: 'border-green-500/50', text: 'text-green-400', icon: CheckCircle2 },
    running: { bg: 'bg-blue-500/20', border: 'border-blue-500/50', text: 'text-blue-400', icon: Clock },
    failed: { bg: 'bg-red-500/20', border: 'border-red-500/50', text: 'text-red-400', icon: XCircle },
    pending: { bg: 'bg-slate-500/20', border: 'border-slate-500/50', text: 'text-slate-400', icon: Clock }
  }

  const config = statusConfig[status] || statusConfig.pending
  const StatusIcon = config.icon
  
  // Extract data from backend format
  const findings = moduleData?.findings || []
  const evidence = moduleData?.evidence || []
  const confidence = moduleData?.confidence || 0

  return (
    <div className={`bg-slate-900/70 backdrop-blur-lg rounded-xl border ${config.border} p-6 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02]`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className={`w-12 h-12 bg-gradient-to-br ${color} rounded-lg flex items-center justify-center`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">{title}</h3>
            <div className="flex items-center space-x-2 mt-1">
              <StatusIcon className={`w-4 h-4 ${config.text}`} />
              <span className={`text-sm ${config.text} capitalize`}>{status}</span>
            </div>
          </div>
        </div>
        {confidence > 0 && (
          <div className="text-right">
            <div className="text-xs text-slate-400">Confidence</div>
            <div className="text-sm font-semibold text-blue-400">{(confidence * 100).toFixed(0)}%</div>
          </div>
        )}
      </div>

      {status === 'done' && findings.length > 0 && (
        <div className="space-y-3 mt-4">
          {/* Related Work */}
          {title.includes('Related Work') && (
            <div className="space-y-3">
              {findings.map((finding, idx) => (
                <div key={idx}>
                  {finding.type === 'methods_extracted' && (
                    <div>
                      <div className="text-sm font-semibold text-slate-300 mb-2">Methods Found: {finding.count}</div>
                      <div className="flex flex-wrap gap-2">
                        {finding.items.slice(0, 8).map((method, i) => (
                          <span key={i} className="px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded-full border border-blue-500/30">
                            {method}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {finding.type === 'datasets_extracted' && (
                    <div>
                      <div className="text-sm font-semibold text-slate-300 mb-2">Datasets: {finding.count}</div>
                      <div className="flex flex-wrap gap-2">
                        {finding.items.slice(0, 6).map((dataset, i) => (
                          <span key={i} className="px-2 py-1 bg-green-500/20 text-green-300 text-xs rounded-full border border-green-500/30">
                            {dataset}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {finding.type === 'paper' && (
                    <div className="bg-slate-800/50 rounded-lg p-3">
                      <div className="text-sm font-medium text-slate-200">{finding.title}</div>
                      <div className="text-xs text-slate-400 mt-1">Similarity: {(finding.similarity * 100).toFixed(0)}%</div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Novelty */}
          {title.includes('Novelty') && findings[0] && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-800/50 rounded-lg p-3">
                  <div className="text-xs text-slate-400">Novel Claims</div>
                  <div className="text-2xl font-bold text-green-400">{findings[0].novel_claims || 0}</div>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-3">
                  <div className="text-xs text-slate-400">Existing Work</div>
                  <div className="text-2xl font-bold text-orange-400">{findings[0].non_novel_claims || 0}</div>
                </div>
              </div>
              {findings[0].novelty_score !== undefined && (
                <div>
                  <div className="text-sm text-slate-400 mb-2">Novelty Score</div>
                  <div className="w-full bg-slate-700 rounded-full h-3">
                    <div 
                      className="bg-gradient-to-r from-green-500 to-emerald-400 h-3 rounded-full transition-all duration-500"
                      style={{ width: `${findings[0].novelty_score * 100}%` }}
                    />
                  </div>
                  <div className="text-right text-sm font-semibold text-green-400 mt-1">
                    {(findings[0].novelty_score * 100).toFixed(1)}%
                  </div>
                </div>
              )}
              {findings[0].summary && (
                <div className="text-sm text-slate-300 bg-slate-800/30 p-3 rounded-lg">
                  {findings[0].summary}
                </div>
              )}
            </div>
          )}

          {/* Weaknesses */}
          {title.includes('Weaknesses') && (
            <div className="space-y-2">
              <div className="text-sm font-semibold text-slate-300 mb-2">
                Issues Detected: {findings.reduce((sum, f) => sum + (f.count || 0), 0)}
              </div>
              {findings.map((finding, idx) => (
                <div key={idx} className="bg-slate-800/30 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-orange-400 capitalize">
                      {finding.category?.replace(/_/g, ' ') || finding.type}
                    </span>
                    <span className="text-xs text-slate-400">{finding.count} found</span>
                  </div>
                  {evidence.slice(idx * 2, idx * 2 + 2).map((ev, i) => (
                    <div key={i} className="text-xs text-slate-400 mt-1 flex items-start space-x-2">
                      <AlertTriangle className="w-3 h-3 text-orange-400 mt-0.5 flex-shrink-0" />
                      <span>{ev.passage?.substring(0, 80)}...</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}

          {/* Clarity */}
          {title.includes('Clarity') && findings[0] && (
            <div className="space-y-3">
              {findings[0].clarity_score !== undefined && (
                <div className="bg-slate-800/50 rounded-lg p-4">
                  <div className="text-sm text-slate-400 mb-2">Clarity Score</div>
                  <div className="flex items-end space-x-2">
                    <div className="text-4xl font-bold text-purple-400">
                      {findings[0].clarity_score.toFixed(2)}
                    </div>
                    <div className="text-sm text-slate-400 mb-2">/ 1.00</div>
                  </div>
                  <div className="text-xs text-slate-400 mt-2">
                    {findings[0].interpretation || 'Writing clarity assessment'}
                  </div>
                </div>
              )}
              {findings[0].features && (
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-slate-800/30 rounded p-2">
                    <div className="text-xs text-slate-400">Avg Sentence Length</div>
                    <div className="text-sm font-semibold text-slate-200">
                      {findings[0].features.avg_sentence_length?.toFixed(1) || 'N/A'}
                    </div>
                  </div>
                  <div className="bg-slate-800/30 rounded p-2">
                    <div className="text-xs text-slate-400">Passive Voice</div>
                    <div className="text-sm font-semibold text-slate-200">
                      {findings[0].features.passive_voice_count || 0}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Reviewer Feedback */}
          {title.includes('Reviewer') && (
            <div className="space-y-2">
              <div className="text-sm font-semibold text-slate-300 mb-2">
                Feedback Items: {findings.length}
              </div>
              {findings.slice(0, 5).map((finding, idx) => (
                <div key={idx} className="bg-slate-800/30 rounded-lg p-3">
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-sm font-medium text-blue-400 capitalize">
                      {finding.aspect || finding.type}
                    </span>
                    {finding.severity && (
                      <span className={`text-xs px-2 py-1 rounded ${
                        finding.severity === 'critical' ? 'bg-red-500/20 text-red-300' :
                        finding.severity === 'major' ? 'bg-orange-500/20 text-orange-300' :
                        'bg-yellow-500/20 text-yellow-300'
                      }`}>
                        {finding.severity}
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-slate-300">
                    {finding.feedback?.substring(0, 120)}...
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Show limitations */}
          {moduleData?.limitations && moduleData.limitations.length > 0 && (
            <div className="mt-3 text-xs text-slate-500 bg-slate-800/20 p-2 rounded">
              ⚠️ {moduleData.limitations[0]}
            </div>
          )}
        </div>
      )}

      {status === 'running' && (
        <div className="mt-4 flex items-center space-x-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400"></div>
          <span className="text-sm text-blue-400">Analyzing...</span>
        </div>
      )}

      {status === 'failed' && (
        <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
          <p className="text-sm text-red-400">Analysis failed. Please try again.</p>
        </div>
      )}

      {status === 'pending' && (
        <div className="mt-4 flex items-center space-x-2">
          <Clock className="w-4 h-4 text-slate-400" />
          <span className="text-sm text-slate-400">Waiting for previous modules...</span>
        </div>
      )}
    </div>
  )
}

const AnalysisPanel = ({ data, paperId }) => {
  const [fullData, setFullData] = useState(data)

  useEffect(() => {
    setFullData(data)
  }, [data])

  const modules = [
    {
      key: 'related_work',
      title: 'Related Work Detection',
      icon: Search,
      color: 'from-blue-500 to-cyan-600',
      results: fullData?.results?.related_work
    },
    {
      key: 'novelty',
      title: 'Novelty Analysis',
      icon: Brain,
      color: 'from-green-500 to-emerald-600',
      results: fullData?.results?.novelty
    },
    {
      key: 'weaknesses',
      title: 'Weaknesses Detection',
      icon: AlertTriangle,
      color: 'from-orange-500 to-red-600',
      results: fullData?.results?.weaknesses
    },
    {
      key: 'clarity',
      title: 'Clarity Assessment',
      icon: FileText,
      color: 'from-purple-500 to-pink-600',
      results: fullData?.results?.clarity
    },
    {
      key: 'reviewer_feedback',
      title: 'Reviewer Feedback',
      icon: MessageSquare,
      color: 'from-indigo-500 to-blue-600',
      results: fullData?.results?.reviewer_feedback
    }
  ]

  // Get status for each module
  const getModuleStatus = (key) => {
    return fullData?.states?.[key] || 'pending'
  }

  return (
    <div className="space-y-6">
      {/* Overall Progress */}
      <div className="bg-slate-900/70 backdrop-blur-lg rounded-xl border border-slate-700/50 p-6 shadow-xl">
        <h3 className="text-xl font-semibold mb-4">Analysis Progress</h3>
        <div className="grid grid-cols-5 gap-4">
          {modules.map(module => {
            const status = getModuleStatus(module.key)
            const StatusIcon = status === 'done' ? CheckCircle2 : status === 'running' ? Clock : status === 'error' ? XCircle : Clock
            const statusColor = status === 'done' ? 'text-green-400' : status === 'running' ? 'text-blue-400' : status === 'error' ? 'text-red-400' : 'text-slate-400'
            
            return (
              <div key={module.key} className="text-center">
                <StatusIcon className={`w-8 h-8 mx-auto mb-2 ${statusColor}`} />
                <div className="text-xs text-slate-400">{module.title.split(' ')[0]}</div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Module Results */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {modules.map(module => (
          <ModuleCard
            key={module.key}
            title={module.title}
            icon={module.icon}
            status={getModuleStatus(module.key)}
            moduleData={module.results}
            color={module.color}
          />
        ))}
      </div>

      {/* Download Report Button */}
      {Object.values(fullData?.states || {}).every(s => s === 'done' || s === 'error') && (
        <div className="flex justify-center">
          <button
            onClick={() => window.open(`/api/v1/papers/${paperId}/report`, '_blank')}
            className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl font-semibold hover:from-blue-600 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center space-x-2"
          >
            <FileText className="w-5 h-5" />
            <span>Download Full Report</span>
          </button>
        </div>
      )}
    </div>
  )
}

export default AnalysisPanel
