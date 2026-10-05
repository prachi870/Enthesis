import { useState } from 'react'
import Scene3D from './components/Scene3D'
import FloatingQuotes from './components/FloatingQuotes'
import FloatingKeywords from './components/FloatingKeywords'
import ResearchDashboard from './components/ResearchDashboard'
import AnalysisPanel from './components/AnalysisPanel'
import PaperViewer from './components/PaperViewer'
import ClaimInspector from './components/ClaimInspector'
import NoveltyInvestigation from './components/NoveltyInvestigation'
import WeaknessHeatmap from './components/WeaknessHeatmap'
import ReviewerRoom from './components/ReviewerRoom'
import ActionCenter from './components/ActionCenter'
import VersionManager from './components/VersionManager'
import VersionComparison from './components/VersionComparison'
import BeforeAfterAnalysis from './components/BeforeAfterAnalysis'
import AnalysisHistory from './components/AnalysisHistory'
import ResearchReport from './components/ResearchReport'
import ReportsDashboard from './components/ReportsDashboard'
import { ArrowLeft, Sparkles, Eye, BarChart3, Target, Microscope, AlertTriangle, Users, CheckSquare, GitBranch, History, FileText, FileStack } from 'lucide-react'
import { getResults, getPaperWithText } from './utils/api'

function App() {
  const [selectedPaperId, setSelectedPaperId] = useState(null)
  const [analysisData, setAnalysisData] = useState(null)
  const [paperData, setPaperData] = useState(null)
  const [viewMode, setViewMode] = useState('analysis') // 'analysis', 'viewer', 'claims', 'novelty', 'weaknesses', 'reviewer', 'actions', 'versions', 'comparison', 'beforeafter', 'history', 'report', or 'allreports'
  const [comparisonVersions, setComparisonVersions] = useState(null) // {v1: id, v2: id}

  const handlePaperSelect = async (paperId) => {
    setSelectedPaperId(paperId)
    setViewMode('analysis')
    
    // Load analysis data
    try {
      const data = await getResults(paperId)
      setAnalysisData(data)
      
      // Load paper text
      const paper = await getPaperWithText(paperId)
      setPaperData(paper)
      
      // Start polling if not complete
      const states = Object.values(data.states || {})
      if (states.some(s => s === 'running') || states.some(s => s === 'pending')) {
        pollResults(paperId)
      }
    } catch (error) {
      console.error('Error loading paper:', error)
    }
  }

  const handleBackToDashboard = () => {
    setSelectedPaperId(null)
    setAnalysisData(null)
    setPaperData(null)
    setViewMode('analysis')
    setComparisonVersions(null)
  }

  const handleCompareVersions = (version1Id, version2Id) => {
    setComparisonVersions({ v1: version1Id, v2: version2Id })
    setViewMode('comparison')
  }

  const handleBeforeAfter = (version1Id, version2Id) => {
    setComparisonVersions({ v1: version1Id, v2: version2Id })
    setViewMode('beforeafter')
  }

  const handleBackToVersions = () => {
    setComparisonVersions(null)
    setViewMode('versions')
  }

  const handleOpenHistoricalRun = (run) => {
    // Load the historical analysis data
    setAnalysisData(run.analysis_results)
    setViewMode('analysis')
  }

  const handleUploadSuccess = (data) => {
    // Navigate to the newly uploaded paper
    handlePaperSelect(data.paper_id)
  }

  const pollResults = async (id) => {
    const interval = setInterval(async () => {
      try {
        const data = await getResults(id)
        setAnalysisData(data)
        
        // Also refresh paper data to keep it in sync
        const paper = await getPaperWithText(id)
        setPaperData(paper)
        
        // Check if all stages complete or failed
        const states = Object.values(data.states || {})
        const allComplete = states.every(s => s === 'approved' || s === 'done' || s === 'failed')
        
        if (allComplete) {
          clearInterval(interval)
        }
      } catch (error) {
        console.error('Error polling results:', error)
        clearInterval(interval)
      }
    }, 3000) // Poll every 3 seconds
    
    // Store interval ID for cleanup
    return interval
  }

  return (
    <div className="relative w-full min-h-screen overflow-hidden bg-[#0a0e1a]">
      {/* 3D Background Scene - Only show in dashboard */}
      {!selectedPaperId && (
        <div className="fixed inset-0 z-0">
          <Scene3D />
        </div>
      )}

      {/* Floating Keywords - Subtle background effect */}
      {!selectedPaperId && <FloatingKeywords />}

      {/* Floating Quotes - Show in dashboard */}
      {!selectedPaperId && <FloatingQuotes />}

      {/* Gradient overlay */}
      <div className="fixed inset-0 z-0 bg-gradient-to-br from-purple-900/10 via-transparent to-blue-900/10 pointer-events-none" />

      {/* Main Content */}
      <div className={`relative ${selectedPaperId ? '' : 'z-10'}`}>
        {/* Header - Only show when not in paper viewer */}
        {viewMode !== 'viewer' && (
          <header className="glass-card border-b border-purple-500/20 sticky top-0 z-50">
            <div className="container mx-auto px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  {selectedPaperId && (
                    <button
                      onClick={handleBackToDashboard}
                      className="p-2.5 hover:bg-purple-500/10 rounded-xl transition-all duration-300 group border border-transparent hover:border-purple-500/30"
                    >
                      <ArrowLeft className="w-5 h-5 text-slate-400 group-hover:text-purple-400 transition-colors" />
                    </button>
                  )}
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 gradient-bg-purple rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/30 relative overflow-hidden group">
                      <div className="absolute inset-0 bg-gradient-to-tr from-white/0 to-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                      <Sparkles className="w-6 h-6 text-white relative z-10" />
                    </div>
                    <div>
                      <h1 className="text-2xl font-bold text-gradient">
                        Enthesis
                      </h1>
                      <p className="text-xs text-slate-400 font-medium">AI Research Assistant</p>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  {/* Global Reports Button - Show in dashboard view */}
                  {!selectedPaperId && (
                    <button
                      onClick={() => setViewMode('allreports')}
                      className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 flex items-center space-x-2 ${
                        viewMode === 'allreports'
                          ? 'gradient-bg-purple text-white shadow-lg shadow-purple-500/30'
                          : 'bg-slate-800/50 text-slate-400 hover:text-white hover:bg-slate-700/50 border border-purple-500/20'
                      }`}
                    >
                      <FileStack className="w-4 h-4" />
                      <span>All Reports</span>
                    </button>
                  )}
                  
                  {/* View Mode Toggle */}
                  {selectedPaperId && paperData?.text && (
                    <div className="flex items-center space-x-1 bg-slate-800/50 rounded-lg p-1">
                      <button
                        onClick={() => setViewMode('analysis')}
                        className={`px-2 py-2 rounded-lg text-xs font-medium transition-all duration-200 flex items-center space-x-1 ${
                          viewMode === 'analysis'
                            ? 'bg-blue-500 text-white'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        <BarChart3 className="w-4 h-4" />
                        <span>Analysis</span>
                      </button>
                      <button
                        onClick={() => setViewMode('claims')}
                        className={`px-2 py-2 rounded-lg text-xs font-medium transition-all duration-200 flex items-center space-x-1 ${
                          viewMode === 'claims'
                            ? 'bg-blue-500 text-white'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        <Target className="w-4 h-4" />
                        <span>Claims</span>
                      </button>
                      <button
                        onClick={() => setViewMode('novelty')}
                        className={`px-2 py-2 rounded-lg text-xs font-medium transition-all duration-200 flex items-center space-x-1 ${
                          viewMode === 'novelty'
                            ? 'bg-blue-500 text-white'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        <Microscope className="w-4 h-4" />
                        <span>Novelty</span>
                      </button>
                      <button
                        onClick={() => setViewMode('weaknesses')}
                        className={`px-2 py-2 rounded-lg text-xs font-medium transition-all duration-200 flex items-center space-x-1 ${
                          viewMode === 'weaknesses'
                            ? 'bg-blue-500 text-white'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        <AlertTriangle className="w-4 h-4" />
                        <span>Weaknesses</span>
                      </button>
                      <button
                        onClick={() => setViewMode('reviewer')}
                        className={`px-2 py-2 rounded-lg text-xs font-medium transition-all duration-200 flex items-center space-x-1 ${
                          viewMode === 'reviewer'
                            ? 'bg-blue-500 text-white'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        <Users className="w-4 h-4" />
                        <span>Reviewer</span>
                      </button>
                      <button
                        onClick={() => setViewMode('actions')}
                        className={`px-2 py-2 rounded-lg text-xs font-medium transition-all duration-200 flex items-center space-x-1 ${
                          viewMode === 'actions'
                            ? 'bg-blue-500 text-white'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        <CheckSquare className="w-4 h-4" />
                        <span>Actions</span>
                      </button>
                      <button
                        onClick={() => setViewMode('versions')}
                        className={`px-2 py-2 rounded-lg text-xs font-medium transition-all duration-200 flex items-center space-x-1 ${
                          viewMode === 'versions' || viewMode === 'comparison'
                            ? 'bg-blue-500 text-white'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        <GitBranch className="w-4 h-4" />
                        <span>Versions</span>
                      </button>
                      <button
                        onClick={() => setViewMode('history')}
                        className={`px-2 py-2 rounded-lg text-xs font-medium transition-all duration-200 flex items-center space-x-1 ${
                          viewMode === 'history'
                            ? 'bg-blue-500 text-white'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        <History className="w-4 h-4" />
                        <span>History</span>
                      </button>
                      <button
                        onClick={() => setViewMode('report')}
                        className={`px-2 py-2 rounded-lg text-xs font-medium transition-all duration-200 flex items-center space-x-1 ${
                          viewMode === 'report'
                            ? 'bg-blue-500 text-white'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        <FileText className="w-4 h-4" />
                        <span>Report</span>
                      </button>
                      <button
                        onClick={() => setViewMode('viewer')}
                        className={`px-2 py-2 rounded-lg text-xs font-medium transition-all duration-200 flex items-center space-x-1 ${
                          viewMode === 'viewer'
                            ? 'bg-blue-500 text-white'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        <Eye className="w-4 h-4" />
                        <span>Paper</span>
                      </button>
                    </div>
                  )}
                  
                  <div className="text-right">
                    <div className="text-sm font-semibold text-blue-400">All Modules Active</div>
                    <div className="text-xs text-slate-400">5/5 Analysis Modules</div>
                  </div>
                </div>
              </div>
            </div>
          </header>
        )}

        {/* Main Content Area */}
        <main>
          {!selectedPaperId ? (
            viewMode === 'allreports' ? (
              /* All Reports Dashboard */
              <div className="container mx-auto px-6 py-8">
                <ReportsDashboard onPaperSelect={handlePaperSelect} />
              </div>
            ) : (
              /* Dashboard View */
              <ResearchDashboard 
                onPaperSelect={handlePaperSelect}
                onUploadSuccess={handleUploadSuccess}
              />
            )
          ) : viewMode === 'viewer' ? (
            /* Paper Viewer */
            <PaperViewer
              paperId={selectedPaperId}
              paperText={paperData?.text}
              analysisData={analysisData}
            />
          ) : viewMode === 'claims' ? (
            /* Claim Inspector */
            <div className="container mx-auto px-6 py-8">
              <ClaimInspector paperId={selectedPaperId} />
            </div>
          ) : viewMode === 'novelty' ? (
            /* Novelty Investigation */
            <div className="container mx-auto px-6 py-8">
              <NoveltyInvestigation paperId={selectedPaperId} />
            </div>
          ) : viewMode === 'weaknesses' ? (
            /* Weakness Heatmap */
            <div className="container mx-auto px-6 py-8">
              <WeaknessHeatmap paperId={selectedPaperId} />
            </div>
          ) : viewMode === 'reviewer' ? (
            /* Reviewer Room */
            <div className="container mx-auto px-6 py-8">
              <ReviewerRoom paperId={selectedPaperId} />
            </div>
          ) : viewMode === 'actions' ? (
            /* Action Center */
            <div className="container mx-auto px-6 py-8">
              <ActionCenter paperId={selectedPaperId} />
            </div>
          ) : viewMode === 'comparison' ? (
            /* Version Comparison */
            <div className="container mx-auto px-6 py-8">
              <VersionComparison
                paperId={selectedPaperId}
                version1Id={comparisonVersions?.v1}
                version2Id={comparisonVersions?.v2}
                onBack={handleBackToVersions}
              />
            </div>
          ) : viewMode === 'beforeafter' ? (
            /* Before vs After Analysis */
            <div className="container mx-auto px-6 py-8">
              <BeforeAfterAnalysis
                paperId={selectedPaperId}
                beforeVersionId={comparisonVersions?.v1}
                afterVersionId={comparisonVersions?.v2}
                onBack={handleBackToVersions}
              />
            </div>
          ) : viewMode === 'versions' ? (
            /* Version Manager */
            <div className="container mx-auto px-6 py-8">
              <VersionManager
                paperId={selectedPaperId}
                onCompare={handleCompareVersions}
                onBeforeAfter={handleBeforeAfter}
              />
            </div>
          ) : viewMode === 'history' ? (
            /* Analysis History */
            <div className="container mx-auto px-6 py-8">
              <AnalysisHistory
                paperId={selectedPaperId}
                onOpenRun={handleOpenHistoricalRun}
              />
            </div>
          ) : viewMode === 'report' ? (
            /* Research Report */
            <div className="container mx-auto px-6 py-8">
              <ResearchReport
                paperId={selectedPaperId}
              />
            </div>
          ) : (
            /* Analysis View */
            <div className="container mx-auto px-6 py-8">
              <AnalysisPanel data={analysisData} paperId={selectedPaperId} />
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

export default App
