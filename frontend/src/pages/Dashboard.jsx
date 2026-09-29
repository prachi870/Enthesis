import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Sparkles, FileText, TrendingUp, Clock, CheckCircle2, XCircle, LogOut, PlusCircle, Search, Filter } from 'lucide-react'
import Scene3D from '../components/Scene3D'
import { getPapers, getUser, logout, isAuthenticated } from '../utils/api'

function Dashboard() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [papers, setPapers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')

  useEffect(() => {
    // Check authentication
    if (!isAuthenticated()) {
      navigate('/login')
      return
    }
    
    const userData = getUser()
    setUser(userData)

    // Fetch papers from backend
    fetchPapers()
  }, [navigate])

  const fetchPapers = async () => {
    try {
      const data = await getPapers()
      
      // Transform backend data to frontend format
      const transformedPapers = data.papers.map(paper => {
        // Calculate scores from results (mock for now since results structure may vary)
        const scores = {
          related_work: paper.results?.related_work ? 0.75 : null,
          novelty: paper.results?.novelty ? 0.80 : null,
          weaknesses: paper.results?.weaknesses ? 0.65 : null,
          clarity: paper.results?.clarity ? 0.85 : null
        }
        
        // Determine status
        let status = 'pending'
        const states = paper.states || {}
        const allDone = Object.values(states).every(s => s === 'done')
        const anyError = Object.values(states).some(s => s === 'error')
        const anyRunning = Object.values(states).some(s => s === 'running')
        
        if (allDone) status = 'completed'
        else if (anyError) status = 'failed'
        else if (anyRunning) status = 'processing'
        
        return {
          paper_id: paper.paper_id,
          filename: paper.filename,
          uploaded_at: paper.started || new Date().toISOString(),
          status,
          scores
        }
      })
      
      setPapers(transformedPapers)
    } catch (error) {
      console.error('Error fetching papers:', error)
      // If auth error, will be handled by api.js
      setPapers([])
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    logout()
  }

  const getAverageScore = (scores) => {
    const validScores = Object.values(scores).filter(s => s !== null)
    if (validScores.length === 0) return 0
    return validScores.reduce((a, b) => a + b, 0) / validScores.length
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'text-green-400 bg-green-500/10 border-green-500/30'
      case 'processing': return 'text-blue-400 bg-blue-500/10 border-blue-500/30'
      case 'failed': return 'text-red-400 bg-red-500/10 border-red-500/30'
      default: return 'text-slate-400 bg-slate-500/10 border-slate-500/30'
    }
  }

  const getScoreColor = (score) => {
    if (score >= 0.8) return 'text-green-400'
    if (score >= 0.6) return 'text-yellow-400'
    return 'text-orange-400'
  }

  const filteredPapers = papers
    .filter(paper => {
      if (filterStatus !== 'all' && paper.status !== filterStatus) return false
      if (searchTerm && !paper.filename.toLowerCase().includes(searchTerm.toLowerCase())) return false
      return true
    })

  return (
    <div className="min-h-screen">
      {/* 3D Background - More Subtle */}
      <div className="fixed inset-0 z-0 opacity-20">
        <Scene3D />
      </div>

      {/* Main Content */}
      <div className="relative z-10">
        {/* Header */}
        <header className="bg-slate-900/80 backdrop-blur-xl border-b border-slate-700/50 sticky top-0 z-50">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">Enthesis Dashboard</h1>
                  <p className="text-xs text-slate-400">AI Research Assistant</p>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <Link
                  to="/analyze"
                  className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center space-x-2"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>New Analysis</span>
                </Link>
                
                <div className="flex items-center space-x-3 px-4 py-2 bg-slate-800/50 rounded-lg border border-slate-700/50">
                  <div className="text-right">
                    <div className="text-sm font-semibold text-white">{user?.name || 'User'}</div>
                    <div className="text-xs text-slate-400">{user?.email}</div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors"
                    title="Logout"
                  >
                    <LogOut className="w-5 h-5 text-slate-400 hover:text-white" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Stats Overview */}
        <div className="container mx-auto px-6 py-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-slate-800/70 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6 shadow-xl">
              <div className="flex items-center justify-between mb-2">
                <FileText className="w-8 h-8 text-blue-400" />
                <TrendingUp className="w-5 h-5 text-green-400" />
              </div>
              <div className="text-3xl font-bold text-white mb-1">{papers.length}</div>
              <div className="text-sm text-slate-400">Total Papers</div>
            </div>

            <div className="bg-slate-800/70 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6 shadow-xl">
              <div className="flex items-center justify-between mb-2">
                <CheckCircle2 className="w-8 h-8 text-green-400" />
              </div>
              <div className="text-3xl font-bold text-white mb-1">
                {papers.filter(p => p.status === 'completed').length}
              </div>
              <div className="text-sm text-slate-400">Completed</div>
            </div>

            <div className="bg-slate-800/70 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6 shadow-xl">
              <div className="flex items-center justify-between mb-2">
                <Clock className="w-8 h-8 text-blue-400" />
              </div>
              <div className="text-3xl font-bold text-white mb-1">
                {papers.filter(p => p.status === 'processing').length}
              </div>
              <div className="text-sm text-slate-400">Processing</div>
            </div>

            <div className="bg-slate-800/70 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6 shadow-xl">
              <div className="flex items-center justify-between mb-2">
                <TrendingUp className="w-8 h-8 text-purple-400" />
              </div>
              <div className="text-3xl font-bold text-white mb-1">
                {papers.length > 0 ? (getAverageScore(
                  papers.reduce((acc, p) => {
                    Object.entries(p.scores).forEach(([k, v]) => {
                      if (v !== null) acc[k] = (acc[k] || 0) + v
                    })
                    return acc
                  }, {})
                ) * 100 / papers.length).toFixed(0) : 0}%
              </div>
              <div className="text-sm text-slate-400">Avg Score</div>
            </div>
          </div>

          {/* Papers List */}
          <div className="bg-slate-800/70 backdrop-blur-xl border border-slate-700/50 rounded-xl shadow-xl">
            {/* Toolbar */}
            <div className="p-6 border-b border-slate-700/50">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0">
                <h2 className="text-2xl font-bold text-white">Your Research Papers</h2>
                
                <div className="flex items-center space-x-3 w-full sm:w-auto">
                  {/* Search */}
                  <div className="relative flex-1 sm:flex-initial">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search papers..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2 bg-slate-900/50 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-slate-500 text-sm w-full sm:w-64"
                    />
                  </div>

                  {/* Filter */}
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-4 py-2 bg-slate-900/50 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white text-sm"
                  >
                    <option value="all">All Status</option>
                    <option value="completed">Completed</option>
                    <option value="processing">Processing</option>
                    <option value="failed">Failed</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Papers Table */}
            <div className="overflow-x-auto">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400"></div>
                </div>
              ) : filteredPapers.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-400 text-lg">No papers found</p>
                  <Link
                    to="/analyze"
                    className="inline-block mt-4 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all"
                  >
                    Upload Your First Paper
                  </Link>
                </div>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-700/50">
                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Paper</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Status</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Related Work</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Novelty</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Weaknesses</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Clarity</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Avg Score</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Date</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPapers.map((paper) => {
                      const avgScore = getAverageScore(paper.scores)
                      return (
                        <tr key={paper.paper_id} className="border-b border-slate-700/30 hover:bg-slate-700/20 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center space-x-3">
                              <FileText className="w-5 h-5 text-blue-400 flex-shrink-0" />
                              <div className="min-w-0">
                                <div className="font-medium text-white truncate">{paper.filename}</div>
                                <div className="text-xs text-slate-400">ID: {paper.paper_id}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(paper.status)} capitalize`}>
                              {paper.status}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`font-semibold ${paper.scores.related_work ? getScoreColor(paper.scores.related_work) : 'text-slate-500'}`}>
                              {paper.scores.related_work ? (paper.scores.related_work * 100).toFixed(0) + '%' : '-'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`font-semibold ${paper.scores.novelty ? getScoreColor(paper.scores.novelty) : 'text-slate-500'}`}>
                              {paper.scores.novelty ? (paper.scores.novelty * 100).toFixed(0) + '%' : '-'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`font-semibold ${paper.scores.weaknesses ? getScoreColor(paper.scores.weaknesses) : 'text-slate-500'}`}>
                              {paper.scores.weaknesses ? (paper.scores.weaknesses * 100).toFixed(0) + '%' : '-'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`font-semibold ${paper.scores.clarity ? getScoreColor(paper.scores.clarity) : 'text-slate-500'}`}>
                              {paper.scores.clarity ? (paper.scores.clarity * 100).toFixed(0) + '%' : '-'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center space-x-2">
                              <div className="text-lg font-bold text-white">
                                {avgScore > 0 ? (avgScore * 100).toFixed(0) + '%' : '-'}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-slate-400 text-sm whitespace-nowrap">
                            {new Date(paper.uploaded_at).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4">
                            <Link
                              to={`/paper/${paper.paper_id}`}
                              className="px-3 py-1.5 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg text-sm font-medium transition-colors"
                            >
                              View Details
                            </Link>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
