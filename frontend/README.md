# Enthesis Frontend

## 🎨 3D Research Paper Analysis Interface

An immersive 3D web application for analyzing research papers using AI-powered modules.

### ✨ Features

- **3D Animated Scene**: Research-themed 3D environment with:
  - Pulsating AI brain (central neural network)
  - Floating research papers orbiting in space
  - Neural helix structures representing data connections
  - Knowledge graph nodes
  - Glowing connection rings
  - Particle data streams
  - Floating module labels
  - Starfield background

- **Interactive Analysis Dashboard**:
  - Drag & drop paper upload
  - Real-time analysis progress tracking
  - 4 AI-powered analysis modules:
    - **Related Work Detection** (SciBERT + SPECTER)
    - **Novelty Analysis** (DeBERTa NLI)
    - **Weaknesses Detection** (Multi-label BERT)
    - **Clarity Assessment** (Style-based Regression)

- **Responsive UI**:
  - Glass-morphism design
  - Gradient animations
  - Real-time module status updates
  - Detailed result cards for each module

### 🚀 Tech Stack

- **React 18** - UI framework
- **Vite** - Build tool & dev server
- **Three.js** - 3D graphics
- **@react-three/fiber** - React renderer for Three.js
- **@react-three/drei** - Useful helpers for R3F
- **Tailwind CSS** - Styling
- **Axios** - HTTP client
- **Lucide React** - Icons
- **React Dropzone** - File uploads

### 🎬 Running the App

#### Development Mode
```bash
npm run dev
```
Opens on http://localhost:3000

#### Production Build
```bash
npm run build
npm run preview
```

### 🔌 Backend Connection

The frontend connects to the FastAPI backend at `http://localhost:8000` (configured in `vite.config.js`)

**API Endpoints Used**:
- `POST /api/v1/papers/upload` - Upload research paper
- `POST /api/v1/papers/{id}/pipeline/start` - Start analysis
- `GET /api/v1/papers/{id}/results` - Poll for results
- `GET /api/v1/papers/{id}/report` - Download full report

### 📊 Module Performance

| Module | Metric | Score | Target | Status |
|--------|--------|-------|--------|--------|
| Related Work | Recall@5 | 0.55 | 0.50 | ✅ 110% |
| Novelty | F1 Score | 0.71 | 0.70 | ✅ 102% |
| Weaknesses | Precision | 0.61 | 0.70 | 🟡 87% |
| Clarity | Correlation | 0.67 | 0.60 | ✅ 111% |

### 🎨 Theme & Design

The 3D scene uses a **research/academic theme**:
- Purple/blue gradient palette (representing AI/tech)
- Floating papers (research documents)
- Neural networks (AI analysis)
- Knowledge graphs (data relationships)
- Smooth animations and auto-rotation
- Responsive to user interaction

### 📁 Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── Scene3D.jsx          # Main 3D scene
│   │   ├── UploadZone.jsx       # File upload component
│   │   ├── AnalysisPanel.jsx    # Results display
│   │   └── ModulesView.jsx      # Module cards
│   ├── App.jsx                  # Main app component
│   ├── main.jsx                 # Entry point
│   └── index.css                # Global styles
├── public/                      # Static assets
├── package.json
├── vite.config.js              # Vite configuration
└── tailwind.config.js          # Tailwind configuration
```

### 🎯 Usage Flow

1. **Landing Page**: See 3D visualization and module overview
2. **Upload Paper**: Drag & drop or click to upload PDF/DOCX/TXT
3. **Start Analysis**: Click "Start Analysis" button
4. **View Progress**: Real-time updates for each module
5. **Review Results**: See detailed analysis for each module
6. **Download Report**: Get comprehensive PDF report

### 🌟 3D Scene Components

- **AIBrain**: Pulsating icosahedron with distortion effects
- **NeuralHelix**: Spiral of connected nodes (DNA-like structure)
- **PaperConstellation**: 12 floating papers orbiting in 3D space
- **ConnectionRings**: 3 rotating torus rings at different angles
- **KnowledgeNodes**: 6 pulsating spheres representing data points
- **DataStreams**: 400+ particles creating ambient atmosphere
- **FloatingLabels**: HTML labels for each module name

### 🎛️ Customization

**Adjust 3D scene speed:**
- Edit `autoRotateSpeed` in Scene3D.jsx (default: 0.4)

**Change color theme:**
- Modify gradient colors in tailwind.config.js
- Update emissive colors in Scene3D.jsx

**Add more papers:**
- Increase count in `PaperConstellation` useMemo (default: 12)

**Performance tuning:**
- Reduce particle count in `DataStreams` (default: 400)
- Lower geometry detail in sphere/torus components

---

Built with ❤️ for academic research analysis
