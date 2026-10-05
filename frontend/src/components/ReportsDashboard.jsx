import React, { useState, useEffect } from 'react';
import {
  FileText, Download, Clock, CheckCircle, XCircle, AlertCircle,
  Calendar, TrendingUp, RefreshCw, Eye, Trash2, Filter
} from 'lucide-react';

const ReportsDashboard = ({ onPaperSelect }) => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, ready, generating, failed
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadReports();
    // Auto-refresh every 10 seconds if there are generating reports
    const interval = setInterval(() => {
      const hasGenerating = reports.some(r => r.status === 'generating');
      if (hasGenerating) {
        loadReports(true);
      }
    }, 10000);
    
    return () => clearInterval(interval);
  }, []);

  const loadReports = async (silent = false) => {
    if (!silent) setLoading(true);
    setRefreshing(true);
    
    try {
      const response = await fetch('/api/v1/reports/list');
      if (response.ok) {
        const data = await response.json();
        setReports(data.reports || []);
      }
    } catch (error) {
      console.error('Error loading reports:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const downloadReport = async (reportId, format, paperTitle) => {
    const loadingToast = document.createElement('div');
    loadingToast.className = 'fixed top-4 right-4 bg-blue-600 text-white px-6 py-4 rounded-lg shadow-2xl z-[9999] flex items-center gap-3';
    loadingToast.innerHTML = `
      <svg class="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      <span class="font-semibold">Downloading ${format.toUpperCase()}...</span>
    `;
    document.body.appendChild(loadingToast);
    
    try {
      const response = await fetch(
        `/api/v1/reports/download/${reportId}?format=${format}`
      );
      
      if (!response.ok) {
        throw new Error('Download failed');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${paperTitle.replace(/[^a-z0-9]/gi, '_')}_report.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      document.body.removeChild(loadingToast);
      
      // Success toast
      const successToast = document.createElement('div');
      successToast.className = 'fixed top-4 right-4 bg-green-600 text-white px-6 py-4 rounded-lg shadow-2xl z-[9999]';
      successToast.innerHTML = `✅ ${format.toUpperCase()} downloaded!`;
      document.body.appendChild(successToast);
      setTimeout(() => document.body.removeChild(successToast), 3000);
      
    } catch (error) {
      document.body.removeChild(loadingToast);
      const errorToast = document.createElement('div');
      errorToast.className = 'fixed top-4 right-4 bg-red-600 text-white px-6 py-4 rounded-lg shadow-2xl z-[9999]';
      errorToast.innerHTML = `❌ Download failed`;
      document.body.appendChild(errorToast);
      setTimeout(() => document.body.removeChild(errorToast), 3000);
    }
  };

  const deleteReport = async (reportId) => {
    if (!confirm('Delete this report?')) return;
    
    try {
      const response = await fetch(
        `/api/v1/reports/${reportId}`,
        { method: 'DELETE' }
      );
      
      if (response.ok) {
        setReports(reports.filter(r => r.report_id !== reportId));
      }
    } catch (error) {
      alert('Failed to delete report');
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      ready: { icon: CheckCircle, color: 'bg-green-500/20 text-green-300 border-green-500/30', label: 'Ready' },
      generating: { icon: Clock, color: 'bg-blue-500/20 text-blue-300 border-blue-500/30', label: 'Generating' },
      failed: { icon: XCircle, color: 'bg-red-500/20 text-red-300 border-red-500/30', label: 'Failed' }
    };
    
    const badge = badges[status] || badges.generating;
    const Icon = badge.icon;
    
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium border flex items-center gap-1 ${badge.color}`}>
        <Icon className="w-3 h-3" />
        {badge.label}
      </span>
    );
  };

  const filteredReports = reports.filter(r => {
    if (filter === 'all') return true;
    return r.status === filter;
  });

  const stats = {
    total: reports.length,
    ready: reports.filter(r => r.status === 'ready').length,
    generating: reports.filter(r => r.status === 'generating').length,
    failed: reports.filter(r => r.status === 'failed').length
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400"></div>
        <span className="ml-3 text-lg text-slate-300">Loading reports...</span>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-gradient mb-2">Reports Dashboard</h1>
          <p className="text-slate-400">All generated research reports across papers</p>
        </div>
        <button
          onClick={() => loadReports()}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 gradient-bg-purple text-white rounded-lg hover:scale-105 transition-all"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Total Reports</p>
              <p className="text-3xl font-bold text-white">{stats.total}</p>
            </div>
            <FileText className="w-10 h-10 text-purple-400" />
          </div>
        </div>
        
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Ready</p>
              <p className="text-3xl font-bold text-green-400">{stats.ready}</p>
            </div>
            <CheckCircle className="w-10 h-10 text-green-400" />
          </div>
        </div>
        
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Generating</p>
              <p className="text-3xl font-bold text-blue-400">{stats.generating}</p>
            </div>
            <Clock className="w-10 h-10 text-blue-400" />
          </div>
        </div>
        
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Failed</p>
              <p className="text-3xl font-bold text-red-400">{stats.failed}</p>
            </div>
            <XCircle className="w-10 h-10 text-red-400" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 glass-card rounded-xl p-2">
        <Filter className="w-4 h-4 text-slate-400 ml-2" />
        {['all', 'ready', 'generating', 'failed'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              filter === f
                ? 'gradient-bg-purple text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Reports List */}
      <div className="glass-card rounded-2xl shadow-2xl">
        <div className="p-6 border-b border-slate-700/50">
          <h2 className="text-xl font-bold text-gradient">Reports ({filteredReports.length})</h2>
        </div>
        
        {filteredReports.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400">No reports found</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-700/50">
            {filteredReports.map(report => (
              <div key={report.report_id} className="p-6 hover:bg-slate-800/30 transition-all">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <FileText className="w-5 h-5 text-purple-400" />
                      <h3 
                        className="text-lg font-semibold text-white hover:text-purple-400 cursor-pointer transition-colors"
                        onClick={() => onPaperSelect && onPaperSelect(report.paper_id)}
                      >
                        {report.paper_title}
                      </h3>
                      {getStatusBadge(report.status)}
                    </div>
                    
                    <div className="flex items-center gap-6 text-sm text-slate-400 mb-3">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {new Date(report.generated_at).toLocaleString()}
                      </div>
                      <div className="flex items-center gap-1">
                        <TrendingUp className="w-4 h-4" />
                        {report.total_findings} findings
                      </div>
                    </div>
                    
                    {report.findings_breakdown && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {Object.entries(report.findings_breakdown).map(([module, count]) => (
                          <span key={module} className="badge badge-info text-xs">
                            {module}: {count}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {report.status === 'ready' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => downloadReport(report.report_id, 'pdf', report.paper_title)}
                        className="px-3 py-2 gradient-bg-red text-white rounded-lg hover:scale-105 transition-all text-sm"
                        title="Download PDF"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => downloadReport(report.report_id, 'docx', report.paper_title)}
                        className="px-3 py-2 gradient-bg-blue text-white rounded-lg hover:scale-105 transition-all text-sm"
                        title="Download DOCX"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => downloadReport(report.report_id, 'markdown', report.paper_title)}
                        className="px-3 py-2 gradient-bg-green text-white rounded-lg hover:scale-105 transition-all text-sm"
                        title="Download Markdown"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteReport(report.report_id)}
                        className="px-3 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-all text-sm"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                  
                  {report.status === 'failed' && (
                    <div className="text-sm text-red-400">
                      {report.error_message || 'Generation failed'}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportsDashboard;
