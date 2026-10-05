/**
 * API utility functions for authenticated requests
 */
import { supabase } from '../lib/supabase'

const API_BASE_URL = '/api/v1'

/**
 * Get auth token from localStorage
 */
export const getAuthToken = () => {
  return localStorage.getItem('token')
}

/**
 * Get user data from localStorage
 */
export const getUser = () => {
  const userStr = localStorage.getItem('user')
  return userStr ? JSON.parse(userStr) : null
}

/**
 * Check if user is authenticated
 */
export const isAuthenticated = () => {
  return !!getAuthToken()
}

/**
 * Logout user
 */
export const logout = async () => {
  try {
    if (supabase) await supabase.auth.signOut({ scope: 'local' })
  } catch (error) {
    if (import.meta.env.DEV) console.error('Supabase sign-out failed:', error)
  } finally {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    window.location.href = '/login'
  }
}

/**
 * Make authenticated API request
 */
export const apiRequest = async (endpoint, options = {}) => {
  const token = getAuthToken()
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  }
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  
  const config = {
    ...options,
    headers,
  }
  
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config)
    
    // Handle 401 Unauthorized
    if (response.status === 401) {
      logout()
      throw new Error('Session expired. Please login again.')
    }
    
    // Parse response
    const data = await response.json()
    
    if (!response.ok) {
      throw new Error(data.detail || `Request failed with status ${response.status}`)
    }
    
    return data
  } catch (error) {
    console.error('API request error:', error)
    throw error
  }
}

/**
 * Upload paper with authentication
 */
export const uploadPaper = async (file, author = '') => {
  const token = getAuthToken()
  
  const formData = new FormData()
  formData.append('file', file)
  formData.append('author', author)
  
  const response = await fetch(`${API_BASE_URL}/papers/upload`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: formData,
  })
  
  if (response.status === 401) {
    logout()
    throw new Error('Session expired. Please login again.')
  }
  
  const data = await response.json()
  
  if (!response.ok) {
    throw new Error(data.detail || 'Upload failed')
  }
  
  return data
}

/**
 * Get list of papers
 */
export const getPapers = async (search = '') => {
  const query = search ? `?search=${encodeURIComponent(search)}` : ''
  return apiRequest(`/papers/list${query}`)
}

/**
 * Get paper details
 */
export const getPaper = async (paperId) => {
  return apiRequest(`/papers/${paperId}`)
}

/**
 * Get paper with full text
 */
export const getPaperWithText = async (paperId) => {
  return apiRequest(`/papers/${paperId}`)
}

/**
 * Delete paper
 */
export const deletePaper = async (paperId) => {
  return apiRequest(`/papers/${paperId}`, {
    method: 'DELETE',
  })
}

/**
 * Start analysis pipeline
 */
export const startAnalysis = async (paperId) => {
  return apiRequest(`/papers/${paperId}/pipeline/start`, {
    method: 'POST',
  })
}

/**
 * Get analysis results
 */
export const getResults = async (paperId) => {
  return apiRequest(`/papers/${paperId}/results`)
}

/**
 * Get analysis report
 */
export const getReport = async (paperId) => {
  return apiRequest(`/papers/${paperId}/report`)
}

/**
 * Download report
 */
export const downloadReport = async (paperId) => {
  const token = getAuthToken()
  
  const response = await fetch(`${API_BASE_URL}/papers/${paperId}/download`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  })
  
  if (response.status === 401) {
    logout()
    throw new Error('Session expired. Please login again.')
  }
  
  if (!response.ok) {
    throw new Error('Download failed')
  }
  
  return response.blob()
}

/**
 * Approve a completed stage
 */
export const approveStage = async (paperId, stage) => {
  return apiRequest(`/papers/${paperId}/stages/${stage}/approve`, {
    method: 'POST',
  })
}
