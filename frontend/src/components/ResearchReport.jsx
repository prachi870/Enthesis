import React, { useState, useEffect } from 'react';
import {
  FileText, Download, AlertTriangle, CheckCircle, Info,
  ChevronDown, ChevronUp, ExternalLink, Activity, Target,
  TrendingUp, AlertCircle, Users, Book, Lightbulb, ListChecks, Shield
} from 'lucide-react';

const ResearchReport = ({ paperId }) => {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedSections, setExpandedSections] = useState({});
  const [activeTab, setActiveTab] = useState('executive');

  useEffect(() => {
    if (paperId) {
      loadReport();
    }
  }, [paperId]);

  const loadReport = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/v1/papers/${paperId}/report`
      );
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
        setError(`Failed to load report: ${errorData.detail || response.statusText}`);
        setLoading(false);
        return;
      }
      
      const data = await response.json();
      console.log('Report loaded:', data);
      setReport(data);
    } catch (error) {
      console.error('Failed to load report:', error);
      setError(`Error loading report: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const downloadReport = async (format) => {
    let loadingToast = null;
    try {
      // Show loading state
      loadingToast = document.createElement('div');
      loadingToast.className = 'fixed top-4 right-4 bg-blue-600 text-white px-6 py-4 rounded-lg shadow-2xl z-[9999] flex items-center gap-3 animate-float-gentle';
      loadingToast.innerHTML = `
        <svg class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span class="font-semibold">Downloading ${format.toUpperCase()} report...</span>
      `;
      document.body.appendChild(loadingToast);
      
      const response = await fetch(
        `/api/v1/papers/${paperId}/report/download?format=${format}`
      );
      
      if (!response.ok) {
        // Remove loading toast
        if (loadingToast && document.body.contains(loadingToast)) {
          document.body.removeChild(loadingToast);
        }
        
        const errorData = await response.json().catch(() => ({ detail: 'Download failed' }));
        
        // Show error toast
        const errorToast = document.createElement('div');
        errorToast.className = 'fixed top-4 right-4 bg-red-600 text-white px-6 py-4 rounded-lg shadow-2xl z-[9999]';
        errorToast.innerHTML = `<strong>❌ Error:</strong> ${errorData.detail || response.statusText}`;
        document.body.appendChild(errorToast);
        setTimeout(() => {
          if (document.body.contains(errorToast)) document.body.removeChild(errorToast);
        }, 5000);
        return;
      }
      
      const blob = await response.blob();
      
      // Remove loading toast
      if (loadingToast && document.body.contains(loadingToast)) {
        document.body.removeChild(loadingToast);
      }
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      
      // Set correct file extension
      const extensions = {
        'markdown': 'md',
        'json': 'json',
        'pdf': 'pdf',
        'docx': 'docx'
      };
      const filename = `enthesis_report_${paperId}_${Date.now()}.${extensions[format] || format}`;
      a.download = filename;
      
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      // Show success message
      const successToast = document.createElement('div');
      successToast.className = 'fixed top-4 right-4 bg-green-600 text-white px-6 py-4 rounded-lg shadow-2xl z-[9999] flex items-center gap-2';
      successToast.innerHTML = `
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
        </svg>
        <span class="font-semibold">✅ ${format.toUpperCase()} downloaded: ${filename}</span>
      `;
      document.body.appendChild(successToast);
      setTimeout(() => {
        if (document.body.contains(successToast)) document.body.removeChild(successToast);
      }, 4000);
      
    } catch (error) {
      console.error('Failed to download report:', error);
      
      // Remove loading toast if still there
      if (loadingToast && document.body.contains(loadingToast)) {
        document.body.removeChild(loadingToast);
      }
      
      // Show error toast
      const errorToast = document.createElement('div');
      errorToast.className = 'fixed top-4 right-4 bg-red-600 text-white px-6 py-4 rounded-lg shadow-2xl z-[9999]';
      errorToast.innerHTML = `<strong>❌ Download error:</strong> ${error.message}`;
      document.body.appendChild(errorToast);
      setTimeout(() => {
        if (document.body.contains(errorToast)) document.body.removeChild(errorToast);
      }, 5000);
    }
  };

  const toggleSection = (sectionId) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  const renderFindingCard = (finding, index) => {
    const isExpanded = expandedSections[`finding_${finding.finding_id}`];
    
    const typeColors = {
      'model_prediction': 'border-blue-200 bg-blue-50',
      'AI_GENERATED_SIMULATION': 'border-red-200 bg-red-50',
      'retrieved_evidence': 'border-green-200 bg-green-50'
    };

    return (
      <div
        key={finding.finding_id || index}
        className={`border-l-4 rounded-r-lg p-4 mb-3 ${typeColors[finding.type] || 'border-gray-200 bg-gray-50'}`}
      >
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2 py-1 bg-white rounded text-xs font-medium text-gray-700">
                {finding.type.replace('_', ' ')}
              </span>
              {finding.confidence !== undefined && (
                <span className="text-xs text-gray-600">
                  Confidence: {(finding.confidence * 100).toFixed(0)}%
                </span>
              )}
            </div>
            <p className="text-gray-900 mb-2">{finding.description}</p>
            {finding.relevant_section && (
              <p className="text-sm text-gray-600">
                <strong>Section:</strong> {finding.relevant_section}
              </p>
            )}
          </div>
          <button
            onClick={() => toggleSection(`finding_${finding.finding_id}`)}
            className="p-1 hover:bg-white rounded transition-colors"
          >
            {isExpanded ? (
              <ChevronUp className="w-5 h-5 text-gray-600" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-600" />
            )}
          </button>
        </div>

        {isExpanded && (
          <div className="mt-3 pt-3 border-t border-gray-200 space-y-3">
            {/* Evidence */}
            {finding.evidence && (
              <div className="bg-white p-3 rounded border border-gray-200">
                <h5 className="text-sm font-semibold text-gray-900 mb-2">Evidence</h5>
                <pre className="text-xs text-gray-700 whitespace-pre-wrap">
                  {JSON.stringify(finding.evidence, null, 2)}
                </pre>
              </div>
            )}

            {/* System Interpretation */}
            {finding.system_interpretation && (
              <div className="bg-yellow-50 p-3 rounded border border-yellow-200">
                <h5 className="text-sm font-semibold text-gray-900 mb-1">System Interpretation</h5>
                <p className="text-sm text-gray-700">{finding.system_interpretation}</p>
              </div>
            )}

            {/* Recommended Investigation */}
            {finding.recommended_investigation && (
              <div className="bg-blue-50 p-3 rounded border border-blue-200">
                <h5 className="text-sm font-semibold text-gray-900 mb-2">Recommended Investigation</h5>
                <ul className="text-sm text-gray-700 space-y-1">
                  {finding.recommended_investigation.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-blue-600 mt-0.5">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Researcher Action */}
            {finding.researcher_action && (
              <div className="bg-purple-50 p-3 rounded border border-purple-200">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="w-4 h-4 text-purple-600" />
                  <h5 className="text-sm font-semibold text-gray-900">Researcher Action Required</h5>
                </div>
                {finding.researcher_action.priority && (
                  <p className="text-xs text-purple-700 mb-2">
                    Priority: <strong>{finding.researcher_action.priority}</strong>
                  </p>
                )}
                <ul className="text-sm text-gray-700 space-y-1">
                  {finding.researcher_action.actions.map((action, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
                      <span>{action}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        <span className="ml-3 text-lg text-gray-600">Generating report...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-12">
        <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-red-500" />
        <p className="text-red-600 font-semibold mb-2">Error Loading Report</p>
        <p className="text-gray-600 mb-4">{error}</p>
        <button
          onClick={loadReport}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="text-center p-12 glass-card rounded-2xl">
        <FileText className="w-16 h-16 mx-auto mb-4 text-gray-400" />
        <p className="text-gray-600 mb-4">Report not available</p>
        <p className="text-sm text-gray-500 mb-4">The report might still be generating or data format is different.</p>
        <div className="flex gap-2 justify-center">
          <button
            onClick={loadReport}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Try Loading Report
          </button>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
          >
            Refresh Page
          </button>
        </div>
        <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
          <p className="text-sm text-gray-700">
            <strong>Quick Fix:</strong> Try the download buttons below - they work independently!
          </p>
          <div className="flex gap-2 justify-center mt-4 flex-wrap">
            <button
              onClick={() => downloadReport('pdf')}
              className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 text-sm"
            >
              📄 Download PDF
            </button>
            <button
              onClick={() => downloadReport('docx')}
              className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm"
            >
              📘 Download DOCX
            </button>
            <button
              onClick={() => downloadReport('markdown')}
              className="px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 text-sm"
            >
              📝 Download Markdown
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-2xl shadow-2xl">
      {/* Header */}
      <div className="border-b border-gray-700/50 p-6 bg-gradient-to-r from-slate-900/50 to-slate-800/50">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-3xl font-bold text-gradient mb-2">Research Feedback Report</h2>
            <p className="text-slate-300">{report.paper_title || 'Research Paper'}</p>
            <p className="text-sm text-slate-500 mt-1">
              Generated: {report.generated_at ? new Date(report.generated_at).toLocaleString() : 'Just now'}
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => downloadReport('pdf')}
              className="flex items-center gap-2 px-4 py-2 gradient-bg-red text-white rounded-lg hover:scale-105 transition-all shadow-lg"
              title="Download as PDF"
            >
              <Download className="w-4 h-4" />
              PDF
            </button>
            <button
              onClick={() => downloadReport('docx')}
              className="flex items-center gap-2 px-4 py-2 gradient-bg-blue text-white rounded-lg hover:scale-105 transition-all shadow-lg"
              title="Download as Word Document"
            >
              <Download className="w-4 h-4" />
              DOCX
            </button>
            <button
              onClick={() => downloadReport('markdown')}
              className="flex items-center gap-2 px-4 py-2 gradient-bg-green text-white rounded-lg hover:scale-105 transition-all shadow-lg"
              title="Download as Markdown"
            >
              <Download className="w-4 h-4" />
              Markdown
            </button>
            <button
              onClick={() => downloadReport('json')}
              className="flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:scale-105 transition-all shadow-lg"
              title="Download as JSON"
            >
              <Download className="w-4 h-4" />
              JSON
            </button>
          </div>
        </div>
      </div>

      {/* Important Notices */}
      {report.important_notices && (
        <div className="bg-red-900/20 border-l-4 border-red-500 p-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-lg font-bold text-red-300 mb-2">⚠️ IMPORTANT NOTICES</h3>
              <p className="text-red-200 mb-3">{report.important_notices.primary_disclaimer}</p>
              {report.important_notices.key_notices && (
                <ul className="space-y-2">
                  {report.important_notices.key_notices.map((notice, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-red-200">
                      <span className="font-bold mt-0.5">•</span>
                      <span>{notice}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="border-b border-gray-700/50 px-6 bg-slate-900/30">
        <div className="flex gap-2 overflow-x-auto">
          {[
            { id: 'executive', label: 'Executive Summary', icon: FileText, show: !!report.executive_summary },
            { id: 'health', label: 'Health Overview', icon: Activity, show: !!report.research_health_overview },
            { id: 'related', label: 'Related Work', icon: Book, show: !!report.related_work },
            { id: 'novelty', label: 'Novelty', icon: Lightbulb, show: !!report.novelty_analysis },
            { id: 'weaknesses', label: 'Weaknesses', icon: AlertCircle, show: !!report.potential_weaknesses },
            { id: 'clarity', label: 'Clarity', icon: Target, show: !!report.clarity_analysis },
            { id: 'reviewer', label: 'Reviewer Feedback', icon: Users, show: !!report.reviewer_feedback },
            { id: 'actions', label: 'Action Items', icon: ListChecks, show: !!report.action_items },
            { id: 'limitations', label: 'Limitations', icon: Shield, show: !!report.limitations }
          ].filter(tab => tab.show).map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-purple-500 text-purple-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {activeTab === 'executive' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Executive Summary</h3>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <h4 className="font-semibold text-gray-900 mb-2">Overview</h4>
                <p className="text-gray-700 mb-2">{report.executive_summary.overview.description}</p>
                <div className="grid grid-cols-2 gap-4 mt-3">
                  <div>
                    <span className="text-sm text-gray-600">Total Findings:</span>
                    <span className="ml-2 font-bold text-gray-900">
                      {report.executive_summary.overview.total_findings}
                    </span>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Modules Analyzed:</span>
                    <span className="ml-2 font-bold text-gray-900">
                      {Object.keys(report.executive_summary.overview.findings_breakdown).length}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <h4 className="font-semibold text-gray-900 mb-2">Key Observations</h4>
                <ul className="space-y-2">
                  {report.executive_summary.key_observations.map((obs, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-gray-700">
                      <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                      <span>{obs}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Next Steps</h4>
                <ul className="space-y-2">
                  {report.executive_summary.next_steps.map((step, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-gray-700">
                      <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>{step}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'health' && report.research_health_overview && (
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-gray-900">Research Health Overview</h3>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800">
                {report.research_health_overview.interpretation_guide.note}
              </p>
            </div>
            {/* Add indicator displays here */}
            <p className="text-gray-600">{report.research_health_overview.important_note}</p>
          </div>
        )}

        {activeTab === 'related' && report.related_work && (
          <div className="space-y-4">
            <div className="flex items-start gap-3 mb-4">
              <Info className="w-5 h-5 text-blue-600 mt-0.5" />
              <p className="text-sm text-gray-600">{report.related_work.section_note}</p>
            </div>
            {report.related_work.findings.map((finding, idx) => renderFindingCard(finding, idx))}
          </div>
        )}

        {activeTab === 'novelty' && report.novelty_analysis && (
          <div className="space-y-4">
            <div className="flex items-start gap-3 mb-4">
              <Info className="w-5 h-5 text-blue-600 mt-0.5" />
              <p className="text-sm text-gray-600">{report.novelty_analysis.section_note}</p>
            </div>
            {report.novelty_analysis.findings.map((finding, idx) => renderFindingCard(finding, idx))}
          </div>
        )}

        {activeTab === 'weaknesses' && report.potential_weaknesses && (
          <div className="space-y-4">
            <div className="flex items-start gap-3 mb-4">
              <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
              <p className="text-sm text-gray-600">{report.potential_weaknesses.section_note}</p>
            </div>
            {report.potential_weaknesses.findings.map((finding, idx) => renderFindingCard(finding, idx))}
          </div>
        )}

        {activeTab === 'clarity' && report.clarity_analysis && (
          <div className="space-y-4">
            <div className="flex items-start gap-3 mb-4">
              <Info className="w-5 h-5 text-blue-600 mt-0.5" />
              <p className="text-sm text-gray-600">{report.clarity_analysis.section_note}</p>
            </div>
            {report.clarity_analysis.findings.map((finding, idx) => renderFindingCard(finding, idx))}
          </div>
        )}

        {activeTab === 'reviewer' && report.reviewer_feedback && (
          <div className="space-y-4">
            <div className="bg-red-100 border-l-4 border-red-600 p-4 mb-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0" />
                <div>
                  <p className="font-bold text-red-900 mb-1">WARNING</p>
                  <p className="text-sm text-red-800">{report.reviewer_feedback.IMPORTANT_WARNING}</p>
                </div>
              </div>
            </div>
            {report.reviewer_feedback.findings.map((finding, idx) => renderFindingCard(finding, idx))}
          </div>
        )}

        {activeTab === 'actions' && report.action_items && (
          <div className="space-y-6">
            <p className="text-gray-600">{report.action_items.researcher_note}</p>
            
            {['high_priority', 'medium_priority', 'low_priority'].map((priority) => {
              const items = report.action_items.prioritization[priority]?.items || [];
              if (items.length === 0) return null;
              
              const colors = {
                high_priority: 'border-red-500 bg-red-50',
                medium_priority: 'border-yellow-500 bg-yellow-50',
                low_priority: 'border-blue-500 bg-blue-50'
              };
              
              return (
                <div key={priority}>
                  <h4 className="font-semibold text-gray-900 mb-3 capitalize">
                    {priority.replace('_', ' ')} ({items.length})
                  </h4>
                  <div className="space-y-2">
                    {items.map((item, idx) => (
                      <div key={idx} className={`border-l-4 ${colors[priority]} p-3 rounded-r-lg`}>
                        <p className="font-medium text-gray-900">{item.title}</p>
                        <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === 'limitations' && report.limitations && (
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">System Limitations</h3>
            {report.limitations.system_limitations.map((limitation, idx) => (
              <div key={idx} className="border-l-4 border-orange-500 bg-orange-50 p-4 rounded-r-lg">
                <h4 className="font-semibold text-gray-900 mb-2">{limitation.limitation}</h4>
                <p className="text-gray-700 mb-2">{limitation.description}</p>
                <p className="text-sm text-orange-800">
                  <strong>Impact:</strong> {limitation.impact}
                </p>
              </div>
            ))}

            <div className="mt-6">
              <h4 className="font-semibold text-gray-900 mb-3">What This System Cannot Do</h4>
              <ul className="space-y-2">
                {report.limitations.what_system_cannot_do.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-gray-700">
                    <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResearchReport;
