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
    <div className="min-h-screen p-6 relative overflow-hidden">
      {/* Animated gradient orbs in background */}
      <div className="fixed top-20 right-20 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse-soft"></div>
      <div className="fixed bottom-20 left-20 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse-soft" style={{ animationDelay: '1s' }}></div>
      
      <div className="max-w-7xl mx-auto space-y-6 relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between animate-float-gentle">
          <div>
            <h1 className="text-5xl font-bold text-gradient mb-3">Research Dashboard</h1>
            <p className="text-slate-400 text-lg">Track and manage your academic paper analyses</p>
          </div>
          <button
            onClick={() => setShowUpload(!showUpload)}
            className="btn-primary flex items-center space-x-2 text-lg px-8 py-4"
          >
            <Upload className="w-6 h-6" />
            <span>Upload Paper</span>
          </button>
        </div>

        {/* Upload Modal */}
        {showUpload && (
          <div className="glass-card rounded-2xl p-8 shadow-2xl animate-float-gentle border-purple-500/30">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gradient">Upload Research Paper</h3>
              <button 
                onClick={() => setShowUpload(false)}
                className="text-slate-400 hover:text-white hover:bg-slate-800 p-2 rounded-lg transition-all"
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="glass-card rounded-2xl border-green-500/30 p-8 group hover:border-green-500/50 transition-all">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 gradient-bg-green rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                <CheckCircle2 className="w-9 h-9 text-white" />
              </div>
              <div>
                <div className="text-5xl font-bold text-glow-green">{stats.completed}</div>
                <div className="text-sm text-slate-400 font-medium mt-1">Completed</div>
              </div>
            </div>
          </div>
          <div className="glass-card rounded-2xl border-blue-500/30 p-8 group hover:border-blue-500/50 transition-all">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 gradient-bg-blue rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                <Clock className="w-9 h-9 text-white" />
              </div>
              <div>
                <div className="text-5xl font-bold text-glow-blue">{stats.processing}</div>
                <div className="text-sm text-slate-400 font-medium mt-1">In Progress</div>
              </div>
            </div>
          </div>
          <div className="glass-card rounded-2xl border-red-500/30 p-8 group hover:border-red-500/50 transition-all">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 gradient-bg-red rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                <XCircle className="w-9 h-9 text-white" />
              </div>
              <div>
                <div className="text-5xl font-bold text-red-400">{stats.failed}</div>
                <div className="text-sm text-slate-400 font-medium mt-1">Failed</div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center space-x-4">
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-purple-400 absolute left-4 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search papers by name or author..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-modern w-full pl-12 pr-4 py-4 text-lg"
            />
          </div>
          <div className="flex items-center space-x-2 glass-card rounded-xl p-2">
            <FilterButton active={filter === 'all'} onClick={() => setFilter('all')}>All</FilterButton>
            <FilterButton active={filter === 'processing'} onClick={() => setFilter('processing')}>Processing</FilterButton>
            <FilterButton active={filter === 'completed'} onClick={() => setFilter('completed')}>Completed</FilterButton>
            <FilterButton active={filter === 'failed'} onClick={() => setFilter('failed')}>Failed</FilterButton>
          </div>
        </div>

        {/* Papers List */}
        <div className="glass-card rounded-2xl shadow-2xl border-purple-500/20">
          <div className="p-8 border-b border-slate-700/50">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gradient">Recent Papers</h2>
              <span className="badge badge-purple text-lg px-4 py-2">{filteredPapers.length} papers</span>
            </div>
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
  <div className={`stat-card group cursor-pointer ${pulse ? 'pulse-glow' : ''}`}>
    <div className="flex items-center justify-between">
      <div>
        <p className="text-slate-400 text-sm mb-1 font-medium">{label}</p>
        <p className="text-4xl font-bold text-white mb-1">{value}</p>
        <div className="h-1 w-16 rounded-full bg-gradient-to-r ${color} opacity-75"></div>
      </div>
      <div className={`w-16 h-16 bg-gradient-to-br ${color} rounded-2xl flex items-center justify-center shadow-lg transform group-hover:scale-110 group-hover:rotate-6 transition-all duration-300`}>
        <Icon className="w-8 h-8 text-white" />
      </div>
    </div>
    <div className="absolute inset-0 rounded-2xl bg-gradient-to-br ${color} opacity-0 group-hover:opacity-5 transition-opacity duration-300"></div>
  </div>
)

const FilterButton = ({ active, onClick, children }) => (
  <button
    onClick={onClick}
    className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 ${
      active 
        ? 'gradient-bg-purple text-white shadow-lg' 
        : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
    }`}
  >
    {children}
  </button>
)

export default ResearchDashboard
