import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Signup from './pages/Signup'
import AuthCallback from './pages/AuthCallback'
import Dashboard from './pages/Dashboard'
import ResearchPaperBuilder from './pages/ResearchPaperBuilder'
import MyResearchPapers from './pages/MyResearchPapers'
import CollegeReportGenerator from './pages/CollegeReportGenerator'
import App from './App'

// Protected Route wrapper
function ProtectedRoute({ children }) {
  const user = localStorage.getItem('user')
  return user ? <div className="app-route-shell">{children}</div> : <Navigate to="/login" replace />
}

// Public Route wrapper (redirect to dashboard if logged in)
function PublicRoute({ children }) {
  const user = localStorage.getItem('user')
  return user ? <Navigate to="/dashboard" replace /> : children
}

function AppWithRouting() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/login" element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        } />
        
        <Route path="/signup" element={
          <PublicRoute>
            <Signup />
          </PublicRoute>
        } />

        {/* Protected Routes */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />

        <Route path="/my-research-papers" element={
          <ProtectedRoute>
            <MyResearchPapers />
          </ProtectedRoute>
        } />

        <Route path="/college-reports" element={
          <ProtectedRoute>
            <CollegeReportGenerator />
          </ProtectedRoute>
        } />

        <Route path="/research-papers/new" element={
          <ProtectedRoute>
            <ResearchPaperBuilder />
          </ProtectedRoute>
        } />

        <Route path="/research-papers/:paperId/edit" element={
          <ProtectedRoute>
            <ResearchPaperBuilder />
          </ProtectedRoute>
        } />

        <Route path="/analyze" element={
          <ProtectedRoute>
            <App />
          </ProtectedRoute>
        } />

        <Route path="/paper/:id" element={
          <ProtectedRoute>
            <App />
          </ProtectedRoute>
        } />

        {/* Default redirect */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  )
}

export default AppWithRouting
