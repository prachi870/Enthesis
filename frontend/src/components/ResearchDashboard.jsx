import { useState, useEffect } from 'react'
import { 
  FileText, Upload, Clock, CheckCircle2, XCircle, AlertTriangle, 
  TrendingUp, Activity, Zap, Search, Filter, Calendar, BarChart3
} from 'lucide-react'
import { getPapers, deletePaper } from '../utils/api'
import UploadZone from './UploadZone'

const ResearchDashboard = ({ onPaperSelect, onUploadSuccess }) => {
  const [papers, setPapers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showUpload, setShowUpload] = useState(false)
  const [filter, setFilter] = useState('all') // all, processing, completed, failed
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    loadPapers()
    // Refresh papers every 5 seconds
    const interval = setInterval(loadPapers, 5000)
    return () => clearInterval(interval)
  }, [])

  const loadPapers = async () => {
    try {
      const data = await getPapers()
      setPapers(data.papers || [])
    } catch (error) {
      console.error('Error loading papers:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (paperId, e) => {
    e.stopPropagation()
    if (!confirm('Delete this paper and its analysis?')) return
    
    try {
      await deletePaper(paperId)
      loadPapers()
    } catch (error) {
      alert('Failed to delete paper')
    }
  }

  const handleUploadSuccess = (data) => {
    setShowUpload(false)
    loadPapers()
    if (onUploadSuccess) onUploadSuccess(data)
  }

  // Calculate statistics from real data
  const stats = {
    total: papers.length,
    processing: papers.filter(p => {
      const states = Object.values(p.states || {})
      return states.some(s => s === 'running')
    }).length,
    completed: papers.filter(p => {
      const states = Object.values(p.states || {})
      return states.every(s => s === 'approved' || s === 'done') && !states.includes('running')
    }).length,
    failed: papers.filter(p => {
      const states = Object.values(p.states || {})
      return states.some(s => s === 'failed')
    }).length,
    totalFindings: papers.reduce((sum, p) => {
      const results = p.results || {}
      return sum + Object.values(results).reduce((moduleSum, moduleData) => {
        if (moduleData?.findings) {
          return moduleSum + moduleData.findings.length
        }
        return moduleSum
      }, 0)
    }, 0),
    totalIssues: papers.reduce((sum, p) => {
      const weaknesses = p.results?.weaknesses
      if (weaknesses?.findings) {
        return sum + weaknesses.findings.reduce((s, f) => s + (f.count || 0), 0)
      }
      return sum
    }, 0)
  }

  // Get paper status
  const getPaperStatus = (paper) => {
    if (!paper.started) return { label: 'Uploaded', color: 'slate', icon: FileText }
    
    const states = Object.values(paper.states || {})
    if (states.some(s => s === 'failed')) return { label: 'Failed', color: 'red', icon: XCircle }
    if (states.some(s => s === 'running')) return { label: 'Processing', color: 'blue', icon: Clock }
    
    const completed = states.filter(s => s === 'approved' || s === 'done').length
    const total = states.length
    
    if (completed === total) return { label: 'Completed', color: 'green', icon: CheckCircle2 }
    if (completed > 0) return { label: 'In Progress', color: 'yellow', icon: Activity }
    
    return { label: 'Waiting', color: 'slate', icon: Clock }
  }

  // Get module completion
  const getModuleProgress = (paper) => {
    const states = Object.values(paper.states || {})
    const completed = states.filter(s => s === 'approved' || s === 'done').length
    return { completed, total: states.length }
  }

  // Get findings count for a paper
  const getPaperFindings = (paper) => {
    const results = paper.results || {}
    return Object.values(results).reduce((sum, moduleData) => {
      if (moduleData?.findings) return sum + moduleData.findings.length
      return sum
    }, 0)
  }

  // Get issues count for a paper
  const getPaperIssues = (paper) => {
    const weaknesses = paper.results?.weaknesses
    if (weaknesses?.findings) {
      return weaknesses.findings.reduce((sum, f) => sum + (f.count || 0), 0)
    }
    return 0
  }

  // Filter papers
  const filteredPapers = papers.filter(paper => {
    // Search filter
    if (searchTerm && !paper.filename.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !paper.author?.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false
    }
    
    // Status filter
    if (filter === 'all') return true
    const status = getPaperStatus(paper).label
    if (filter === 'processing') return status === 'Processing' || status === 'In Progress'
    if (filter === 'completed') return status === 'Completed'
    if (filter === 'failed') return status === 'Failed'
    return true
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Research Dashboard</h1>
            <p className="text-slate-400">Track and manage your academic paper analyses</p>
          </div>
          <button
            onClick={() => setShowUpload(!showUpload)}
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl font-semibold hover:from-blue-600 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center space-x-2"
          >
            <Upload className="w-5 h-5" />
            <span>Upload Paper</span>
          </button>
        </div>

        {/* Upload Modal */}
        {showUpload && (
          <div className="bg-slate-900/70 backdrop-blur-lg rounded-xl border border-slate-700/50 p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold">Upload Research Paper</h3>
              <button 
                onClick={() => setShowUpload(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            <UploadZone onUploadSuccess={handleUploadSuccess} />
          </div>
        )}

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={FileText}
            label="Total Papers"
            value={stats.total}
            color="from-blue-500 to-cyan-600"
          />
          <StatCard
            icon={Activity}
            label="Processing"
            value={stats.processing}
            color="from-yellow-500 to-orange-600"
            pulse={stats.processing > 0}
          />
          <StatCard
            icon={TrendingUp}
            label="Total Findings"
            value={stats.totalFindings}
            color="from-green-500 to-emerald-600"
          />
          <StatCard
            icon={AlertTriangle}
            label="Issues Found"
            value={stats.totalIssues}
            color="from-red-500 to-pink-600"
          />
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="bg-slate-900/70 backdrop-blur-lg rounded-xl border border-green-500/30 p-6">
            <div className="flex items-center space-x-3">
              <CheckCircle2 className="w-8 h-8 text-green-400" />
              <div>
                <div className="text-3xl font-bold text-white">{stats.completed}</div>
                <div className="text-sm text-slate-400">Completed</div>
              </div>
            </div>
          </div>
          <div className="bg-slate-900/70 backdrop-blur-lg rounded-xl border border-blue-500/30 p-6">
            <div className="flex items-center space-x-3">
              <Clock className="w-8 h-8 text-blue-400" />
              <div>
                <div className="text-3xl font-bold text-white">{stats.processing}</div>
                <div className="text-sm text-slate-400">In Progress</div>
              </div>
            </div>
          </div>
          <div className="bg-slate-900/70 backdrop-blur-lg rounded-xl border border-red-500/30 p-6">
            <div className="flex items-center space-x-3">
              <XCircle className="w-8 h-8 text-red-400" />
              <div>
                <div className="text-3xl font-bold text-white">{stats.failed}</div>
                <div className="text-sm text-slate-400">Failed</div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center space-x-4">
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search papers by name or author..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-900/70 border border-slate-700 rounded-lg pl-10 pr-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
            />
          </div>
          <div className="flex items-center space-x-2 bg-slate-900/70 border border-slate-700 rounded-lg p-1">
            <FilterButton active={filter === 'all'} onClick={() => setFilter('all')}>All</FilterButton>
            <FilterButton active={filter === 'processing'} onClick={() => setFilter('processing')}>Processing</FilterButton>
            <FilterButton active={filter === 'completed'} onClick={() => setFilter('completed')}>Completed</FilterButton>
            <FilterButton active={filter === 'failed'} onClick={() => setFilter('failed')}>Failed</FilterButton>
          </div>
        </div>

        {/* Papers List */}
        <div className="bg-slate-900/70 backdrop-blur-lg rounded-xl border border-slate-700/50 shadow-xl">
          <div className="p-6 border-b border-slate-700/50">
            <h2 className="text-xl font-semibold">Recent Papers ({filteredPapers.length})</h2>
          </div>
          
          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto"></div>
              <p className="text-slate-400 mt-4">Loading papers...</p>
            </div>
          ) : filteredPapers.length === 0 ? (
            <div className="p-12 text-center">
              <FileText className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400">
                {searchTerm || filter !== 'all' ? 'No papers match your filters' : 'No papers uploaded yet'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-700/50">
              {filteredPapers.map(paper => {
                const status = getPaperStatus(paper)
                const progress = getModuleProgress(paper)
                const findings = getPaperFindings(paper)
                const issues = getPaperIssues(paper)
                const StatusIcon = status.icon

                return (
                  <div
                    key={paper.paper_id}
                    onClick={() => onPaperSelect(paper.paper_id)}
                    className="p-6 hover:bg-slate-800/50 cursor-pointer transition-all duration-200 group"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <FileText className="w-5 h-5 text-blue-400 flex-shrink-0" />
                          <h3 className="text-lg font-semibold text-white group-hover:text-blue-400 transition-colors">
                            {paper.filename}
                          </h3>
                          <div className={`px-3 py-1 rounded-full text-xs font-medium bg-${status.color}-500/20 text-${status.color}-300 border border-${status.color}-500/30 flex items-center space-x-1`}>
                            <StatusIcon className="w-3 h-3" />
                            <span>{status.label}</span>
                          </div>
                        </div>

                        <div className="flex items-center space-x-6 text-sm text-slate-400 mb-3">
                          {paper.author && (
                            <div className="flex items-center space-x-1">
                              <span>Author:</span>
                              <span className="text-slate-300">{paper.author}</span>
                            </div>
                          )}
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-4 h-4" />
                            <span>ID: {paper.paper_id}</span>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        {paper.started && (
                          <div className="mb-3">
                            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                              <span>Pipeline Progress</span>
                              <span>{progress.completed} / {progress.total} modules</span>
                            </div>
                            <div className="w-full bg-slate-700 rounded-full h-2">
                              <div
                                className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-500"
                                style={{ width: `${(progress.completed / progress.total) * 100}%` }}
                              />
                            </div>
                          </div>
                        )}

                        {/* Stats */}
                        <div className="flex items-center space-x-6">
                          {findings > 0 && (
                            <div className="flex items-center space-x-2 text-sm">
                              <Zap className="w-4 h-4 text-green-400" />
                              <span className="text-slate-300">{findings} findings</span>
                            </div>
                          )}
                          {issues > 0 && (
                            <div className="flex items-center space-x-2 text-sm">
                              <AlertTriangle className="w-4 h-4 text-orange-400" />
                              <span className="text-slate-300">{issues} issues</span>
                            </div>
                          )}
                          {progress.completed === progress.total && progress.total > 0 && (
                            <div className="flex items-center space-x-2 text-sm">
                              <BarChart3 className="w-4 h-4 text-blue-400" />
                              <span className="text-green-400">Ready for review</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={(e) => handleDelete(paper.paper_id, e)}
                        className="ml-4 p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all duration-200"
                      >
                        <XCircle className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const StatCard = ({ icon: Icon, label, value, color, pulse }) => (
  <div className={`bg-slate-900/70 backdrop-blur-lg rounded-xl border border-slate-700/50 p-6 shadow-xl ${pulse ? 'animate-pulse' : ''}`}>
    <div className="flex items-center justify-between">
      <div>
        <p className="text-slate-400 text-sm mb-1">{label}</p>
        <p className="text-3xl font-bold text-white">{value}</p>
      </div>
      <div className={`w-14 h-14 bg-gradient-to-br ${color} rounded-xl flex items-center justify-center`}>
        <Icon className="w-7 h-7 text-white" />
      </div>
    </div>
  </div>
)

const FilterButton = ({ active, onClick, children }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
      active 
        ? 'bg-blue-500 text-white' 
        : 'text-slate-400 hover:text-white hover:bg-slate-800'
    }`}
  >
    {children}
  </button>
)

export default ResearchDashboard
