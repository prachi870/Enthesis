import { useState, useEffect } from 'react'
import ResearchHealthOverview from './ResearchHealthOverview'
import PipelineManager from './PipelineManager'
import DetailedFindings from './DetailedFindings'
import ResearchLandscape from './ResearchLandscape'
import { FileText, Network } from 'lucide-react'

const AnalysisPanel = ({ data, paperId }) => {
  const [fullData, setFullData] = useState(data)
  const [selectedModule, setSelectedModule] = useState(null)
  const [showLandscape, setShowLandscape] = useState({})

  useEffect(() => {
    setFullData(data)
  }, [data])

  const modules = [
    {
      key: 'related_work',
      title: 'Related Work Detection',
      results: fullData?.results?.related_work
    },
    {
      key: 'novelty',
      title: 'Novelty Analysis',
      results: fullData?.results?.novelty
    },
    {
      key: 'weaknesses',
      title: 'Weaknesses Detection',
      results: fullData?.results?.weaknesses
    },
    {
      key: 'clarity',
      title: 'Clarity Assessment',
      results: fullData?.results?.clarity
    },
    {
      key: 'reviewer_feedback',
      title: 'Reviewer-Style Feedback',
      results: fullData?.results?.reviewer_feedback
    }
  ]

  // Get status for each module
  const getModuleStatus = (key) => {
    return fullData?.states?.[key] || 'pending'
  }

  // Check if we have any completed modules for health overview
  const hasCompletedModules = modules.some(m => 
    getModuleStatus(m.key) === 'done' || getModuleStatus(m.key) === 'approved'
  )

  // Handle navigation from health overview to specific module
  const handleNavigateToModule = (moduleId) => {
    setSelectedModule(moduleId)
    // Scroll to the module
    const element = document.getElementById(`module-${moduleId}`)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  return (
    <div className="space-y-8">
      {/* Research Health Overview - Show after first module completes */}
      {hasCompletedModules && (
        <ResearchHealthOverview 
          analysisData={fullData}
          onNavigateToModule={handleNavigateToModule}
        />
      )}

      {/* Pipeline Manager - Staged Approval Workflow */}
      <PipelineManager 
        paperId={paperId}
        analysisData={fullData}
        onUpdate={() => {
          // Trigger a refresh from parent component
          window.location.reload()
        }}
      />

      {/* Detailed Module Results */}
      {modules.map(module => {
        const status = getModuleStatus(module.key)
        // Only show detailed results if module is done or approved
        if (status !== 'done' && status !== 'approved') return null
        
        return (
          <div 
            key={module.key} 
            id={`module-${module.key}`}
            className={`bg-slate-900/50 backdrop-blur-lg rounded-xl border shadow-xl transition-all duration-300 ${
              selectedModule === module.key 
                ? 'border-blue-500 ring-2 ring-blue-500/50' 
                : 'border-slate-700/50'
            } p-6`}
          >
            {/* Add tab switcher for Related Work module */}
            {module.key === 'related_work' && (
              <div className="flex gap-4 mb-6 border-b border-slate-700 pb-4">
                <button
                  onClick={() => setShowLandscape({ ...showLandscape, [module.key]: false })}
                  className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                    !showLandscape[module.key]
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  <FileText className="w-4 h-4 inline mr-2" />
                  Detailed Findings
                </button>
                <button
                  onClick={() => setShowLandscape({ ...showLandscape, [module.key]: true })}
                  className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                    showLandscape[module.key]
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  <Network className="w-4 h-4 inline mr-2" />
                  Research Landscape
                </button>
              </div>
            )}

            {/* Show either Landscape or Detailed Findings based on tab */}
            {module.key === 'related_work' && showLandscape[module.key] ? (
              <ResearchLandscape 
                moduleData={module.results}
                studentPaper={fullData?.paper}
              />
            ) : (
              <DetailedFindings
                moduleKey={module.key}
                moduleData={module.results}
                moduleName={module.title}
              />
            )}
          </div>
        )
      })}

      {/* Download Report Button */}
      {Object.values(fullData?.states || {}).every(s => s === 'approved' || s === 'done' || s === 'failed') && (
        <div className="flex justify-center mt-8">
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
