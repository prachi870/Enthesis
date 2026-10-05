const API_ROOT = '/api/v1/college-reports'

const request = async (path, options = {}) => {
  const token = localStorage.getItem('token')
  const headers = {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  }
  if (options.body && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json'
  }
  const response = await fetch(`${API_ROOT}${path}`, { ...options, headers })
  const contentType = response.headers.get('content-type') || ''
  const body = contentType.includes('application/json')
    ? await response.json()
    : await response.blob()
  if (!response.ok) {
    const detail = body?.detail || body?.message || `Request failed (${response.status})`
    throw new Error(detail)
  }
  return body
}

export const listCollegeTemplates = () => request('/templates')
export const analyzeCollegeTemplate = (formData) => request('/templates/analyze', {
  method: 'POST',
  body: formData,
})
export const saveCollegeTemplate = (templateId) => request(`/templates/${templateId}/save`, {
  method: 'POST',
})
export const reanalyzeCollegeTemplate = (templateId) => request(`/templates/${templateId}/reanalyze`, {
  method: 'POST',
})
export const listCollegeReports = () => request('/reports')
export const createCollegeReport = (formData) => request('/reports', {
  method: 'POST',
  body: formData,
})
export const getCollegeReport = (reportId) => request(`/reports/${reportId}`)
export const updateCollegeReportInformation = (reportId, information, projectTitle) => request(
  `/reports/${reportId}/information`,
  { method: 'PUT', body: JSON.stringify({ information, project_title: projectTitle }) }
)
export const compareCollegeReportSections = (reportId) => request(`/reports/${reportId}/compare`, {
  method: 'POST',
})
export const generateCollegeReport = (reportId) => request(`/reports/${reportId}/generate`, {
  method: 'POST',
})
export const validateCollegeReport = (reportId) => request(`/reports/${reportId}/validate`, {
  method: 'POST',
})
export const exportCollegeReport = (reportId, format) => request(
  `/reports/${reportId}/export?format=${encodeURIComponent(format)}`
)
