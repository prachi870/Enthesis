import React, { useState, useCallback, useMemo } from 'react';
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  Panel,
  MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Search, Filter, X, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';

/**
 * ResearchLandscape - Interactive graph visualization for Related Work module
 * 
 * Shows student's paper and related research papers as an interactive network.
 * Displays similarity relationships, clusters, and detailed paper information.
 * 
 * Features:
 * - Zoom & Pan
 * - Search papers
 * - Filter by similarity
 * - Click to view details
 * - Only shows relationships from actual retrieval results
 */
const ResearchLandscape = ({ moduleData, studentPaper }) => {
  const [selectedPaper, setSelectedPaper] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [similarityFilter, setSimilarityFilter] = useState(0);
  const [showFilters, setShowFilters] = useState(false);

  // Extract related papers from module evidence
  const relatedPapers = useMemo(() => {
    if (!moduleData?.evidence || !Array.isArray(moduleData.evidence)) {
      return [];
    }
    return moduleData.evidence;
  }, [moduleData]);

  // Extract methods and datasets from findings
  const extractedData = useMemo(() => {
    if (!moduleData?.findings || !Array.isArray(moduleData.findings)) {
      return { methods: [], datasets: [] };
    }
    
    const methodsItem = moduleData.findings.find(f => f.type === 'methods_extracted');
    const datasetsItem = moduleData.findings.find(f => f.type === 'datasets_extracted');
    
    return {
      methods: methodsItem?.items || [],
      datasets: datasetsItem?.items || [],
    };
  }, [moduleData]);

  // Build nodes and edges from actual data
  const { initialNodes, initialEdges } = useMemo(() => {
    const nodes = [];
    const edges = [];

    // Student paper node (center)
    nodes.push({
      id: 'student-paper',
      type: 'default',
      data: {
        label: (
          <div className="text-center px-4 py-2">
            <div className="font-bold text-blue-600">Your Paper</div>
            <div className="text-xs text-gray-600 mt-1">
              {studentPaper?.title || 'Student Research Paper'}
            </div>
          </div>
        ),
      },
      position: { x: 400, y: 300 },
      style: {
        background: '#3B82F6',
        color: 'white',
        border: '2px solid #1E40AF',
        borderRadius: '12px',
        padding: '10px',
        width: 220,
        fontSize: '13px',
      },
    });

    // Add related papers in a circular layout
    const angleStep = (2 * Math.PI) / Math.max(relatedPapers.length, 1);
    const radius = 250;

    relatedPapers.forEach((paper, index) => {
      const angle = index * angleStep;
      const x = 400 + radius * Math.cos(angle);
      const y = 300 + radius * Math.sin(angle);

      // Determine node color based on similarity
      const similarity = paper.similarity || 0;
      let bgColor = '#10B981'; // green
      if (similarity < 0.6) bgColor = '#EF4444'; // red
      else if (similarity < 0.75) bgColor = '#F59E0B'; // orange

      nodes.push({
        id: paper.paper_id,
        type: 'default',
        data: {
          label: (
            <div className="text-center px-3 py-2">
              <div className="font-semibold text-xs mb-1">
                {paper.title || `Related Paper ${index + 1}`}
              </div>
              <div className="text-xs opacity-80">
                Similarity: {(similarity * 100).toFixed(0)}%
              </div>
            </div>
          ),
        },
        position: { x, y },
        style: {
          background: bgColor,
          color: 'white',
          border: '2px solid rgba(255,255,255,0.3)',
          borderRadius: '8px',
          padding: '8px',
          width: 180,
          fontSize: '11px',
        },
      });

      // Create edge from student paper to related paper
      // Only create edges that are supported by actual retrieval results
      edges.push({
        id: `e-student-${paper.paper_id}`,
        source: 'student-paper',
        target: paper.paper_id,
        animated: similarity > 0.8,
        style: {
          stroke: similarity > 0.8 ? '#3B82F6' : '#9CA3AF',
          strokeWidth: similarity > 0.8 ? 2 : 1,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: similarity > 0.8 ? '#3B82F6' : '#9CA3AF',
        },
        label: `${(similarity * 100).toFixed(0)}%`,
        labelStyle: { fill: '#374151', fontSize: 10 },
        labelBgStyle: { fill: 'white' },
      });
    });

    return { initialNodes: nodes, initialEdges: edges };
  }, [relatedPapers, studentPaper]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Handle node click to show paper details
  const onNodeClick = useCallback((event, node) => {
    if (node.id === 'student-paper') {
      setSelectedPaper({
        id: 'student-paper',
        title: studentPaper?.title || 'Your Research Paper',
        authors: studentPaper?.authors || ['You'],
        year: new Date().getFullYear(),
        topic: 'Your research contribution',
        methods: extractedData.methods,
        datasets: extractedData.datasets,
        type: 'student',
      });
    } else {
      const paper = relatedPapers.find(p => p.paper_id === node.id);
      if (paper) {
        setSelectedPaper({
          id: paper.paper_id,
          title: paper.title || 'Related Research Paper',
          authors: paper.authors || ['Unknown'],
          year: paper.year || 'N/A',
          topic: paper.topic || 'Related research',
          methods: paper.methods || [],
          datasets: paper.datasets || [],
          similarity: paper.similarity || 0,
          relevance: paper.relevance || 'Retrieved based on content similarity',
          retrieval_reason: paper.retrieval_reason || 'Similar methods, datasets, or claims detected',
          type: 'related',
        });
      }
    }
  }, [relatedPapers, studentPaper, extractedData]);

  // Filter nodes based on search and similarity
  const filteredNodes = useMemo(() => {
    return nodes.filter(node => {
      // Always show student paper
      if (node.id === 'student-paper') return true;

      // Search filter
      if (searchQuery) {
        const paper = relatedPapers.find(p => p.paper_id === node.id);
        if (paper && !paper.title?.toLowerCase().includes(searchQuery.toLowerCase())) {
          return false;
        }
      }

      // Similarity filter
      if (similarityFilter > 0) {
        const paper = relatedPapers.find(p => p.paper_id === node.id);
        if (paper && (paper.similarity || 0) < similarityFilter) {
          return false;
        }
      }

      return true;
    });
  }, [nodes, searchQuery, similarityFilter, relatedPapers]);

  // Filter edges to match filtered nodes
  const filteredEdges = useMemo(() => {
    const nodeIds = new Set(filteredNodes.map(n => n.id));
    return edges.filter(edge => nodeIds.has(edge.source) && nodeIds.has(edge.target));
  }, [edges, filteredNodes]);

  if (!moduleData || relatedPapers.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="text-gray-400 mb-2">
          <Maximize2 className="w-16 h-16 mx-auto mb-4" />
        </div>
        <h3 className="text-xl font-bold text-gray-700 mb-2">No Related Papers Found</h3>
        <p className="text-gray-500">
          Complete the Related Work analysis to visualize the research landscape.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden" style={{ height: '700px' }}>
      {/* Header with search and filters */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold">Research Landscape</h2>
            <p className="text-blue-100 text-sm">Interactive visualization of related research</p>
          </div>
          <div className="text-right">
            <div className="text-sm opacity-80">Related Papers</div>
            <div className="text-3xl font-bold">{relatedPapers.length}</div>
          </div>
        </div>

        {/* Search and Filter Controls */}
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search papers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors flex items-center gap-2"
          >
            <Filter className="w-4 h-4" />
            Filters
          </button>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="mt-3 p-4 bg-white/10 rounded-lg backdrop-blur-sm">
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium">Min Similarity:</label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={similarityFilter}
                onChange={(e) => setSimilarityFilter(parseFloat(e.target.value))}
                className="flex-1"
              />
              <span className="text-sm font-bold min-w-[3rem]">
                {(similarityFilter * 100).toFixed(0)}%
              </span>
              {similarityFilter > 0 && (
                <button
                  onClick={() => setSimilarityFilter(0)}
                  className="text-xs px-2 py-1 bg-white/20 hover:bg-white/30 rounded"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Graph Visualization */}
      <div style={{ height: 'calc(100% - 140px)' }} className="relative">
        <ReactFlow
          nodes={filteredNodes}
          edges={filteredEdges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          fitView
          attributionPosition="bottom-left"
        >
          <Background color="#e5e7eb" gap={16} />
          <Controls />
          <MiniMap
            nodeColor={(node) => {
              if (node.id === 'student-paper') return '#3B82F6';
              const paper = relatedPapers.find(p => p.paper_id === node.id);
              const similarity = paper?.similarity || 0;
              if (similarity < 0.6) return '#EF4444';
              if (similarity < 0.75) return '#F59E0B';
              return '#10B981';
            }}
            maskColor="rgba(0, 0, 0, 0.1)"
          />

          {/* Legend */}
          <Panel position="top-right" className="bg-white rounded-lg shadow-lg p-3 m-2">
            <div className="text-xs font-bold mb-2 text-gray-700">Legend</div>
            <div className="space-y-1 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-600"></div>
                <span>Your Paper</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span>High Similarity (&gt;75%)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                <span>Medium Similarity (60-75%)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <span>Low Similarity (&lt;60%)</span>
              </div>
            </div>
          </Panel>

          {/* Stats Panel */}
          <Panel position="bottom-right" className="bg-white rounded-lg shadow-lg p-3 m-2">
            <div className="text-xs space-y-1">
              <div className="font-bold text-gray-700">Statistics</div>
              <div>Papers Shown: {filteredNodes.length - 1}/{relatedPapers.length}</div>
              <div>Connections: {filteredEdges.length}</div>
            </div>
          </Panel>
        </ReactFlow>
      </div>

      {/* Paper Details Sidebar */}
      {selectedPaper && (
        <div className="absolute top-0 right-0 w-96 h-full bg-white shadow-2xl overflow-y-auto z-10 border-l border-gray-200">
          <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 flex justify-between items-start">
            <div>
              <h3 className="font-bold text-lg">Paper Details</h3>
              <p className="text-xs text-blue-100">
                {selectedPaper.type === 'student' ? 'Your Research' : 'Related Work'}
              </p>
            </div>
            <button
              onClick={() => setSelectedPaper(null)}
              className="p-1 hover:bg-white/20 rounded transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* Title */}
            <div>
              <div className="text-xs font-semibold text-gray-500 uppercase mb-1">Title</div>
              <div className="text-lg font-bold text-gray-800">{selectedPaper.title}</div>
            </div>

            {/* Authors */}
            <div>
              <div className="text-xs font-semibold text-gray-500 uppercase mb-1">Authors</div>
              <div className="text-sm text-gray-700">
                {Array.isArray(selectedPaper.authors) 
                  ? selectedPaper.authors.join(', ') 
                  : selectedPaper.authors}
              </div>
            </div>

            {/* Year */}
            <div>
              <div className="text-xs font-semibold text-gray-500 uppercase mb-1">Year</div>
              <div className="text-sm text-gray-700">{selectedPaper.year}</div>
            </div>

            {/* Research Topic */}
            <div>
              <div className="text-xs font-semibold text-gray-500 uppercase mb-1">Research Topic</div>
              <div className="text-sm text-gray-700">{selectedPaper.topic}</div>
            </div>

            {/* Methods */}
            {selectedPaper.methods && selectedPaper.methods.length > 0 && (
              <div>
                <div className="text-xs font-semibold text-gray-500 uppercase mb-2">Methods Used</div>
                <div className="flex flex-wrap gap-2">
                  {selectedPaper.methods.map((method, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium"
                    >
                      {method}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Datasets */}
            {selectedPaper.datasets && selectedPaper.datasets.length > 0 && (
              <div>
                <div className="text-xs font-semibold text-gray-500 uppercase mb-2">Datasets Used</div>
                <div className="flex flex-wrap gap-2">
                  {selectedPaper.datasets.map((dataset, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium"
                    >
                      {dataset}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Similarity (for related papers) */}
            {selectedPaper.type === 'related' && selectedPaper.similarity !== undefined && (
              <div>
                <div className="text-xs font-semibold text-gray-500 uppercase mb-2">
                  Similarity Score
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${
                        selectedPaper.similarity > 0.75
                          ? 'bg-green-500'
                          : selectedPaper.similarity > 0.6
                          ? 'bg-orange-500'
                          : 'bg-red-500'
                      }`}
                      style={{ width: `${selectedPaper.similarity * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-bold text-gray-700">
                    {(selectedPaper.similarity * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            )}

            {/* Relevance Info */}
            {selectedPaper.type === 'related' && selectedPaper.relevance && (
              <div>
                <div className="text-xs font-semibold text-gray-500 uppercase mb-1">
                  Relevance Information
                </div>
                <div className="text-sm text-gray-700 leading-relaxed">
                  {selectedPaper.relevance}
                </div>
              </div>
            )}

            {/* Why Retrieved */}
            {selectedPaper.type === 'related' && selectedPaper.retrieval_reason && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="text-xs font-semibold text-blue-700 uppercase mb-2">
                  Why This Paper Was Retrieved
                </div>
                <div className="text-sm text-blue-900 leading-relaxed">
                  {selectedPaper.retrieval_reason}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ResearchLandscape;
