import { useState } from 'react'
import Scene3D from './components/Scene3D'
import UploadZone from './components/UploadZone'
import AnalysisPanel from './components/AnalysisPanel'
import ModulesView from './components/ModulesView'
import { FileText, Sparkles } from 'lucide-react'
import { startAnalysis, getResults } from './utils/api'

function App() {
  const [paperId, setPaperId] = useState(null)
  const [analysisData, setAnalysisData] = useState(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  const handleUploadSuccess = (data) => {
    setPaperId(data.paper_id)
    
    // Analysis already started on upload, so start polling immediately
    setIsAnalyzing(true)
    pollResults(data.paper_id)
  }

  const handleStartAnalysis = async () => {
    if (!paperId) return
    
    setIsAnalyzing(true)
    try {
      // Check if already started
      const currentData = await getResults(paperId)
      
      // If already started, just poll
      if (currentData.states && Object.values(currentData.states).some(s => s !== 'pending')) {
        setAnalysisData(currentData)
        pollResults(paperId)
        return
      }
      
      // Otherwise start pipeline
      const data = await startAnalysis(paperId)
      setAnalysisData(data)
      pollResults(paperId)
    } catch (error) {
      console.error('Error starting analysis:', error)
      
      // If error is "already started", just start polling
      if (error.message && error.message.includes('already started')) {
        pollResults(paperId)
      } else {
        alert(error.message || 'Failed to start analysis')
        setIsAnalyzing(false)
      }
    }
  }

  const pollResults = async (id) => {
    const interval = setInterval(async () => {
      try {
        const data = await getResults(id)
        setAnalysisData(data)
        
        // Check if all stages complete
        const allComplete = Object.values(data.states || {}).every(
          state => state === 'done' || state === 'error'
        )
        
        if (allComplete) {
          clearInterval(interval)
          setIsAnalyzing(false)
        }
      } catch (error) {
        console.error('Error polling results:', error)
        clearInterval(interval)
        setIsAnalyzing(false)
      }
    }, 2000)
  }

  return (
    <div className="relative w-full min-h-screen overflow-hidden">
      {/* 3D Background Scene */}
      <div className="fixed inset-0 z-0">
        <Scene3D />
      </div>

      {/* Main Content */}
      <div className="relative z-10">
        {/* Header */}
        <header className="bg-gradient-to-r from-slate-900/80 to-slate-800/80 backdrop-blur-lg border-b border-slate-700/50">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                    Enthesis
                  </h1>
                  <p className="text-xs text-slate-400">AI Research Assistant</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <div className="text-sm font-semibold text-blue-400">Phase 2 Complete</div>
                  <div className="text-xs text-slate-400">4/5 Modules Active</div>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="container mx-auto px-6 py-8">
          {!paperId ? (
            /* Upload Screen */
            <div className="flex flex-col items-center justify-center min-h-[70vh]">
              <div className="text-center mb-8">
                <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                  Analyze Your Research Paper
                </h2>
                <p className="text-lg text-slate-300 max-w-2xl mx-auto">
                  Upload your research paper draft and get AI-powered insights on related work, 
                  novelty, weaknesses, and clarity
                </p>
              </div>
              
              <UploadZone onUploadSuccess={handleUploadSuccess} />
              
              <div className="mt-12">
                <ModulesView />
              </div>
            </div>
          ) : (
            /* Analysis Screen */
            <div className="space-y-6">
              <div className="bg-slate-900/70 backdrop-blur-lg rounded-2xl border border-slate-700/50 p-6 shadow-2xl">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <FileText className="w-6 h-6 text-blue-400" />
                    <div>
                      <h3 className="text-xl font-semibold">Paper Analysis</h3>
                      <p className="text-sm text-slate-400">ID: {paperId}</p>
                    </div>
                  </div>
                  
                  {!isAnalyzing && !analysisData && (
                    <button
                      onClick={handleStartAnalysis}
                      className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg font-semibold hover:from-blue-600 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                    >
                      Start Analysis
                    </button>
                  )}
                  
                  {isAnalyzing && (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-400"></div>
                      <span className="text-blue-400 font-semibold">Analyzing...</span>
                    </div>
                  )}
                </div>
              </div>
              
              {analysisData && (
                <AnalysisPanel data={analysisData} paperId={paperId} />
              )}
            </div>
          )}
        </main>

        {/* Footer */}
        <footer className="mt-16 bg-slate-900/50 backdrop-blur-lg border-t border-slate-700/50 py-6">
          <div className="container mx-auto px-6 text-center text-slate-400 text-sm">
            <p>Enthesis Research Assistant • 4 Modules Active • Powered by SciBERT, SPECTER & DeBERTa</p>
            <p className="mt-2">🎯 Targets Achieved: Module 1 (110%), Module 2 (102%), Module 5 (111%)</p>
          </div>
        </footer>
      </div>
    </div>
  )
}

export default App
