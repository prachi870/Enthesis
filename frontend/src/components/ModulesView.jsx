import { Brain, Search, AlertTriangle, FileText, TrendingUp } from 'lucide-react'

const ModuleCard = ({ icon: Icon, title, description, status, color, metrics }) => {
  return (
    <div className={`group bg-slate-900/70 backdrop-blur-lg rounded-xl border border-slate-700/50 p-6 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 hover:border-${color}-500/50`}>
      <div className="flex items-start space-x-4">
        <div className={`w-14 h-14 bg-gradient-to-br ${color} rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300`}>
          <Icon className="w-7 h-7 text-white" />
        </div>
        
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold">{title}</h3>
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
              status === 'Active' 
                ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                : 'bg-slate-500/20 text-slate-400 border border-slate-500/30'
            }`}>
              {status}
            </span>
          </div>
          
          <p className="text-sm text-slate-400 mb-4">{description}</p>
          
          {metrics && (
            <div className="grid grid-cols-2 gap-3">
              {metrics.map((metric, idx) => (
                <div key={idx} className="bg-slate-800/50 rounded-lg p-2">
                  <div className="text-xs text-slate-500">{metric.label}</div>
                  <div className={`text-sm font-semibold ${metric.color || 'text-slate-300'}`}>
                    {metric.value}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const ModulesView = () => {
  const modules = [
    {
      icon: Search,
      title: 'Related Work Detection',
      description: 'Extracts key entities and retrieves similar papers from academic databases using SciBERT and SPECTER models.',
      status: 'Active',
      color: 'from-blue-500 to-cyan-600',
      metrics: [
        { label: 'Entity F1 Score', value: '0.68', color: 'text-blue-400' },
        { label: 'Retrieval Recall@5', value: '0.55', color: 'text-green-400' }
      ]
    },
    {
      icon: Brain,
      title: 'Novelty Analysis',
      description: 'Identifies novel claims and contributions in your research using advanced NLI models (DeBERTa).',
      status: 'Active',
      color: 'from-green-500 to-emerald-600',
      metrics: [
        { label: 'Accuracy', value: '71.0%', color: 'text-green-400' },
        { label: 'F1 Score', value: '0.71', color: 'text-emerald-400' }
      ]
    },
    {
      icon: AlertTriangle,
      title: 'Weaknesses Detection',
      description: 'Analyzes potential weaknesses, limitations, and areas for improvement using multi-label BERT classification.',
      status: 'Active',
      color: 'from-orange-500 to-red-600',
      metrics: [
        { label: 'Precision', value: '0.61', color: 'text-orange-400' },
        { label: 'Recall', value: '0.34', color: 'text-red-400' }
      ]
    },
    {
      icon: FileText,
      title: 'Clarity Assessment',
      description: 'Evaluates writing quality, readability, and structure using style-based regression analysis.',
      status: 'Active',
      color: 'from-purple-500 to-pink-600',
      metrics: [
        { label: 'Correlation', value: '0.67', color: 'text-purple-400' },
        { label: 'Spearman ρ', value: '0.79', color: 'text-pink-400' }
      ]
    },
    {
      icon: TrendingUp,
      title: 'Reviewer Feedback',
      description: 'Predicts reviewer scores and generates constructive feedback (Coming Soon - Phase 3).',
      status: 'Planned',
      color: 'from-indigo-500 to-blue-600',
      metrics: null
    }
  ]

  return (
    <div className="w-full max-w-7xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-2">AI-Powered Analysis Modules</h2>
        <p className="text-slate-400">
          Four specialized modules trained on academic datasets to analyze your research
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
        {modules.map((module, idx) => (
          <ModuleCard key={idx} {...module} />
        ))}
      </div>

      {/* Performance Summary */}
      <div className="mt-8 bg-gradient-to-r from-slate-900/70 to-slate-800/70 backdrop-blur-lg rounded-xl border border-slate-700/50 p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold mb-1">System Performance</h3>
            <p className="text-sm text-slate-400">Phase 2 targets achieved for 3 out of 4 active modules</p>
          </div>
          <div className="flex items-center space-x-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">3/4</div>
              <div className="text-xs text-slate-400">Targets Met</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">80%</div>
              <div className="text-xs text-slate-400">Phase 2 Complete</div>
            </div>
          </div>
        </div>
        
        <div className="mt-4 grid grid-cols-4 gap-4">
          <div className="text-center p-3 bg-slate-800/50 rounded-lg">
            <div className="text-lg font-semibold text-green-400">110%</div>
            <div className="text-xs text-slate-400">Module 1</div>
          </div>
          <div className="text-center p-3 bg-slate-800/50 rounded-lg">
            <div className="text-lg font-semibold text-green-400">102%</div>
            <div className="text-xs text-slate-400">Module 2</div>
          </div>
          <div className="text-center p-3 bg-slate-800/50 rounded-lg">
            <div className="text-lg font-semibold text-orange-400">87%</div>
            <div className="text-xs text-slate-400">Module 3</div>
          </div>
          <div className="text-center p-3 bg-slate-800/50 rounded-lg">
            <div className="text-lg font-semibold text-green-400">111%</div>
            <div className="text-xs text-slate-400">Module 5</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ModulesView
