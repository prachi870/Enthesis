import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  AlertCircle, ArrowLeft, BookOpen, Check, Download, FileText, Loader2,
  Save, Search, Sparkles, Upload,
} from 'lucide-react'
import {
  analyzeCollegeTemplate,
  compareCollegeReportSections,
  createCollegeReport,
  exportCollegeReport,
  generateCollegeReport,
  getCollegeReport,
  listCollegeReports,
  listCollegeTemplates,
  reanalyzeCollegeTemplate,
  saveCollegeTemplate,
  updateCollegeReportInformation,
  validateCollegeReport,
} from '../utils/collegeReports'

const stages = [
  'Upload and analyze college sample',
  'Save semester template',
  'Upload project documents',
  'Answer missing-information questions',
  'Generate and validate report',
  'Preview and export PDF/DOCX',
]

function CollegeReportGenerator() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [templates, setTemplates] = useState([])
  const [reports, setReports] = useState([])
  const [templateName, setTemplateName] = useState('')
  const [semester, setSemester] = useState('')
  const [templateFile, setTemplateFile] = useState(null)
  const [analyzedTemplate, setAnalyzedTemplate] = useState(null)
  const [selectedTemplateId, setSelectedTemplateId] = useState('')
  const [projectTitle, setProjectTitle] = useState('')
  const [projectFiles, setProjectFiles] = useState([])
  const [report, setReport] = useState(null)
  const [extractedInformation, setExtractedInformation] = useState({})
  const [information, setInformation] = useState({})
  const [comparison, setComparison] = useState(null)
  const [busy, setBusy] = useState('')
  const [exportState, setExportState] = useState({ format: '', status: '', error: '' })
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  const refreshLibrary = useCallback(async () => {
    try {
      const [templateData, reportData] = await Promise.all([
        listCollegeTemplates(),
        listCollegeReports(),
      ])
      setTemplates(templateData.templates || [])
      setReports(reportData.reports || [])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refreshLibrary().catch((err) => setError(err.message))
  }, [refreshLibrary])

  const currentTemplate = useMemo(() => {
    const templateId = selectedTemplateId || report?.template_id
    return templates.find((item) => item.template_id === templateId)
      || (analyzedTemplate?.template_id === templateId ? analyzedTemplate : null)
  }, [templates, report?.template_id, selectedTemplateId, analyzedTemplate])
  const selectedTemplateIsSaved = currentTemplate?.is_saved === true
  const sections = currentTemplate?.structure?.sections || []
  const filteredReports = reports.filter((item) =>
    (item.project_title || '').toLowerCase().includes(search.toLowerCase())
  )

  const loadReport = async (reportId) => {
    setBusy('load')
    setError('')
    try {
      const data = await getCollegeReport(reportId)
      setReport(data)
      setProjectTitle(data.project_title)
      setSelectedTemplateId(data.template_id)
      setExtractedInformation(data.extracted_information || {})
      setInformation(data.information || {})
      setComparison(null)
      if (searchParams.get('report') !== reportId) {
        setSearchParams({ report: reportId }, { replace: true })
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy('')
    }
  }

  const handleTemplateSelection = (templateId) => {
    setSelectedTemplateId(templateId)
    setReport(null)
    setExtractedInformation({})
    setInformation({})
    setComparison(null)
    if (searchParams.has('report')) setSearchParams({}, { replace: true })
  }

  useEffect(() => {
    const reportId = searchParams.get('report')
    if (reportId && reports.some((item) => item.report_id === reportId)) {
      loadReport(reportId)
    }
  }, [searchParams, reports])

  const handleAnalyzeTemplate = async (event) => {
    event.preventDefault()
    if (!templateFile) {
      setError('Choose the college sample file to analyze.')
      return
    }
    setBusy('template')
    setError('')
    try {
      const body = new FormData()
      body.append('file', templateFile)
      body.append('name', templateName)
      body.append('semester', semester)
      const result = await analyzeCollegeTemplate(body)
      setAnalyzedTemplate(result)
      setSelectedTemplateId(result.template_id)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy('')
    }
  }

  const handleSaveTemplate = async () => {
    const templateToSave = analyzedTemplate || currentTemplate
    if (!templateToSave || templateToSave.is_saved) return
    setBusy('save-template')
    setError('')
    try {
      const saved = await saveCollegeTemplate(templateToSave.template_id)
      setAnalyzedTemplate(saved)
      setSelectedTemplateId(saved.template_id)
      await refreshLibrary()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy('')
    }
  }

  const handleReanalyzeTemplate = async () => {
    if (!currentTemplate?.is_saved) return
    setBusy('reanalyze-template')
    setError('')
    try {
      const refreshed = await reanalyzeCollegeTemplate(currentTemplate.template_id)
      setAnalyzedTemplate(refreshed)
      setSelectedTemplateId(refreshed.template_id)
      setComparison(null)
      if (report?.template_id === refreshed.template_id) {
        const refreshedReport = await getCollegeReport(report.report_id)
        setReport(refreshedReport)
        setExtractedInformation(refreshedReport.extracted_information || {})
      }
      await refreshLibrary()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy('')
    }
  }

  const handleCreateReport = async (event) => {
    event.preventDefault()
    if (!selectedTemplateId || !selectedTemplateIsSaved || !projectTitle.trim() || !projectFiles.length) {
      setError('Save the analyzed college template first, then enter a project title and upload at least one project document.')
      return
    }
    setBusy('project')
    setError('')
    try {
      const body = new FormData()
      body.append('template_id', selectedTemplateId)
      body.append('project_title', projectTitle)
      projectFiles.forEach((file) => body.append('files', file))
      const created = await createCollegeReport(body)
      setReport(created)
      setExtractedInformation(created.extracted_information || {})
      setInformation(created.information || {})
      setComparison(null)
      setSearchParams({ report: created.report_id }, { replace: true })
      await refreshLibrary()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy('')
    }
  }

  const handleCompare = async () => {
    if (!report) return
    setBusy('compare')
    setError('')
    try {
      const result = await compareCollegeReportSections(report.report_id)
      setComparison(result)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy('')
    }
  }

  const saveInformation = async () => {
    if (!report) throw new Error('Create or select a college report first.')
    const saved = await updateCollegeReportInformation(
      report.report_id, information, projectTitle
    )
    setReport(saved)
    return saved
  }

  const handleGenerate = async () => {
    if (!report) return
    setBusy('generate')
    setError('')
    try {
      await saveInformation()
      const generated = await generateCollegeReport(report.report_id)
      setReport(generated)
      setComparison({
        sections: generated.section_comparison || [],
        missing_count: generated.missing_sections?.length || 0,
        provided_count: sections.length - (generated.missing_sections?.length || 0),
      })
      await refreshLibrary()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy('')
    }
  }

  const handleValidate = async () => {
    if (!report) return
    setBusy('validate')
    setError('')
    try {
      const result = await validateCollegeReport(report.report_id)
      setReport(result)
      await refreshLibrary()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy('')
    }
  }

  const handleExport = async (format) => {
    if (!report) return
    setExportState({ format, status: 'Preparing', error: '' })
    try {
      const blob = await exportCollegeReport(report.report_id, format)
      if (!(blob instanceof Blob) || !blob.size) {
        throw new Error('The server returned an empty report file.')
      }
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = `${(report.project_title || 'college-project-report')
        .replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '')}.${format}`
      document.body.appendChild(anchor)
      anchor.click()
      anchor.remove()
      window.setTimeout(() => URL.revokeObjectURL(url), 1000)
      setExportState({ format, status: 'Download started', error: '' })
    } catch (err) {
      setExportState({ format, status: 'Error', error: err.message })
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100 sm:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-emerald-600 p-3"><BookOpen /></div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-emerald-300">Separate college-report workflow</p>
              <h1 className="text-3xl font-bold">College Report Generator</h1>
              <p className="text-sm text-slate-400">Build project reports from your college sample and project documents.</p>
            </div>
          </div>
          <Link to="/dashboard" className="inline-flex items-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-sm hover:bg-slate-800">
            <ArrowLeft size={16} /> Dashboard
          </Link>
        </header>

        <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
          <ol className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {stages.map((stage, index) => (
              <li key={stage} className="flex items-center gap-2 rounded-lg bg-slate-950/70 p-3 text-sm">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-900 text-xs text-emerald-200">{index + 1}</span>
                {stage}
              </li>
            ))}
          </ol>
        </section>

        {error && <p role="alert" className="flex items-start gap-2 rounded-lg border border-red-500/40 bg-red-950/30 p-3 text-sm text-red-200"><AlertCircle size={17} />{error}</p>}

        <div className="grid gap-6 xl:grid-cols-2">
          <section className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
            <div>
              <h2 className="text-xl font-semibold">1. Upload and analyze college sample</h2>
              <p className="mt-1 text-sm text-slate-400">The uploaded template is inspected for actual headings and supported DOCX page/style settings.</p>
            </div>
            <form onSubmit={handleAnalyzeTemplate} className="grid gap-3 sm:grid-cols-2">
              <label className="text-sm">Template name
                <input value={templateName} onChange={(event) => setTemplateName(event.target.value)} placeholder="e.g. B.Tech project report" className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 p-2.5" />
              </label>
              <label className="text-sm">Semester / academic year
                <input value={semester} onChange={(event) => setSemester(event.target.value)} placeholder="e.g. Semester 6 · 2026–27" className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 p-2.5" />
              </label>
              <label className="sm:col-span-2 text-sm">College sample (PDF, DOCX, TXT, Markdown, or TeX)
                <input type="file" accept=".pdf,.docx,.txt,.md,.tex" onChange={(event) => setTemplateFile(event.target.files?.[0] || null)} className="mt-1 block w-full rounded-lg border border-slate-700 bg-slate-950 p-2 text-sm" />
              </label>
              <button disabled={busy === 'template'} className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-700 px-4 py-2 font-semibold hover:bg-emerald-600 disabled:opacity-50 sm:col-span-2">
                {busy === 'template' ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
                Analyze sample
              </button>
            </form>
            {analyzedTemplate && (
              <div className="rounded-xl border border-emerald-700/40 bg-emerald-950/20 p-4">
                <h3 className="font-semibold">Template analysis · {analyzedTemplate.source_filename}</h3>
                <p className="mt-1 text-xs text-slate-400">{analyzedTemplate.structure?.analysis_note}</p>
                <ul className="mt-3 grid gap-1 sm:grid-cols-2">
                  {(analyzedTemplate.structure?.sections || []).map((section) => <li key={section} className="rounded bg-slate-950/70 px-2 py-1.5 text-sm">{section}</li>)}
                </ul>
                {analyzedTemplate.structure?.formatting?.margins_inches && (
                  <p className="mt-3 text-xs text-slate-400">Detected margins (in): {JSON.stringify(analyzedTemplate.structure.formatting.margins_inches)} · Normal style: {JSON.stringify(analyzedTemplate.structure.formatting.normal_style)}</p>
                )}
                <button onClick={handleSaveTemplate} disabled={busy === 'save-template' || analyzedTemplate.is_saved} className="mt-3 inline-flex items-center gap-2 rounded-lg border border-emerald-500/50 px-3 py-2 text-sm hover:bg-emerald-900/40 disabled:opacity-50">
                  {analyzedTemplate.is_saved ? <Check size={15} /> : <Save size={15} />}
                  {analyzedTemplate.is_saved ? 'Template saved' : 'Save template'}
                </button>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium">Saved semester template</label>
              <select value={selectedTemplateId} onChange={(event) => handleTemplateSelection(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 p-2.5">
                <option value="">Choose a college template</option>
                {templates.map((template) => <option key={template.template_id} value={template.template_id}>{template.name}{template.semester ? ` · ${template.semester}` : ''}{template.is_saved ? '' : ' · analyzed, not saved'}</option>)}
              </select>
              {!selectedTemplateIsSaved && <p className="mt-2 text-xs text-amber-300">Save the analyzed sample in Step 1 before extracting project documents.</p>}
            </div>
            {currentTemplate && !currentTemplate.is_saved && !analyzedTemplate && (
              <div className="rounded-lg border border-amber-700/50 bg-amber-950/20 p-3 text-sm">
                <p className="font-medium">This template analysis has not been saved yet.</p>
                <p className="mt-1 text-xs text-slate-400">Save it here to keep the analyzed template available and continue to project documents.</p>
                <button onClick={handleSaveTemplate} disabled={busy === 'save-template'} className="mt-2 inline-flex items-center gap-2 rounded-lg border border-emerald-500/50 px-3 py-2 text-sm hover:bg-emerald-900/40 disabled:opacity-50">
                  {busy === 'save-template' ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                  Save selected template
                </button>
              </div>
            )}
            {currentTemplate?.is_saved && (
              <details className="rounded-lg border border-slate-800 bg-slate-950/50 p-3">
                <summary className="cursor-pointer text-sm text-slate-300">Review template sections ({sections.length})</summary>
                <ul className="mt-2 grid gap-1 sm:grid-cols-2">
                  {sections.slice(0, 30).map((section) => <li key={section} className="text-xs text-slate-400">{section}</li>)}
                </ul>
                {sections.length > 30 && <p className="mt-2 text-xs text-amber-300">Showing the first 30 section headings; use a clearer sample with only report headings for a more concise template.</p>}
                <button onClick={handleReanalyzeTemplate} disabled={busy === 'reanalyze-template'} className="mt-3 inline-flex items-center gap-2 rounded-lg border border-slate-600 px-3 py-2 text-xs hover:bg-slate-800 disabled:opacity-50">
                  {busy === 'reanalyze-template' ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
                  Re-analyze saved template sections
                </button>
              </details>
            )}
          </section>

          <section className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
            <div>
              <h2 className="text-xl font-semibold">2. Upload project documents</h2>
              <p className="mt-1 text-sm text-slate-400">Text is extracted from real uploaded files and remains separate from research-paper records.</p>
            </div>
            <form onSubmit={handleCreateReport} className="space-y-3">
              <label className="block text-sm">Project title
                <input value={projectTitle} onChange={(event) => setProjectTitle(event.target.value)} placeholder="Enter the college project title" className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 p-2.5" />
              </label>
              <label className="block text-sm">Project files (PDF, DOCX, TXT, Markdown, or TeX)
                <input type="file" multiple accept=".pdf,.docx,.txt,.md,.tex" onChange={(event) => setProjectFiles(Array.from(event.target.files || []))} className="mt-1 block w-full rounded-lg border border-slate-700 bg-slate-950 p-2 text-sm" />
              </label>
              {projectFiles.length > 0 && <p className="text-xs text-slate-400">{projectFiles.map((file) => file.name).join(' · ')}</p>}
              <button disabled={!selectedTemplateIsSaved || busy === 'project'} className="inline-flex items-center gap-2 rounded-lg bg-indigo-700 px-4 py-2 font-semibold hover:bg-indigo-600 disabled:cursor-not-allowed disabled:opacity-50">
                {busy === 'project' ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                Extract project information
              </button>
            </form>
          </section>
        </div>

        {report && (
          <>
            <section className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm text-emerald-300">{report.template_name}{report.semester ? ` · ${report.semester}` : ''}</p>
                  <h2 className="text-xl font-semibold">3. Required-section comparison and missing information</h2>
                  <p className="mt-1 text-xs text-slate-400">Extracted project text: {report.extracted_text?.length || 0} characters from {report.source_filenames?.length || 0} file(s). Missing facts are left for you to supply.</p>
                  {Object.keys(extractedInformation).length === 0 ? (
                    <p className="rounded-lg border border-amber-700/40 bg-amber-950/20 p-3 text-sm text-amber-100">
                      No template section headings were found in these project documents. The extracted text is available above; upload project-specific files with section headings or enter the missing content below.
                    </p>
                  ) : (
                    <p className="text-xs text-green-300">Detected project sections: {Object.keys(extractedInformation).join(' · ')}</p>
                  )}
                  <details className="rounded-lg border border-slate-800 bg-slate-950/60 p-3">
                    <summary className="cursor-pointer text-sm text-indigo-200">Review extracted source text</summary>
                    <pre className="mt-3 max-h-72 overflow-auto whitespace-pre-wrap text-xs leading-5 text-slate-300">{report.extracted_text}</pre>
                  </details>
                </div>
                <button onClick={handleCompare} disabled={busy === 'compare'} className="inline-flex items-center gap-2 rounded-lg border border-slate-600 px-3 py-2 text-sm hover:bg-slate-800 disabled:opacity-50">
                  {busy === 'compare' ? <Loader2 size={15} className="animate-spin" /> : <Search size={15} />}
                  Compare required sections
                </button>
              </div>
              {comparison && (
                <p className="text-sm text-slate-300">Sections found: {comparison.provided_count} · Need information: {comparison.missing_count}</p>
              )}
              <div className="grid gap-3 md:grid-cols-2">
                {sections.map((section) => {
                  const state = comparison?.sections?.find((item) => item.section === section)?.status
                  return (
                    <label key={section} className="text-sm">
                      <span className="flex items-center justify-between gap-2 font-medium">
                        {section}
                        {state && <span className={state === 'provided' ? 'text-xs text-green-300' : 'text-xs text-amber-300'}>{state === 'provided' ? 'Found in supplied material' : 'Information needed'}</span>}
                      </span>
                      {extractedInformation[section] && <p className="mt-2 rounded-md border border-blue-800/50 bg-blue-950/20 p-2 text-xs text-blue-100">Extracted from project document — review for accuracy. This text will be used unless you replace it below.</p>}
                      <textarea value={information[section] ?? extractedInformation[section] ?? ''} onChange={(event) => setInformation((previous) => ({ ...previous, [section]: event.target.value }))} rows={3} placeholder={state === 'provided' ? 'Optional: add precise section content from your project.' : `Provide the project-specific content required for ${section}.`} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 p-2.5" />
                    </label>
                  )
                })}
              </div>
              <div className="flex flex-wrap gap-2">
                <button onClick={handleGenerate} disabled={busy === 'generate'} className="inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-4 py-2 font-semibold hover:bg-emerald-600 disabled:opacity-50">
                  {busy === 'generate' ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                  Generate college report
                </button>
                <button onClick={handleValidate} disabled={!Object.keys(report.generated_content || {}).length || busy === 'validate'} className="inline-flex items-center gap-2 rounded-lg border border-slate-600 px-4 py-2 text-sm hover:bg-slate-800 disabled:opacity-50">
                  {busy === 'validate' ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
                  Validate format
                </button>
              </div>
            </section>

            {Object.keys(report.generated_content || {}).length > 0 && (
              <section className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-semibold">4. Preview college report</h2>
                    <p className="text-sm text-slate-400">Template section order and supported page settings are applied. Review missing-information notes before exporting.</p>
                  </div>
                  <div className="flex gap-2">
                    {['pdf', 'docx'].map((format) => (
                      <button key={format} onClick={() => handleExport(format)} disabled={exportState.status === 'Preparing'} className="inline-flex items-center gap-2 rounded-lg border border-emerald-600/50 px-3 py-2 text-sm hover:bg-emerald-950/40 disabled:opacity-50">
                        {exportState.status === 'Preparing' && exportState.format === format ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
                        Export {format.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>
                {report.validation && (
                  <div className={`rounded-lg border p-3 text-sm ${report.validation.valid ? 'border-green-700/50 bg-green-950/20 text-green-200' : 'border-amber-700/50 bg-amber-950/20 text-amber-100'}`}>
                    {report.validation.valid ? 'Format validation passed.' : `Needs attention: ${report.validation.missing_sections?.join(', ') || 'review template order and formatting.'}`}
                    {report.validation.warnings?.map((warning) => <p key={warning} className="mt-1 text-xs text-slate-400">{warning}</p>)}
                  </div>
                )}
                {exportState.status && (
                  <div aria-live="polite" className="text-sm">
                    {exportState.status === 'Error' ? (
                      <div role="alert" className="flex flex-wrap items-center gap-3 text-red-300">
                        <span>Export failed: {exportState.error}</span>
                        <button onClick={() => handleExport(exportState.format)} className="rounded border border-red-500/50 px-2 py-1">Retry</button>
                      </div>
                    ) : <p className="text-emerald-200">{exportState.status} · {exportState.format.toUpperCase()} <button onClick={() => setExportState((state) => ({ ...state, status: 'Downloaded' }))} className="ml-2 underline">Confirm downloaded</button></p>}
                  </div>
                )}
                <article className="mx-auto max-w-4xl space-y-6 rounded-lg bg-white p-6 text-slate-900 shadow-xl sm:p-10">
                  <header className="border-b pb-5 text-center">
                    <h3 className="text-2xl font-bold">{report.project_title}</h3>
                    <p className="mt-2 text-sm text-slate-500">{report.template_name}{report.semester ? ` · ${report.semester}` : ''}</p>
                  </header>
                  {Object.entries(report.generated_content).map(([heading, body]) => (
                    <section key={heading}>
                      <h4 className="mb-2 border-b border-slate-200 pb-1 text-lg font-semibold">{heading}</h4>
                      <p className="whitespace-pre-wrap text-justify leading-7">{body}</p>
                    </section>
                  ))}
                </article>
              </section>
            )}
          </>
        )}

        <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div><h2 className="text-xl font-semibold">Saved college reports</h2><p className="text-sm text-slate-400">This library is independent from My Research Papers.</p></div>
            <label className="relative">
              <Search size={14} className="absolute left-3 top-2.5 text-slate-500" />
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search college reports" className="rounded-lg border border-slate-700 bg-slate-950 py-2 pl-8 pr-3 text-sm" />
            </label>
          </div>
          {loading ? <p role="status" className="text-sm text-slate-400">Loading college reports…</p>
            : reports.length === 0 ? <p className="text-sm text-slate-400">No college reports created yet.</p> : (
            <div className="divide-y divide-slate-800">
              {filteredReports.map((item) => (
                <div key={item.report_id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <div><p className="font-medium">{item.project_title}</p><p className="text-xs text-slate-500">{item.template_name}{item.semester ? ` · ${item.semester}` : ''} · {item.status}</p></div>
                  <button onClick={() => loadReport(item.report_id)} disabled={busy === 'load'} className="inline-flex items-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-sm hover:bg-slate-800"><FileText size={14} /> Open report</button>
                </div>
              ))}
            </div>
          )}
          {busy === 'load' && <p className="mt-2 text-sm text-slate-400">Loading report…</p>}
        </section>
      </div>
    </main>
  )
}

export default CollegeReportGenerator
