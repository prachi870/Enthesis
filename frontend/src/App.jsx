import { useState } from 'react'
import Scene3D from './components/Scene3D'
import ResearchDashboard from './components/ResearchDashboard'
import AnalysisPanel from './components/AnalysisPanel'
import { ArrowLeft, Sparkles } from 'lucide-react'
import { getResults } from './utils/api'

function App() {
  const [selectedPaperId, setSelectedPaperId] = useState(null)
  const [analysisData, setAnalysisData] = useState(null)

  const handlePaperSelect = async (paperId) => {
    setSelectedPaperId(paperId)
    
    // Load analysis data
    try {
      const data = await getResults(paperId)
      setAnalysisData(data)
      
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
              <div className="flex items-center space-x-4">
                {selectedPaperId && (
                  <button
                    onClick={handleBackToDashboard}
                    className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors"
                  >
                    <ArrowLeft className="w-5 h-5 text-slate-400" />
                  </button>
                )}
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
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <div className="text-sm font-semibold text-blue-400">All Modules Active</div>
                  <div className="text-xs text-slate-400">5/5 Analysis Modules</div>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main>
          {!selectedPaperId ? (
            /* Dashboard View */
            <ResearchDashboard 
              onPaperSelect={handlePaperSelect}
              onUploadSuccess={handleUploadSuccess}
            />
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
