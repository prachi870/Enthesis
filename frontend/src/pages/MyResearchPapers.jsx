import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Download, FilePlus2, FileText, Loader2, Pencil, RefreshCw,
  Search, Sparkles,
} from 'lucide-react'
import { exportResearchPaper, listResearchPapers } from '../utils/researchPapers'

const downloadFormats = ['pdf', 'docx', 'latex', 'markdown']

function MyResearchPapers() {
  const navigate = useNavigate()
  const [papers, setPapers] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [downloading, setDownloading] = useState('')

  const loadPapers = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const response = await listResearchPapers()
      setPapers(Array.isArray(response) ? response : response.papers || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadPapers() }, [loadPapers])

  const handleDownload = async (paper, format) => {
    const id = paper.paper_id || paper.id
    setDownloading(`${id}:${format}`)
    setError('')
    try {
      const blob = await exportResearchPaper(id, format)
      if (!(blob instanceof Blob) || blob.size === 0) throw new Error('The server returned an empty export.')
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = `${(paper.title || 'research-paper').replace(/[^a-z0-9]+/gi, '-')}.${format === 'markdown' ? 'md' : format === 'latex' ? 'tex' : format}`
      document.body.appendChild(anchor)
      anchor.click()
      anchor.remove()
      URL.revokeObjectURL(url)
    } catch (err) {
      setError(`Download failed: ${err.message}`)
    } finally {
      setDownloading('')
    }
  }

  const filtered = papers.filter((paper) =>
    (paper.title || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <main className="min-h-screen px-4 py-8 text-slate-100 sm:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-indigo-600 p-3"><Sparkles /></div>
            <div>
              <h1 className="text-3xl font-bold">My Research Papers</h1>
              <p className="text-slate-400">Your saved paper drafts, generated versions, and analyses.</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Link to="/dashboard" className="rounded-lg border border-slate-700 px-4 py-2 hover:bg-slate-800">Dashboard</Link>
            <Link to="/research-papers/new" className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 font-semibold hover:bg-indigo-500"><FilePlus2 size={17} />New paper</Link>
          </div>
        </header>

        {error && <div role="alert" className="mb-5 flex items-center justify-between rounded-lg border border-red-500/40 bg-red-950/40 p-4 text-red-200">{error}<button onClick={loadPapers} className="font-semibold underline">Retry</button></div>}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-700 bg-slate-900/70 p-4">
          <label className="relative w-full max-w-md">
            <Search size={16} className="absolute left-3 top-3 text-slate-500" />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search your papers" className="w-full rounded-lg border border-slate-700 bg-slate-950 py-2 pl-9 pr-3 text-white" />
          </label>
          <button onClick={loadPapers} disabled={loading} className="inline-flex items-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-sm hover:bg-slate-800 disabled:opacity-50">
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />Refresh
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center p-16"><Loader2 className="animate-spin text-blue-400" /></div>
        ) : filtered.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-700 p-12 text-center">
            <FileText className="mx-auto mb-3 text-slate-500" size={36} />
            <p className="text-slate-300">{papers.length ? 'No papers match your search.' : 'No saved research papers yet.'}</p>
            {!papers.length && <Link to="/research-papers/new" className="mt-4 inline-block text-blue-300 hover:underline">Build your first paper</Link>}
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-700 bg-slate-900/70">
            <table className="w-full min-w-[850px] text-left">
              <thead className="bg-slate-800/70 text-sm text-slate-300">
                <tr>{['Title', 'Version', 'Updated', 'Format', 'Analysis', 'Findings', 'Actions'].map((heading) => <th key={heading} className="px-4 py-3 font-semibold">{heading}</th>)}</tr>
              </thead>
              <tbody>
                {filtered.map((paper) => {
                  const id = paper.paper_id || paper.id
                  const findings = paper.finding_count ?? paper.analysis_results?.finding_count ?? '—'
                  const analysisStatus = paper.analysis_status || (paper.analysis_results ? 'Complete' : 'Not analyzed')
                  return (
                    <tr key={`${id}:${paper.version}`} className="border-t border-slate-800 align-top">
                      <td className="max-w-xs px-4 py-4 font-medium text-white">{paper.title || 'Untitled draft'}<p className="mt-1 truncate text-xs text-slate-500">{id}</p></td>
                      <td className="px-4 py-4 text-slate-300">V{paper.version || 1}</td>
                      <td className="px-4 py-4 text-sm text-slate-400">{paper.updated_at || paper.created_at ? new Date(paper.updated_at || paper.created_at).toLocaleDateString() : '—'}</td>
                      <td className="px-4 py-4 text-slate-300">{paper.format || 'generic'}</td>
                      <td className="px-4 py-4 text-sm text-slate-300">{analysisStatus}</td>
                      <td className="px-4 py-4 text-slate-300">{findings}</td>
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap gap-2">
                          <Link to={`/research-papers/${id}/edit`} className="inline-flex items-center gap-1 rounded-md border border-slate-600 px-2 py-1.5 text-xs hover:bg-slate-800"><Pencil size={13} />View / Edit</Link>
                          <button onClick={() => navigate(`/research-papers/${id}/edit?analyze=1`)} className="rounded-md border border-blue-700 px-2 py-1.5 text-xs text-blue-200 hover:bg-blue-950">Analyze</button>
                          <select defaultValue="" aria-label={`Export ${paper.title || 'paper'}`} onChange={(event) => { if (event.target.value) handleDownload(paper, event.target.value); event.target.value = '' }} disabled={downloading.startsWith(`${id}:`)} className="max-w-28 rounded-md border border-slate-600 bg-slate-950 px-2 py-1.5 text-xs text-white">
                            <option value="">Download…</option>{downloadFormats.map((kind) => <option key={kind} value={kind}>{downloading === `${id}:${kind}` ? 'Preparing…' : kind.toUpperCase()}</option>)}
                          </select>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  )
}

export default MyResearchPapers
