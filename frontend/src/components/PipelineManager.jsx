import { useState, useEffect } from 'react'
import { 
  CheckCircle, Clock, XCircle, AlertCircle, PlayCircle, RefreshCw, 
  ChevronRight, ArrowRight, Sparkles
} from 'lucide-react'
import { approveStage } from '../utils/api'

const PipelineManager = ({ paperId, analysisData, onUpdate }) => {
  const [approving, setApproving] = useState(null)

  // Define pipeline stages in order
  const stages = [
    { 
      key: 'related_work', 
      number: 1,
      title: 'Related Work Detection',
      description: 'Identifies methods, datasets, and similar papers',
      color: 'blue'
    },
    { 
      key: 'novelty', 
      number: 2,
      title: 'Novelty Analysis',
      description: 'Evaluates novel contributions and claims',
      color: 'purple'
    },
    { 
      key: 'weaknesses', 
      number: 3,
      title: 'Weakness Detection',
      description: 'Identifies potential issues and gaps',
      color: 'orange'
    },
    { 
      key: 'clarity', 
      number: 5,
      title: 'Clarity Assessment',
      description: 'Evaluates writing quality and readability',
      color: 'pink'
    },
    { 
      key: 'reviewer_feedback', 
      number: 4,
      title: 'Reviewer-Style Feedback',
      description: 'Generates comprehensive review comments',
      color: 'indigo'
    }
  ]

  // Get stage status from backend
  const getStageStatus = (stageKey) => {
    const state = analysisData?.states?.[stageKey]
    if (!state) return 'pending'
    
    // Map backend states to display states
    switch (state) {
      case 'done':
        return 'waiting_approval'
      case 'approved':
        return 'completed'
      case 'running':
        return 'running'
      case 'failed':
        return 'failed'
      default:
        return 'pending'
    }
  }

  // Check if stage can be approved
  const canApprove = (stageKey) => {
    return getStageStatus(stageKey) === 'waiting_approval'
  }

  // Check if stage can be retried
  const canRetry = (stageKey) => {
    return getStageStatus(stageKey) === 'failed'
  }

  // Get current active stage
  const getCurrentStage = () => {
    for (const stage of stages) {
      const status = getStageStatus(stage.key)
      if (status === 'running' || status === 'waiting_approval') {
        return stage
      }
    }
    return null
  }

  // Count stages by status
  const counts = {
    completed: stages.filter(s => getStageStatus(s.key) === 'completed').length,
    running: stages.filter(s => getStageStatus(s.key) === 'running').length,
    pending: stages.filter(s => getStageStatus(s.key) === 'pending').length,
    failed: stages.filter(s => getStageStatus(s.key) === 'failed').length
  }

  // Overall progress percentage
  const progressPercent = (counts.completed / stages.length) * 100

  // Handle approve
  const handleApprove = async (stageKey) => {
    setApproving(stageKey)
    try {
      await approveStage(paperId, stageKey)
      // Notify parent to refresh data
      if (onUpdate) onUpdate()
    } catch (error) {
      console.error('Error approving stage:', error)
      alert(error.message || 'Failed to approve stage')
    } finally {
      setApproving(null)
    }
  }

  // Handle retry (just approve again to trigger re-run)
  const handleRetry = async (stageKey) => {
    setApproving(stageKey)
    try {
      await approveStage(paperId, stageKey)
      if (onUpdate) onUpdate()
    } catch (error) {
      console.error('Error retrying stage:', error)
      alert(error.message || 'Failed to retry stage')
    } finally {
      setApproving(null)
    }
  }

  const currentStage = getCurrentStage()
  const allComplete = counts.completed === stages.length

  return (
    <div className="space-y-6">
      {/* Pipeline Header */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-xl border border-slate-700 p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Analysis Pipeline</h2>
              <p className="text-sm text-slate-400">
                {allComplete ? 'All stages completed!' : 
                 currentStage ? `Currently on Stage ${currentStage.number}: ${currentStage.title}` :
                 'Ready to begin analysis'}
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-white">{counts.completed}/{stages.length}</div>
            <div className="text-sm text-slate-400">Stages Complete</div>
          </div>
        </div>

        {/* Overall Progress Bar */}
        <div>
          <div className="flex items-center justify-between text-sm text-slate-400 mb-2">
            <span>Overall Progress</span>
            <span>{progressPercent.toFixed(0)}%</span>
          </div>
          <div className="w-full bg-slate-700 rounded-full h-3 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 h-3 rounded-full transition-all duration-500 flex items-center justify-end"
              style={{ width: `${progressPercent}%` }}
            >
              {progressPercent > 10 && (
                <div className="w-2 h-2 bg-white rounded-full mr-1 animate-pulse"></div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-4 gap-4 mt-4">
          <StatBadge label="Completed" value={counts.completed} color="green" />
          <StatBadge label="Running" value={counts.running} color="blue" pulse={counts.running > 0} />
          <StatBadge label="Pending" value={counts.pending} color="slate" />
          <StatBadge label="Failed" value={counts.failed} color="red" />
        </div>
      </div>

      {/* Pipeline Stages */}
      <div className="space-y-4">
        {stages.map((stage, index) => {
          const status = getStageStatus(stage.key)
          const results = analysisData?.results?.[stage.key]
          const error = analysisData?.errors?.[stage.key]
          const isActive = currentStage?.key === stage.key
          
          return (
            <StageCard
              key={stage.key}
              stage={stage}
              status={status}
              results={results}
              error={error}
              isActive={isActive}
              canApprove={canApprove(stage.key)}
              canRetry={canRetry(stage.key)}
              onApprove={() => handleApprove(stage.key)}
              onRetry={() => handleRetry(stage.key)}
              isApproving={approving === stage.key}
              showConnector={index < stages.length - 1}
            />
          )
        })}
      </div>

      {/* Completion Message */}
      {allComplete && (
        <div className="bg-gradient-to-r from-green-900/50 to-emerald-900/50 border border-green-500/50 rounded-xl p-6 text-center">
          <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-3" />
          <h3 className="text-2xl font-bold text-white mb-2">Analysis Complete!</h3>
          <p className="text-green-200 mb-4">
            All {stages.length} stages have been successfully completed and approved.
          </p>
          <p className="text-sm text-green-300">
            You can now review the comprehensive analysis results and download the full report.
          </p>
        </div>
      )}
    </div>
  )
}

const StatBadge = ({ label, value, color, pulse }) => (
  <div className={`bg-slate-800/50 rounded-lg p-3 border border-${color}-500/30 ${pulse ? 'animate-pulse' : ''}`}>
    <div className={`text-2xl font-bold text-${color}-400`}>{value}</div>
    <div className="text-xs text-slate-400">{label}</div>
  </div>
)

const StageCard = ({ 
  stage, 
  status, 
  results, 
  error, 
  isActive, 
  canApprove, 
  canRetry, 
  onApprove, 
  onRetry,
  isApproving,
  showConnector 
}) => {
  const statusConfig = {
    pending: {
      icon: Clock,
      color: 'slate',
      bg: 'bg-slate-500/10',
      border: 'border-slate-500/30',
      text: 'text-slate-400',
      label: 'Pending'
    },
    running: {
      icon: PlayCircle,
      color: 'blue',
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/50',
      text: 'text-blue-400',
      label: 'Running'
    },
    waiting_approval: {
      icon: AlertCircle,
      color: 'yellow',
      bg: 'bg-yellow-500/10',
      border: 'border-yellow-500/50',
      text: 'text-yellow-400',
      label: 'Waiting for Approval'
    },
    completed: {
      icon: CheckCircle,
      color: 'green',
      bg: 'bg-green-500/10',
      border: 'border-green-500/50',
      text: 'text-green-400',
      label: 'Completed'
    },
    failed: {
      icon: XCircle,
      color: 'red',
      bg: 'bg-red-500/10',
      border: 'border-red-500/50',
      text: 'text-red-400',
      label: 'Failed'
    }
  }

  const config = statusConfig[status]
  const StatusIcon = config.icon

  // Count findings
  const findingsCount = results?.findings?.length || 0
  const confidence = results?.confidence || 0

  return (
    <div className="relative">
      <div className={`bg-slate-900/70 backdrop-blur-lg rounded-xl border ${config.border} ${isActive ? 'ring-2 ring-blue-500/50 shadow-xl shadow-blue-500/20' : ''} transition-all duration-300`}>
        <div className="p-6">
          {/* Stage Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-start space-x-4">
              {/* Stage Number Circle */}
              <div className={`w-12 h-12 rounded-full ${config.bg} border ${config.border} flex items-center justify-center flex-shrink-0`}>
                <span className={`text-lg font-bold ${config.text}`}>{stage.number}</span>
              </div>
              
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-white mb-1">{stage.title}</h3>
                <p className="text-sm text-slate-400 mb-2">{stage.description}</p>
                
                {/* Status Badge */}
                <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full ${config.bg} ${config.border} border`}>
                  <StatusIcon className={`w-4 h-4 ${config.text} ${status === 'running' ? 'animate-spin' : ''}`} />
                  <span className={`text-sm font-medium ${config.text}`}>{config.label}</span>
                </div>
              </div>
            </div>

            {/* Confidence Badge */}
            {status === 'completed' && confidence > 0 && (
              <div className="bg-slate-800/50 rounded-lg px-4 py-2 border border-slate-700">
                <div className="text-xs text-slate-400">Confidence</div>
                <div className="text-xl font-bold text-blue-400">{(confidence * 100).toFixed(0)}%</div>
              </div>
            )}
          </div>

          {/* Results Summary */}
          {(status === 'waiting_approval' || status === 'completed') && results && (
            <div className="bg-slate-800/30 rounded-lg p-4 mb-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Findings detected:</span>
                <span className="text-white font-semibold">{findingsCount} items</span>
              </div>
              {results.metrics && (
                <div className="mt-2 pt-2 border-t border-slate-700/50 space-y-1">
                  {Object.entries(results.metrics).slice(0, 2).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between text-xs">
                      <span className="text-slate-500">{key.replace(/_/g, ' ')}:</span>
                      <span className="text-slate-300 font-mono">{value}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Error Message */}
          {status === 'failed' && error && (
            <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4 mb-4">
              <div className="flex items-start space-x-2">
                <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="text-sm font-semibold text-red-300 mb-1">Error occurred</div>
                  <div className="text-xs text-red-200">{error}</div>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center space-x-3">
            {canApprove && (
              <button
                onClick={onApprove}
                disabled={isApproving}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg font-semibold hover:from-green-600 hover:to-emerald-700 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {isApproving ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span>Approving...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    <span>Approve & Continue</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            )}

            {canRetry && (
              <button
                onClick={onRetry}
                disabled={isApproving}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-orange-500 to-red-600 rounded-lg font-semibold hover:from-orange-600 hover:to-red-700 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {isApproving ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span>Retrying...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-5 h-5" />
                    <span>Retry Stage</span>
                  </>
                )}
              </button>
            )}

            {status === 'pending' && (
              <div className="flex-1 px-6 py-3 bg-slate-800/50 rounded-lg text-center border border-slate-700">
                <span className="text-slate-400">Waiting for previous stages...</span>
              </div>
            )}

            {status === 'running' && (
              <div className="flex-1 px-6 py-3 bg-blue-900/20 rounded-lg border border-blue-500/30 flex items-center justify-center space-x-2">
                <RefreshCw className="w-5 h-5 text-blue-400 animate-spin" />
                <span className="text-blue-300">Processing...</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Connector Arrow */}
      {showConnector && (
        <div className="flex justify-center py-2">
          <ChevronRight className="w-6 h-6 text-slate-600 transform rotate-90" />
        </div>
      )}
    </div>
  )
}

export default PipelineManager
