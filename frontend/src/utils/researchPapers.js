const API_ROOT = '/api/v1/research-papers'

const request = async (path, options = {}) => {
  const token = localStorage.getItem('token')
  const headers = {
    ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  }
  const response = await fetch(`${API_ROOT}${path}`, { ...options, headers })
  const contentType = response.headers.get('content-type') || ''
  const body = contentType.includes('application/json')
    ? await response.json()
    : await response.blob()

  if (!response.ok) {
    const message = body?.detail || body?.message || `Request failed (${response.status})`
    throw new Error(message)
  }
  return body
}

export const listResearchPapers = () => request('')
export const getResearchPaper = (paperId) => request(`/${paperId}`)
export const createResearchPaper = (details) => request('', {
  method: 'POST',
  body: JSON.stringify(details),
})
export const saveResearchPaper = (paperId, details) => request(`/${paperId}`, {
  method: 'PUT',
  body: JSON.stringify(details),
})
export const generateResearchPaper = (paperId) => request(`/${paperId}/generate`, {
  method: 'POST',
})
export const regenerateResearchSection = (paperId, sectionKey) => request(
  `/${paperId}/sections/${encodeURIComponent(sectionKey)}/regenerate`,
  { method: 'POST' }
)
export const analyzeResearchPaper = (paperId) => request(`/${paperId}/analyze`, {
  method: 'POST',
})
export const getResearchPaperAnalysis = (paperId, runId) => request(`/${paperId}/analysis/${runId}`)
export const retryResearchPaperAnalysisModule = (paperId, runId, module) => request(
  `/${paperId}/analysis/${runId}/retry/${encodeURIComponent(module)}`,
  { method: 'POST' }
)
export const listResearchPaperActions = (paperId, runId) => request(`/${paperId}/analysis/${runId}/actions`)
export const createResearchPaperAction = (paperId, runId, findingId) => request(
  `/${paperId}/analysis/${runId}/actions`,
  { method: 'POST', body: JSON.stringify({ finding_id: findingId }) }
)
export const updateResearchPaperAction = (paperId, runId, actionId, status) => request(
  `/${paperId}/analysis/${runId}/actions/${actionId}`,
  { method: 'PATCH', body: JSON.stringify({ status }) }
)
export const generateResearchPaperAnalysisReport = (paperId, runId) => request(
  `/${paperId}/analysis/${runId}/report`
)
export const exportResearchPaperAnalysisReport = (paperId, runId, format) => request(
  `/${paperId}/analysis/${runId}/report/export?format=${encodeURIComponent(format)}`
)
export const createResearchPaperVersion = (paperId, content) => request(`/${paperId}/versions`, {
  method: 'POST',
  body: JSON.stringify({ content }),
})
export const listResearchPaperVersions = (paperId) => request(`/${paperId}/versions`)
export const compareResearchPaperVersions = (paperId, versionId, otherVersionId) => request(
  `/${paperId}/versions/${versionId}/compare?other_version_id=${encodeURIComponent(otherVersionId)}`
)
export const exportResearchPaper = (paperId, format) => request(
  `/${paperId}/export?format=${encodeURIComponent(format)}`
)
export const updateResearchPaperExportStatus = (paperId, status) => request(
  `/${paperId}/export/status`,
  { method: 'POST', body: JSON.stringify({ status }) }
)
