import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
  ArrowLeft, Check, ChevronDown, Download, FileText, Loader2, RotateCcw,
  Save, Search, Sparkles, X,
} from 'lucide-react'
import {
  analyzeResearchPaper,
  compareResearchPaperVersions,
  createResearchPaper,
  createResearchPaperVersion,
  exportResearchPaper,
  generateResearchPaper,
  getResearchPaper,
  getResearchPaperAnalysis,
  listResearchPaperVersions,
  regenerateResearchSection,
  saveResearchPaper,
  updateResearchPaperExportStatus,
} from '../utils/researchPapers'
import ResearchPaperAnalysis from '../components/ResearchPaperAnalysis'

const FIELDS = [
  ['title', 'Title'], ['authors', 'Authors'], ['institution', 'College / University'],
  ['course', 'Course'], ['instructor', 'Instructor'], ['submission_date', 'Submission Date'],
  ['abstract', 'Abstract'], ['keywords', 'Keywords'], ['problem_statement', 'Problem Statement'], ['objectives', 'Objectives'],
  ['introduction', 'Introduction'], ['related_work', 'Related Work'], ['methodology', 'Methodology'],
  ['dataset', 'Dataset'], ['technologies', 'Technologies'], ['experiments_results', 'Experiments / Results'],
  ['discussion', 'Discussion'], ['limitations', 'Limitations'], ['future_work', 'Future Work'],
  ['conclusion', 'Conclusion'], ['citations', 'Citations / Notes'], ['references', 'References'],
]
const FORMATS = ['apa', 'mla', 'chicago', 'ieee', 'generic', 'university', 'imrad', 'conference', 'thesis']
const FORMATTED = {
  apa: 'APA (Student Paper)',
  mla: 'MLA',
  chicago: 'Chicago (Notes & Bibliography)',
  ieee: 'IEEE',
  generic: 'Generic Research Paper',
  university: 'University Format',
  imrad: 'IMRaD',
  conference: 'Conference Paper',
  thesis: 'Thesis',
}
const FORMAT_DESCRIPTIONS = {
  apa: 'APA student-paper layout: title page, 1-inch margins, double spacing, and author-date citations when supplied.',
  mla: 'MLA layout: first-page heading, double spacing, and a Works Cited section for supplied sources.',
  chicago: 'Chicago Notes and Bibliography layout: title page, double spacing, notes, and bibliography.',
  ieee: 'IEEE layout: numbered section headings, Index Terms, and two-column body layout.',
  generic: 'Generic academic-paper layout with justified body text.',
  university: 'University-style academic-paper layout with justified body text.',
  imrad: 'IMRaD structure: Introduction, Methods, Results, and Discussion.',
  conference: 'Conference-paper structure with numbered section headings.',
  thesis: 'Thesis structure with literature review and appendices.',
}
const EXPORTS = ['pdf', 'docx', 'latex', 'markdown']
const EMPTY_DETAILS = Object.fromEntries(FIELDS.map(([key]) => [key, '']))
const fieldLabel = (key) => FIELDS.find(([field]) => field === key)?.[1] || key.replaceAll('_', ' ')
const IEEE_EXCLUDED_FROM_NUMBERING = new Set(['abstract', 'keywords', 'references'])
const toRoman = (value) => {
  const numerals = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII', 'XIV', 'XV']
  return numerals[value - 1] || String(value)
}
function ResearchPaperBuilder() {
  const { paperId } = useParams()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const autoAnalyzeStarted = useRef(false)
  const previousPaperId = useRef(paperId)
  const [details, setDetails] = useState(EMPTY_DETAILS)
  const [content, setContent] = useState({})
  const [format, setFormat] = useState('generic')
  const [record, setRecord] = useState(null)
  const [isGenerated, setIsGenerated] = useState(false)
  const [analysis, setAnalysis] = useState(null)
  const [versions, setVersions] = useState([])
  const [comparison, setComparison] = useState(null)
  const [activeSection, setActiveSection] = useState('abstract')
  const [previewMode, setPreviewMode] = useState(true)
  const [sectionSearch, setSectionSearch] = useState('')
  const [pendingChanges, setPendingChanges] = useState({})
  const [loading, setLoading] = useState(Boolean(paperId))
  const [saving, setSaving] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [creatingVersion, setCreatingVersion] = useState(false)
  const [exportFormat, setExportFormat] = useState('')
  const [downloadState, setDownloadState] = useState('')
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const previousId = previousPaperId.current
    previousPaperId.current = paperId
    if (!paperId) {
      if (previousId) {
        setRecord(null)
        setDetails(EMPTY_DETAILS)
        setContent({})
        setAnalysis(null)
        setIsGenerated(false)
      }
      return
    }
    setRecord(null)
    setIsGenerated(false)
    let cancelled = false
    setLoading(true)
    getResearchPaper(paperId).then((data) => {
      if (cancelled) return
      const savedDetails = data.details || data.content || {}
      setRecord(data)
      setDetails(Object.fromEntries(FIELDS.map(([key]) => [key, savedDetails[key] || ''])))
      setContent(data.generated_content || data.generated_sections || data.content || {})
      setFormat(data.format || 'generic')
      setAnalysis(data.analysis_results || null)
      setIsGenerated(data.is_generated === true)
      setHasUnsavedChanges(false)
    }).catch((err) => {
      if (!cancelled) setError(err.message)
    }).finally(() => {
      if (!cancelled) setLoading(false)
    })
    return () => { cancelled = true }
  }, [paperId])

  useEffect(() => {
    const runId = analysis?.analysis_run_id
    if (!runId || analysis.analysis_status !== 'running' || !record?.paper_id) return undefined
    let cancelled = false
    const poll = async () => {
      try {
        const latest = await getResearchPaperAnalysis(record.paper_id, runId)
        if (!cancelled) setAnalysis(latest)
      } catch (err) {
        if (!cancelled) setError(`Could not refresh analysis status: ${err.message}`)
      }
    }
    const timer = window.setInterval(poll, 900)
    poll()
    return () => {
      cancelled = true
      window.clearInterval(timer)
    }
  }, [analysis?.analysis_run_id, analysis?.analysis_status, record?.paper_id])

  const sectionKeys = useMemo(
    () => Object.keys(content).filter((key) => key !== 'missing_information'),
    [content]
  )
  const filteredSections = sectionKeys.filter((key) =>
    fieldLabel(key).toLowerCase().includes(sectionSearch.toLowerCase())
  )
  const currentSection = content[activeSection] || ''
  const numberedSections = sectionKeys.filter((key) =>
    !IEEE_EXCLUDED_FROM_NUMBERING.has(key) && key !== 'notes'
  )
  const actualAnalysis = analysis || record?.analysis_results
  const legacyFindings = actualAnalysis?.findings || Object.entries(actualAnalysis?.results || {})
    .flatMap(([module, result]) => Array.isArray(result?.findings)
      ? result.findings.map((finding) => ({ module, ...finding }))
      : [])

  const persist = async () => {
    const existingId = record?.paper_id || record?.id
    if (existingId && !hasUnsavedChanges) return record
    setSaving(true)
    setError('')
    try {
      const payload = { ...details, format, generated_content: content }
      const saved = record?.paper_id || record?.id
        ? await saveResearchPaper(record.paper_id || record.id, payload)
        : await createResearchPaper(payload)
      setRecord(saved)
      setDetails((previous) => ({ ...previous, ...(saved.details || {}) }))
      setContent(saved.generated_content || saved.generated_sections || content)
      setIsGenerated(saved.is_generated === true)
      setHasUnsavedChanges(false)
      return saved
    } catch (err) {
      setError(err.message)
      return null
    } finally {
      setSaving(false)
    }
  }

  const updateDetail = (key, value) => {
    setHasUnsavedChanges(true)
    setDetails((previous) => ({ ...previous, [key]: value }))
    setContent((previous) => (
      Object.prototype.hasOwnProperty.call(previous, key)
        ? { ...previous, [key]: value }
        : previous
    ))
    setAnalysis(null)
  }

  const handleGenerate = async () => {
    setGenerating(true)
    setError('')
    try {
      const saved = await persist()
      if (!saved) return
      const id = saved.paper_id || saved.id
      const generated = await generateResearchPaper(id)
      setRecord(generated)
      setContent(generated.generated_content || generated.generated_sections || generated.content || {})
      setAnalysis(generated.analysis_results || null)
      setIsGenerated(generated.is_generated === true)
    } catch (err) {
      setError(err.message)
    } finally {
      setGenerating(false)
    }
  }

  const changeFormat = async (nextFormat) => {
    setFormat(nextFormat)
    setError('')
    if (record?.paper_id || record?.id) {
      setSaving(true)
      try {
        const saved = await saveResearchPaper(record.paper_id || record.id, {
          ...details, format: nextFormat, generated_content: content,
        })
        setRecord(saved)
        setContent(saved.generated_content || saved.generated_sections || content)
        setIsGenerated(saved.is_generated === true)
        setHasUnsavedChanges(false)
      } catch (err) {
        setError(err.message)
      } finally {
        setSaving(false)
      }
    } else {
      setHasUnsavedChanges(true)
    }
  }

  const updateSection = (value) => {
    setHasUnsavedChanges(true)
    setContent((previous) => ({ ...previous, [activeSection]: value }))
    setPendingChanges((previous) => ({ ...previous, [activeSection]: null }))
    setAnalysis(null)
  }

  const handleRegenerate = async () => {
    if (!record) return
    setError('')
    try {
      const revised = await regenerateResearchSection(record.paper_id || record.id, activeSection)
      const newSection = revised.section_content ?? revised.generated_content?.[activeSection]
      if (typeof newSection === 'string') {
        setPendingChanges((previous) => ({ ...previous, [activeSection]: newSection }))
      } else {
        throw new Error('The server did not return revised section content.')
      }
    } catch (err) {
      setError(err.message)
    }
  }

  const acceptChange = () => {
    setHasUnsavedChanges(true)
    setContent((previous) => ({ ...previous, [activeSection]: pendingChanges[activeSection] }))
    setPendingChanges((previous) => ({ ...previous, [activeSection]: null }))
    setAnalysis(null)
  }

  const rejectChange = () =>
    setPendingChanges((previous) => ({ ...previous, [activeSection]: null }))

  const handleAnalyze = async () => {
    setAnalyzing(true)
    setError('')
    try {
      const saved = await persist()
      if (!saved) return
      const result = await analyzeResearchPaper(saved.paper_id || saved.id)
      setAnalysis(result.analysis_results || result)
      setRecord((previous) => ({ ...previous, ...result }))
    } catch (err) {
      setError(err.message)
    } finally {
      setAnalyzing(false)
    }
  }

  const handleReanalyze = async () => {
    await handleAnalyze()
  }

  useEffect(() => {
    if (searchParams.get('analyze') !== '1' || !record || !sectionKeys.length || autoAnalyzeStarted.current) return
    autoAnalyzeStarted.current = true
    setSearchParams({}, { replace: true })
    handleAnalyze()
  }, [searchParams, record, sectionKeys.length])

  const handleCreateVersion = async () => {
    if (!record) return
    setCreatingVersion(true)
    setError('')
    try {
      const next = await createResearchPaperVersion(record.paper_id || record.id, content)
      setRecord(next)
      navigate(`/research-papers/${next.paper_id || next.id}/edit`, { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setCreatingVersion(false)
    }
  }

  const handleExport = async (kind) => {
    setExportFormat(kind)
    setDownloadState('Preparing')
    setError('')
    try {
      const safeTitle = (details.title || 'research-paper').replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '') || 'research-paper'
      const extension = kind === 'markdown' ? 'md' : kind === 'latex' ? 'tex' : kind
      const fileName = `${safeTitle}.${extension}`
      const saved = await persist()
      if (!saved) {
        setDownloadState('Error')
        return
      }
      const blob = await exportResearchPaper(saved.paper_id || saved.id, kind)
      if (!(blob instanceof Blob) || blob.size === 0) {
        throw new Error('The server returned an empty export file.')
      }
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = fileName
      document.body.appendChild(anchor)
      anchor.click()
      anchor.remove()
      window.setTimeout(() => URL.revokeObjectURL(url), 1000)
      await updateResearchPaperExportStatus(saved.paper_id || saved.id, 'download_started')
      setDownloadState('Download started')
    } catch (err) {
      if (err.name === 'AbortError') {
        setDownloadState('')
        return
      }

      setError(`Export failed: ${err.message}`)
      setDownloadState('Error')
    } finally {
      setExportFormat('')
    }
  }

  const confirmDownloaded = async () => {
    if (!record) return
    try {
      await updateResearchPaperExportStatus(record.paper_id || record.id, 'downloaded')
      setDownloadState('Downloaded')
      setError('')
    } catch (err) {
      setError(`Could not record download completion: ${err.message}`)
    }
  }

  const loadVersions = async () => {
    if (!record) return
    try {
      const data = await listResearchPaperVersions(record.paper_id || record.id)
      setVersions(Array.isArray(data) ? data : data.versions || [])
    } catch (err) {
      setError(err.message)
    }
  }

  const compareVersions = async () => {
    if (versions.length < 2 || !record) return
    setError('')
    try {
      const currentId = record.version_id || record.id
      const currentVersion = versions.find((item) => item.id === currentId || item.version === record.version)
      const otherVersion = versions.find((item) => item.id !== currentVersion?.id)
      if (!currentVersion || !otherVersion) throw new Error('Two saved versions are required to compare.')
      const result = await compareResearchPaperVersions(
        record.paper_id || record.id,
        currentVersion.id,
        otherVersion.id
      )
      setComparison(result)
    } catch (err) {
      setError(err.message)
    }
  }

  if (loading) return <main className="min-h-screen p-10 text-slate-300">Loading saved paper…</main>

  return (
    <main className="min-h-screen px-4 py-8 text-slate-100 sm:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link to="/my-research-papers" className="rounded-lg p-2 text-slate-300 hover:bg-slate-800" aria-label="Back to My Research Papers">
              <ArrowLeft size={20} />
            </Link>
            <div>
              <p className="text-sm text-blue-300">Research Paper Builder</p>
              <h1 className="text-2xl font-bold">{record?.title || 'New research paper'}</h1>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={persist} disabled={saving} className="inline-flex items-center gap-2 rounded-lg border border-slate-600 px-4 py-2 hover:bg-slate-800 disabled:opacity-50">
              <Save size={16} />{saving ? 'Saving…' : 'Save draft'}
            </button>
            <button onClick={handleGenerate} disabled={generating || saving} className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 font-semibold hover:bg-indigo-500 disabled:opacity-50">
              {generating ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
              {generating ? 'Generating…' : 'Generate paper'}
            </button>
          </div>
        </div>

        {error && <div role="alert" className="mb-5 rounded-lg border border-red-500/40 bg-red-950/50 p-4 text-red-200">{error}</div>}

        <div className="grid gap-6 lg:grid-cols-[minmax(300px,0.8fr)_minmax(0,1.2fr)]">
          <section className="h-fit rounded-2xl border border-slate-700 bg-slate-900/80 p-5">
            <h2 className="mb-4 text-lg font-semibold">Project details</h2>
            <div className="max-h-[72vh] space-y-4 overflow-y-auto pr-2">
              {FIELDS.map(([key, label]) => (
                <label key={key} className="block text-sm font-medium text-slate-300">
                  {label}
                  {key === 'title' ? (
                    <input value={details[key]} onChange={(event) => updateDetail(key, event.target.value)} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 p-3 text-white outline-none focus:border-blue-500" placeholder="Enter a working title" />
                  ) : (
                    <textarea rows={['abstract', 'introduction', 'related_work', 'methodology', 'experiments_results'].includes(key) ? 4 : 2} value={details[key]} onChange={(event) => updateDetail(key, event.target.value)} className="mt-1 w-full resize-y rounded-lg border border-slate-700 bg-slate-950 p-3 text-white outline-none focus:border-blue-500" placeholder={`Optional — enter ${label.toLowerCase()} information`} />
                  )}
                </label>
              ))}
            </div>
          </section>

          <section className="min-w-0 rounded-2xl border border-slate-700 bg-slate-900/80 p-5">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">Preview and edit</h2>
                <p className="text-sm text-slate-400">Generate builds a complete draft from your details. Inferred content and hypothetical placeholders are clearly labeled for verification.</p>
              </div>
              <label className="flex items-center gap-2 text-sm text-slate-300">
                Format
                <select value={format} onChange={(event) => changeFormat(event.target.value)} disabled={saving} className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white disabled:opacity-60">
                  {FORMATS.map((item) => <option key={item} value={item}>{FORMATTED[item]}</option>)}
                </select>
              </label>
            </div>
            <p className="mb-4 text-sm text-slate-400">{FORMAT_DESCRIPTIONS[format]}</p>

            {!isGenerated || sectionKeys.length === 0 ? (
              <div className="flex min-h-64 flex-col items-center justify-center rounded-xl border border-dashed border-slate-700 p-8 text-center text-slate-400">
                <FileText size={36} className="mb-3 text-slate-500" />
                <p>Enter your project details and select Generate paper to build the formatted full-paper preview.</p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-[190px_minmax(0,1fr)]">
                <aside>
                  <label className="relative mb-3 block">
                    <Search size={15} className="absolute left-3 top-3 text-slate-500" />
                    <input value={sectionSearch} onChange={(event) => setSectionSearch(event.target.value)} placeholder="Search sections" className="w-full rounded-lg border border-slate-700 bg-slate-950 py-2 pl-9 pr-2 text-sm text-white" />
                  </label>
                  <nav className="flex max-h-[55vh] flex-col gap-1 overflow-y-auto">
                    {filteredSections.map((key) => (
                      <button key={key} onClick={() => {
                        setActiveSection(key)
                        if (previewMode) {
                          document.getElementById(`paper-section-${key}`)?.scrollIntoView({
                            behavior: 'smooth',
                            block: 'start',
                          })
                        }
                      }} className={`rounded-lg px-3 py-2 text-left text-sm ${activeSection === key ? 'bg-indigo-600/30 text-indigo-200' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
                        {fieldLabel(key)}
                      </button>
                    ))}
                  </nav>
                </aside>
                <div className="min-w-0 rounded-xl border border-slate-700 bg-slate-950/70 p-4">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-lg font-semibold">{fieldLabel(activeSection)}</h3>
                    <div className="flex flex-wrap gap-2">
                      <button onClick={() => setPreviewMode(true)} className={`rounded-lg px-3 py-2 text-sm ${previewMode ? 'bg-indigo-600 text-white' : 'border border-slate-700 text-slate-300'}`}>Preview</button>
                      <button onClick={() => setPreviewMode(false)} className={`rounded-lg px-3 py-2 text-sm ${!previewMode ? 'bg-indigo-600 text-white' : 'border border-slate-700 text-slate-300'}`}>Edit</button>
                      <button onClick={handleRegenerate} disabled={!record} className="inline-flex items-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-sm hover:bg-slate-800 disabled:opacity-40" title={!record ? 'Save the draft first' : 'Regenerate this section'}>
                        <RotateCcw size={15} /> Regenerate section
                      </button>
                    </div>
                  </div>
                  {previewMode ? (
                    <article className="max-h-[70vh] min-h-[28rem] overflow-y-auto rounded-lg bg-white px-8 py-10 font-serif text-slate-900 shadow-inner sm:px-12">
                      {record?.assumptions?.length > 0 && (
                        <div className="mb-6 rounded border border-amber-300 bg-amber-50 p-3 font-sans text-xs text-amber-950">
                          <strong>Assumption-based draft:</strong> inferred sections are
                          labeled in the text. Verify assumptions, hypothetical results,
                          and citation placeholders before using or submitting this paper.
                        </div>
                      )}
                      {format === 'mla' ? (
                        <header className="mb-8 text-left leading-8">
                          <p>{details.authors || '[Missing: author]'}</p>
                          <p>{details.instructor || '[Missing: instructor]'}</p>
                          <p>{details.course || '[Missing: course]'}</p>
                          <p>{details.submission_date || '[Missing: submission date]'}</p>
                          <h1 className="my-8 text-center text-xl">{details.title || '[Missing: title]'}</h1>
                        </header>
                      ) : (
                        <header className={`mb-8 text-center ${format === 'apa' || format === 'chicago' ? 'min-h-[34rem] pt-32' : ''}`}>
                          <h1 className="mb-3 text-2xl font-bold">{details.title || '[Missing: title]'}</h1>
                          <p className="text-base">{details.authors || '[Missing: authors]'}</p>
                          {details.institution && <p className="mt-1 text-sm">{details.institution}</p>}
                          {format === 'apa' && (
                            <>
                              <p className="mt-3">{details.course || '[Missing: course]'}</p>
                              <p>{details.instructor || '[Missing: instructor]'}</p>
                              <p>{details.submission_date || '[Missing: due date]'}</p>
                            </>
                          )}
                          {format === 'chicago' && details.submission_date && <p className="mt-3">{details.submission_date}</p>}
                        </header>
                      )}
                      {(format === 'apa' || format === 'chicago') && <div className="mb-8 border-b border-slate-200" aria-label="Title page break" />}
                      <div className={format === 'ieee' ? 'md:columns-2 md:gap-8' : ''}>
                        {sectionKeys.map((key) => {
                          const isUnnumbered = IEEE_EXCLUDED_FROM_NUMBERING.has(key) || key === 'notes'
                          const sectionNumber = numberedSections.indexOf(key) + 1
                          const heading = key === 'keywords' && format === 'ieee'
                            ? 'Index Terms'
                            : key === 'references' && format === 'mla'
                              ? 'Works Cited'
                              : key === 'references' && format === 'chicago'
                                ? 'Bibliography'
                                : fieldLabel(key)
                          const sectionTitle = format === 'ieee' && !isUnnumbered
                            ? `${toRoman(sectionNumber)}. ${heading.toUpperCase()}`
                            : heading
                          return (
                            <section
                              id={`paper-section-${key}`}
                              key={key}
                              className={`mb-6 break-inside-avoid ${key === activeSection ? 'rounded-sm outline outline-1 outline-indigo-200' : ''}`}
                            >
                              <h2 className={`mb-2 font-bold ${format === 'ieee' || format === 'apa' || key === 'abstract' ? 'text-center' : 'text-left'}`}>
                                {sectionTitle}
                              </h2>
                              <p className={`whitespace-pre-wrap text-justify ${['apa', 'mla', 'chicago'].includes(format) ? 'leading-8' : 'leading-6'}`}>
                                {content[key] || `[${fieldLabel(key)} information not provided.]`}
                              </p>
                            </section>
                          )
                        })}
                      </div>
                    </article>
                  ) : (
                    <textarea aria-label={`${fieldLabel(activeSection)} paper text`} value={currentSection} onChange={(event) => updateSection(event.target.value)} rows={18} className="w-full resize-y rounded-lg border border-slate-800 bg-slate-900 p-4 leading-7 text-slate-200 outline-none focus:border-blue-500" />
                  )}
                  {pendingChanges[activeSection] != null && (
                    <div className="mt-4 rounded-xl border border-amber-500/40 bg-amber-950/20 p-4">
                      <p className="mb-2 text-sm font-semibold text-amber-200">Proposed revision</p>
                      <p className="whitespace-pre-wrap text-sm leading-6 text-slate-300">{pendingChanges[activeSection]}</p>
                      <div className="mt-4 flex gap-2">
                        <button onClick={acceptChange} className="inline-flex items-center gap-2 rounded-lg bg-green-700 px-3 py-2 text-sm"><Check size={15} /> Accept</button>
                        <button onClick={rejectChange} className="inline-flex items-center gap-2 rounded-lg bg-slate-700 px-3 py-2 text-sm"><X size={15} /> Reject</button>
                      </div>
                    </div>
                  )}
                  {content.missing_information?.[activeSection] && <p className="mt-3 text-sm text-amber-300">{content.missing_information[activeSection]}</p>}
                </div>
              </div>
            )}

            <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-slate-800 pt-5">
              <button onClick={handleAnalyze} disabled={!record || !sectionKeys.length || analyzing || saving} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 font-semibold hover:bg-blue-500 disabled:opacity-50">
                {analyzing && <Loader2 size={16} className="animate-spin" />} {analyzing ? 'Analyzing…' : 'Analyze paper'}
              </button>
              <button onClick={handleCreateVersion} disabled={!record || creatingVersion || saving} className="rounded-lg border border-slate-600 px-4 py-2 hover:bg-slate-800 disabled:opacity-50">
                {creatingVersion ? 'Creating version…' : `Create V${(record?.version || 1) + 1}`}
              </button>
              <button onClick={loadVersions} disabled={!record || saving} className="inline-flex items-center gap-1 rounded-lg border border-slate-600 px-4 py-2 hover:bg-slate-800 disabled:opacity-50">
                Versions <ChevronDown size={15} />
              </button>
              <span className="basis-full text-xs font-semibold uppercase tracking-wide text-slate-400">Research paper exports</span>
              {EXPORTS.map((kind) => (
                <button key={kind} onClick={() => handleExport(kind)} disabled={!record || !isGenerated || Boolean(exportFormat) || saving} aria-label={`Export research paper as ${kind.toUpperCase()}`} className="inline-flex items-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-sm hover:bg-slate-800 disabled:opacity-50">
                  {exportFormat === kind ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                  {exportFormat === kind ? 'Preparing' : `Paper ${kind.toUpperCase()}`}
                </button>
              ))}
            </div>
            {downloadState && <div aria-live="polite" className={`mt-3 text-sm ${downloadState === 'Error' ? 'text-red-300' : 'text-green-300'}`}>
              <p>{downloadState}{downloadState === 'Error' ? ' — use Export to retry.' : ''}</p>
              {downloadState === 'Download started' && (
                <div className="mt-2 flex flex-wrap items-center gap-3">
                  <p className="text-slate-400">Check your browser downloads. The browser does not report when a standard download is saved.</p>
                  <button onClick={confirmDownloaded} className="rounded-md border border-green-700 px-2 py-1 text-xs text-green-200 hover:bg-green-950">Confirm downloaded</button>
                </div>
              )}
            </div>}

            {versions.length > 0 && (
              <div className="mt-5 rounded-xl border border-slate-700 p-4">
                <h3 className="mb-2 font-semibold">Saved versions</h3>
                {versions.map((version, index) => <p key={`${version.id || version.version}-${index}`} className="text-sm text-slate-300">V{version.version} · {version.title || record?.title} · {version.created_at || version.updated_at}</p>)}
                <button onClick={compareVersions} disabled={versions.length < 2} className="mt-3 rounded-lg border border-slate-600 px-3 py-2 text-sm hover:bg-slate-800 disabled:opacity-50">Compare versions</button>
                {comparison && <pre className="mt-3 max-h-64 overflow-auto whitespace-pre-wrap rounded-lg bg-slate-950 p-3 text-xs text-slate-300">{JSON.stringify(comparison, null, 2)}</pre>}
              </div>
            )}
          </section>
        </div>
        {actualAnalysis && (
          actualAnalysis.analysis_run_id ? (
            <ResearchPaperAnalysis
              paperId={record?.paper_id || record?.id}
              analysis={actualAnalysis}
              content={content}
              title={record?.title || details.title}
              authors={details.authors}
              institution={details.institution}
              version={record?.version}
              onReanalyze={handleReanalyze}
              onAnalysisUpdate={setAnalysis}
            />
          ) : (
            <section className="mt-8 rounded-2xl border border-blue-500/30 bg-blue-950/20 p-5">
              <h2 className="font-semibold">Existing Enthesis analysis</h2>
              <p className="mt-1 text-sm text-slate-400">Analysis status: {record?.analysis_status || actualAnalysis.analysis_status || 'Saved'}. Results are from the existing paper pipeline.</p>
              <div className="mt-4 space-y-3">
                {legacyFindings.map((finding, index) => (
                  <article key={`${finding.module || 'finding'}-${index}`} className="rounded-lg border border-slate-700 bg-slate-900/70 p-4">
                    <h3 className="font-medium">{finding.title || finding.type || finding.module || `Finding ${index + 1}`}</h3>
                    <p className="mt-1 text-sm text-slate-300">{finding.description || finding.summary || 'The existing analysis returned no description.'}</p>
                  </article>
                ))}
                {!legacyFindings.length && <p className="text-sm text-slate-400">The saved analysis contains no structured findings.</p>}
              </div>
            </section>
          )
        )}
        <footer className="mt-8 text-center text-sm text-slate-500">
          <Link to="/my-research-papers" className="text-blue-300 hover:text-blue-200">My Research Papers</Link>
        </footer>
      </div>
    </main>
  )
}

export default ResearchPaperBuilder
