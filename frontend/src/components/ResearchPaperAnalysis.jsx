import { useEffect, useMemo, useState } from 'react'
import {
  AlertCircle, Check, Download, FileText, Loader2, Plus, RefreshCw, Search,
} from 'lucide-react'
import {
  createResearchPaperAction,
  exportResearchPaperAnalysisReport,
  generateResearchPaperAnalysisReport,
  listResearchPaperActions,
  retryResearchPaperAnalysisModule,
  updateResearchPaperAction,
} from '../utils/researchPapers'

const MODULES = [
  ['related_work', 'Related Work'],
  ['novelty', 'Novelty Investigation'],
  ['weaknesses', 'Weakness Detection'],
  ['clarity', 'Clarity Check'],
  ['reviewer_feedback', 'AI-generated Reviewer-Style Feedback'],
]
const STATUS_LABELS = {
  pending: 'Pending',
  running: 'Running',
  completed: 'Completed',
  failed: 'Failed',
}
const ACTION_STATUSES = ['not_started', 'in_progress', 'reviewed', 'resolved']
const pretty = (value) => String(value || '').replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())

function ResearchPaperAnalysis({
  paperId, analysis, content, title, authors, institution, version, onReanalyze, onAnalysisUpdate,
}) {
  const [selectedFinding, setSelectedFinding] = useState(null)
  const [activeSection, setActiveSection] = useState('')
  const [search, setSearch] = useState('')
  const [moduleFilter, setModuleFilter] = useState('all')
  const [actions, setActions] = useState([])
  const [actionsError, setActionsError] = useState('')
  const [report, setReport] = useState(null)
  const [reportError, setReportError] = useState('')
  const [generatingReport, setGeneratingReport] = useState(false)
  const [reportExport, setReportExport] = useState({ format: '', status: '', error: '' })

  const findings = analysis?.findings || []
  const spans = analysis?.section_spans || {}
  const results = analysis?.results || {}
  const paperSections = useMemo(
    () => Object.entries(content || {}).filter(([key, value]) =>
      key !== 'missing_information' && typeof value === 'string'
    ),
    [content]
  )
  const visibleSections = paperSections.filter(([key, value]) =>
    `${pretty(key)} ${value}`.toLowerCase().includes(search.toLowerCase())
  )
  const visibleFindings = findings.filter((finding) =>
    (moduleFilter === 'all' || finding.module === moduleFilter)
    && `${finding.title} ${finding.description} ${finding.evidence_text || ''}`.toLowerCase().includes(search.toLowerCase())
  )
  const findingGroups = useMemo(() => {
    const groups = new Map()
    visibleFindings.forEach((finding) => {
      const groupName = finding.module === 'reviewer_feedback' || finding.module === 'weaknesses'
        ? `${finding.module}:${finding.category}`
        : finding.module
      groups.set(groupName, [...(groups.get(groupName) || []), finding])
    })
    return [...groups.entries()]
  }, [visibleFindings])
  const sectionsForFinding = (finding) => {
    const label = finding?.affected_section?.toLowerCase()
    return paperSections.find(([key]) => key === label?.replaceAll(' ', '_'))
      || paperSections.find(([key]) => spans[key]?.heading?.toLowerCase() === label)
  }

  useEffect(() => {
    if (!analysis?.analysis_run_id || !paperId) {
      setActions([])
      return
    }
    let cancelled = false
    listResearchPaperActions(paperId, analysis.analysis_run_id)
      .then((data) => { if (!cancelled) setActions(data.actions || []) })
      .catch((error) => { if (!cancelled) setActionsError(error.message) })
    return () => { cancelled = true }
  }, [paperId, analysis?.analysis_run_id])

  const addAction = async (finding) => {
    if (!analysis?.analysis_run_id) return
    setActionsError('')
    try {
      const created = await createResearchPaperAction(paperId, analysis.analysis_run_id, finding.id)
      setActions((previous) => previous.some((item) => item.action_id === created.action_id)
        ? previous
        : [...previous, created])
    } catch (error) {
      setActionsError(error.message)
    }
  }

  const changeActionStatus = async (action, status) => {
    setActionsError('')
    try {
      const updated = await updateResearchPaperAction(
        paperId, analysis.analysis_run_id, action.action_id, status
      )
      setActions((previous) => previous.map((item) =>
        item.action_id === updated.action_id ? updated : item
      ))
    } catch (error) {
      setActionsError(error.message)
    }
  }

  const createReport = async () => {
    setGeneratingReport(true)
    setReportError('')
    try {
      setReport(await generateResearchPaperAnalysisReport(paperId, analysis.analysis_run_id))
    } catch (error) {
      setReportError(error.message)
    } finally {
      setGeneratingReport(false)
    }
  }

  const downloadReport = async (format) => {
    setReportExport({ format, status: 'Preparing', error: '' })
    try {
      const blob = await exportResearchPaperAnalysisReport(
        paperId, analysis.analysis_run_id, format
      )
      if (!(blob instanceof Blob) || blob.size === 0) {
        throw new Error('The server returned an empty report file.')
      }
      const safeTitle = (title || 'research-analysis-report')
        .replace(/[^a-z0-9]+/gi, '-')
        .replace(/^-|-$/g, '') || 'research-analysis-report'
      const extension = format === 'markdown' ? 'md' : format
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = `${safeTitle}-v${report?.version ?? analysis?.version ?? 'unknown'}-analysis.${extension}`
      document.body.appendChild(anchor)
      anchor.click()
      anchor.remove()
      window.setTimeout(() => URL.revokeObjectURL(url), 1000)
      setReportExport({ format, status: 'Download started', error: '' })
    } catch (error) {
      setReportExport({ format, status: 'Error', error: error.message })
    }
  }

  const paperSection = selectedFinding && sectionsForFinding(selectedFinding)
  const sectionKey = paperSection?.[0] || activeSection
  const sectionText = paperSection?.[1] || content?.[activeSection] || ''
  const selectedEvidence = selectedFinding?.evidence
  const absoluteStart = selectedEvidence?.start
  const sectionStart = spans[sectionKey]?.start
  let highlightStart = Number.isInteger(absoluteStart) && Number.isInteger(sectionStart)
    ? absoluteStart - sectionStart
    : -1
  if (highlightStart < 0 && selectedFinding?.evidence_text) {
    highlightStart = sectionText.indexOf(selectedFinding.evidence_text)
  }
  const highlightEnd = highlightStart >= 0
    ? highlightStart + (selectedEvidence?.text || selectedFinding?.evidence_text || '').length
    : -1
  const searchHighlightStart = !selectedFinding && search
    ? sectionText.toLowerCase().indexOf(search.toLowerCase())
    : -1
  const searchHighlightEnd = searchHighlightStart >= 0
    ? searchHighlightStart + search.length
    : -1

  return (
    <section className="mt-8 space-y-5" aria-label="Research paper analysis workspace">
      <div className="rounded-2xl border border-indigo-500/30 bg-indigo-950/20 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-indigo-300">Research analysis workspace</p>
            <h2 className="mt-1 text-xl font-bold">{title || 'Research paper'} · V{analysis?.version ?? version ?? '—'}</h2>
            <p className="mt-1 text-sm text-slate-400">
              {analysis?.analysis_date ? new Date(analysis.analysis_date).toLocaleString() : 'Analysis is being prepared'}
              {' · '}Status: {pretty(analysis?.analysis_status)}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={onReanalyze} disabled={analysis?.analysis_status === 'running'} className="inline-flex items-center gap-2 rounded-lg border border-indigo-400/50 px-3 py-2 text-sm hover:bg-indigo-900/60 disabled:opacity-50">
              <RefreshCw size={15} /> Re-analyze paper
            </button>
            <button onClick={createReport} disabled={generatingReport || analysis?.analysis_status === 'running'} className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold hover:bg-indigo-500 disabled:opacity-50">
              {generatingReport ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
              Generate final research report
            </button>
          </div>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ['Total findings', analysis?.finding_count ?? findings.length],
            ['Require investigation', analysis?.findings_requiring_investigation ?? findings.length],
            ['Evidence passages', analysis?.evidence_count ?? 0],
            ['Modules completed', MODULES.filter(([key]) => analysis?.modules?.[key]?.status === 'completed').length],
          ].map(([label, value]) => (
            <div key={label} className="rounded-xl border border-slate-700 bg-slate-950/60 p-3">
              <p className="text-sm text-slate-400">{label}</p><p className="mt-1 text-xl font-bold">{value}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 grid gap-2 md:grid-cols-2 xl:grid-cols-5">
          {MODULES.map(([key, label]) => {
            const module = analysis?.modules?.[key] || { status: 'pending' }
            const result = results[key]
            const unavailable = result?.status === 'not_evaluated'
            return (
              <div key={key} className="rounded-lg border border-slate-700 bg-slate-950/50 p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium">{label}</p>
                  <span className={`text-xs ${module.status === 'failed' ? 'text-red-300' : module.status === 'completed' ? 'text-green-300' : module.status === 'running' ? 'text-blue-300' : 'text-slate-400'}`}>
                    {module.status === 'running' && <Loader2 size={12} className="mr-1 inline animate-spin" />}
                    {STATUS_LABELS[module.status] || pretty(module.status)}
                  </span>
                </div>
                {unavailable && <p className="mt-2 text-xs text-amber-300">Analysis not available yet</p>}
                {module.error && <p className="mt-2 text-xs text-red-300">{module.error}</p>}
                {analysis?.findings_by_module?.[key] > 0 && (
                  <p className="mt-2 text-xs text-slate-400">{analysis.findings_by_module[key]} findings</p>
                )}
                {key === 'novelty' && result && (
                  <p className="mt-2 text-xs text-amber-300">No external literature comparison was performed.</p>
                )}
                {module.status === 'failed' && analysis?.analysis_run_id && (
                  <button onClick={async () => {
                    try {
                      const updated = await retryResearchPaperAnalysisModule(paperId, analysis.analysis_run_id, key)
                      onAnalysisUpdate(updated)
                    } catch (error) { setActionsError(error.message) }
                  }} className="mt-2 text-xs text-blue-300 underline">Retry module</button>
                )}
              </div>
            )
          })}
        </div>
        {analysis?.analysis_status === 'running' && (
          <p role="status" className="mt-4 inline-flex items-center gap-2 text-sm text-blue-200">
            <Loader2 size={15} className="animate-spin" /> Analyzing research paper...
          </p>
        )}
        {analysis?.notice && <p className="mt-3 text-xs text-slate-400">{analysis.notice}</p>}
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(380px,0.9fr)]">
        <section className="min-w-0 rounded-2xl border border-slate-700 bg-slate-900/80 p-4">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div><h3 className="font-semibold">Paper evidence viewer</h3><p className="text-xs text-slate-400">Select a finding to navigate to its section and highlight the reported passage.</p></div>
            <label className="relative block">
              <Search size={14} className="absolute left-3 top-2.5 text-slate-500" />
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search paper and findings" className="w-64 max-w-full rounded-lg border border-slate-700 bg-slate-950 py-2 pl-8 pr-3 text-sm" />
            </label>
          </div>
          <div className="grid gap-4 md:grid-cols-[150px_minmax(0,1fr)]">
            <nav aria-label="Paper sections" className="flex max-h-[60vh] flex-col gap-1 overflow-y-auto">
              {visibleSections.map(([key]) => (
                <button key={key} onClick={() => { setActiveSection(key); setSelectedFinding(null) }} className={`rounded-lg px-2 py-2 text-left text-xs ${sectionKey === key ? 'bg-indigo-600/30 text-indigo-200' : 'text-slate-400 hover:bg-slate-800'}`}>
                  {pretty(key)}
                </button>
              ))}
            </nav>
            <article className="max-h-[70vh] min-h-80 overflow-y-auto rounded-xl border border-slate-700 bg-white p-5 text-slate-900">
              <h4 className="mb-4 text-center text-xl font-bold">{title}</h4>
              {authors && <p className="mb-1 text-center text-sm">{authors}</p>}
              {institution && <p className="mb-4 text-center text-sm text-slate-600">{institution}</p>}
              {sectionText ? (
                <>
                  <h5 className="mb-2 text-center font-semibold">{pretty(sectionKey)}</h5>
                  <p className="whitespace-pre-wrap text-justify leading-7">
                    {highlightStart >= 0 && highlightEnd <= sectionText.length ? (
                      <>
                        {sectionText.slice(0, highlightStart)}
                        <mark className="rounded bg-yellow-300 px-0.5">{sectionText.slice(highlightStart, highlightEnd)}</mark>
                        {sectionText.slice(highlightEnd)}
                      </>
                    ) : searchHighlightStart >= 0 ? (
                      <>
                        {sectionText.slice(0, searchHighlightStart)}
                        <mark className="rounded bg-cyan-200 px-0.5">{sectionText.slice(searchHighlightStart, searchHighlightEnd)}</mark>
                        {sectionText.slice(searchHighlightEnd)}
                      </>
                    ) : sectionText}
                  </p>
                  {selectedFinding && !selectedEvidence?.exact_match && (
                    <p className="mt-3 text-xs text-amber-800">The module did not provide an exact matching span; no passage has been highlighted.</p>
                  )}
                </>
              ) : (
                <p className="whitespace-pre-wrap text-justify leading-7">{analysis?.paper_text || 'No generated paper text is available for this analysis.'}</p>
              )}
            </article>
          </div>
        </section>

        <section className="min-w-0 rounded-2xl border border-slate-700 bg-slate-900/80 p-4">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div><h3 className="font-semibold">Analysis findings</h3><p className="text-xs text-slate-400">Potential issues and observations require author investigation.</p></div>
            <select value={moduleFilter} onChange={(event) => setModuleFilter(event.target.value)} className="rounded-lg border border-slate-700 bg-slate-950 px-2 py-2 text-xs">
              <option value="all">All modules</option>
              {MODULES.map(([key, label]) => <option key={key} value={key}>{label}</option>)}
            </select>
          </div>
          <div className="max-h-[70vh] space-y-3 overflow-y-auto pr-1">
            {(moduleFilter === 'all' || moduleFilter === 'related_work') && analysis?.modules?.related_work?.status === 'completed' && (
              <section className="rounded-xl border border-slate-700 bg-slate-950/50 p-4">
                <h4 className="font-semibold">Related research</h4>
                {Array.isArray(results.related_work?.evidence) && results.related_work.evidence.length > 0 ? (
                  <div className="mt-2 space-y-2">
                    {results.related_work.evidence.map((paper, index) => (
                      <article key={paper.paper_id || index} className="rounded-lg bg-slate-900 p-3 text-sm">
                        <p className="font-medium">{paper.title || 'Untitled retrieved record'}</p>
                        <p className="text-slate-400">{[paper.authors, paper.year].filter(Boolean).join(' · ')}</p>
                        {paper.similarity != null && <p className="mt-1 text-xs text-slate-400">Similarity/relevance: {paper.similarity}</p>}
                        {paper.retrieval_reason && <p className="mt-1 text-slate-300">Why retrieved: {paper.retrieval_reason}</p>}
                        {paper.evidence && <p className="mt-1 text-slate-300">Evidence: {typeof paper.evidence === 'string' ? paper.evidence : JSON.stringify(paper.evidence)}</p>}
                      </article>
                    ))}
                  </div>
                ) : (
                  <p className="mt-2 text-sm text-amber-300">Analysis not available yet: the current Related Work module extracts terms but does not retrieve or rank papers.</p>
                )}
              </section>
            )}
            {visibleFindings.length === 0 && <p className="rounded-lg border border-slate-700 p-4 text-sm text-slate-400">No findings have been returned by the completed modules. This does not establish novelty or correctness.</p>}
            {findingGroups.map(([groupName, groupFindings]) => (
              <section key={groupName}>
                <h4 className="mb-2 text-sm font-semibold text-slate-300">{pretty(groupName.replace(':', ' · '))}</h4>
                <div className="space-y-3">
                  {groupFindings.map((finding) => (
              <article key={finding.id} className={`rounded-xl border p-4 ${selectedFinding?.id === finding.id ? 'border-indigo-400 bg-indigo-950/25' : 'border-slate-700 bg-slate-950/50'}`}>
                <button onClick={() => {
                  setSelectedFinding(finding)
                  setActiveSection(sectionsForFinding(finding)?.[0] || '')
                }} className="w-full text-left">
                  <span className="text-xs uppercase tracking-wide text-indigo-300">{pretty(finding.module)} · {pretty(finding.category)} · {pretty(finding.status)}</span>
                  <h4 className="mt-1 font-semibold">{finding.title}</h4>
                  <p className="mt-1 text-sm text-slate-300">{finding.description}</p>
                </button>
                {finding.detailed_explanation && finding.detailed_explanation !== finding.description && (
                  <p className="mt-2 text-sm text-slate-300">{finding.detailed_explanation}</p>
                )}
                <dl className="mt-3 grid gap-2 text-xs sm:grid-cols-2">
                  <div><dt className="text-slate-500">Why detected</dt><dd className="mt-1 text-slate-300">{finding.why_detected || 'Not supplied by analysis'}</dd></div>
                  <div><dt className="text-slate-500">Affected section</dt><dd className="mt-1 text-slate-300">{finding.affected_section || 'Not identified by analysis'}</dd></div>
                  <div><dt className="text-slate-500">Confidence</dt><dd className="mt-1 text-slate-300">{Number.isFinite(finding.confidence) ? `${Math.round(finding.confidence * 100)}%` : 'Not supplied'}</dd></div>
                  <div><dt className="text-slate-500">Recommended action</dt><dd className="mt-1 text-slate-300">{finding.recommended_action || 'Not supplied by analysis'}</dd></div>
                </dl>
                <details className="mt-3">
                  <summary className="cursor-pointer text-sm text-blue-300">View Evidence</summary>
                  <div className="mt-2 rounded-lg bg-slate-900 p-3 text-sm">
                    {finding.evidence_text
                      ? <blockquote className="border-l-2 border-amber-400 pl-3 text-slate-200">“{finding.evidence_text}”{finding.evidence?.context_only && <span className="ml-2 text-xs text-amber-300">(context passage; detection was based on absence of a pattern)</span>}</blockquote>
                      : <p className="text-slate-400">No exact paper passage was supplied or matched by the analysis.</p>}
                    {finding.related_research && <p className="mt-2 text-slate-300">Related research: {JSON.stringify(finding.related_research)}</p>}
                    <p className="mt-2 text-xs text-slate-400">Analysis limitation: {Array.isArray(finding.analysis_limitation) && finding.analysis_limitation.length ? finding.analysis_limitation.join(' ') : 'Not supplied by analysis'}</p>
                  </div>
                </details>
                <button onClick={() => addAction(finding)} className="mt-3 inline-flex items-center gap-1 rounded-lg border border-slate-600 px-2 py-1.5 text-xs hover:bg-slate-800">
                  <Plus size={14} /> Add to Action Center
                </button>
              </article>
                    ))}
                  </div>
                </section>
            ))}
          </div>
        </section>
      </div>

      {analysis?.delta && analysis.analysis_run_id && (
        <section className="rounded-2xl border border-slate-700 bg-slate-900/80 p-5">
          <h3 className="font-semibold">Re-analysis comparison</h3>
          <p className="mt-1 text-sm text-slate-400">Compared with the previous stored analysis run; changes are literal finding changes, not a quality-improvement score.</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {Object.entries(analysis.delta).map(([kind, items]) => (
              <div key={kind} className="rounded-lg bg-slate-950/60 p-3"><p className="text-sm text-slate-400">{pretty(kind)}</p><p className="mt-1 font-semibold">{items.length}</p></div>
            ))}
          </div>
        </section>
      )}

      <section className="rounded-2xl border border-slate-700 bg-slate-900/80 p-5">
        <div className="flex items-center justify-between gap-3"><div><h3 className="font-semibold">Research Action Center</h3><p className="text-sm text-slate-400">Tasks stay open until you change their status.</p></div><span className="text-sm text-slate-400">{actions.length} tasks</span></div>
        {actionsError && <p role="alert" className="mt-3 text-sm text-red-300">{actionsError}</p>}
        <div className="mt-3 space-y-2">
          {actions.map((action) => (
            <article key={action.action_id} className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-slate-700 bg-slate-950/50 p-3">
              <div><h4 className="font-medium">{action.title}</h4><p className="mt-1 text-sm text-slate-300">{action.description}</p><p className="mt-1 text-xs text-slate-500">Source finding: {action.finding_id} · Priority: {pretty(action.priority)}</p>{action.evidence && <p className="mt-2 text-xs text-slate-400">Evidence: “{action.evidence}”</p>}</div>
              <label className="text-xs text-slate-400">Status
                <select value={action.status} onChange={(event) => changeActionStatus(action, event.target.value)} className="ml-2 rounded-lg border border-slate-700 bg-slate-950 p-2 text-white">
                  {ACTION_STATUSES.map((status) => <option key={status} value={status}>{pretty(status)}</option>)}
                </select>
              </label>
            </article>
          ))}
          {!actions.length && <p className="text-sm text-slate-500">No tasks yet. Add a finding to create an investigation task.</p>}
        </div>
      </section>

      {(report || reportError) && (
        <section className="rounded-2xl border border-green-500/30 bg-green-950/10 p-5">
          <h3 className="font-semibold">Analysis report</h3>
          <p className="mt-1 text-sm text-slate-400">This report contains analysis findings and is separate from the research-paper manuscript.</p>
          {reportError && <p role="alert" className="mt-2 text-sm text-red-300">{reportError}</p>}
          {report && <>
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                {[
                  ['Total findings', report.summary?.total_findings ?? 0],
                  ['Require investigation', report.summary?.requiring_investigation ?? 0],
                  ['Evidence passages', report.summary?.evidence_count ?? 0],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-lg border border-slate-700 bg-slate-950/60 p-3">
                    <p className="text-xs text-slate-400">{label}</p>
                    <p className="mt-1 text-lg font-semibold">{value}</p>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-sm text-slate-300">
                Generated {new Date(report.generated_at).toLocaleString()} · This report summarizes persisted module outputs and does not determine novelty, correctness, or publication outcomes.
              </p>
              <div className="mt-4 flex flex-wrap gap-2" aria-label="Export research analysis report">
                {['pdf', 'docx', 'markdown', 'json'].map((format) => (
                  <button
                    key={format}
                    onClick={() => downloadReport(format)}
                    disabled={reportExport.status === 'Preparing'}
                    className="inline-flex items-center gap-2 rounded-lg border border-slate-600 px-3 py-2 text-sm hover:bg-slate-800 disabled:cursor-wait disabled:opacity-50"
                  >
                    {reportExport.status === 'Preparing' && reportExport.format === format
                      ? <Loader2 size={15} className="animate-spin" />
                      : <FileText size={15} />}
                    Export analysis {format === 'markdown' ? 'Markdown' : format.toUpperCase()}
                  </button>
                ))}
              </div>
              {reportExport.status && (
                <div className="mt-3 flex flex-wrap items-center gap-3 text-sm" aria-live="polite">
                  {reportExport.status === 'Error' ? (
                    <>
                      <p role="alert" className="text-red-300">Export failed: {reportExport.error}</p>
                      <button onClick={() => downloadReport(reportExport.format)} className="rounded-lg border border-red-400/50 px-3 py-1.5 text-red-200 hover:bg-red-950/40">
                        Retry {reportExport.format.toUpperCase()}
                      </button>
                    </>
                  ) : (
                    <>
                      <p className={reportExport.status === 'Downloaded' ? 'text-green-300' : 'text-blue-200'}>
                        {reportExport.status}{reportExport.format ? ` · ${reportExport.format.toUpperCase()}` : ''}
                      </p>
                      {reportExport.status === 'Download started' && (
                        <button onClick={() => setReportExport((state) => ({ ...state, status: 'Downloaded' }))} className="text-xs text-slate-300 underline">
                          Confirm downloaded
                        </button>
                      )}
                    </>
                  )}
                </div>
              )}
              <details className="mt-4">
                <summary className="cursor-pointer text-sm text-green-300">View report data</summary>
                <pre className="mt-2 max-h-96 overflow-auto whitespace-pre-wrap rounded-lg bg-slate-950 p-3 text-xs text-slate-300">{JSON.stringify(report, null, 2)}</pre>
              </details>
            </>}
        </section>
      )}
      {analysis?.analysis_status === 'failed' && <p className="inline-flex items-center gap-2 text-sm text-red-300"><AlertCircle size={15} /> All analysis modules failed. Retry a failed module or run analysis again.</p>}
      {analysis?.analysis_status === 'completed' && <p className="inline-flex items-center gap-2 text-xs text-slate-500"><Check size={13} /> Module outputs and findings are saved with this paper version.</p>}
    </section>
  )
}

export default ResearchPaperAnalysis
