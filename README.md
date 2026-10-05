# Enthesis 🎓

**Research-Validated NLP Pipeline for Academic Paper Analysis**

Enthesis is a production-ready AI-powered research assistant that analyzes academic papers through 5 validated NLP modules: Related Work Analysis, Novelty Detection, Weakness Identification, Clarity Assessment, and Reviewer Feedback Generation.

## ✨ Features

- **Fast Analysis**: <5 seconds per paper (optimized with lightweight NLP)
- **5 Research Modules**: Comprehensive paper evaluation
- **Beautiful 3D UI**: Modern React interface with Three.js
- **Real Authentication**: JWT + PostgreSQL
- **RESTful API**: Complete FastAPI backend
- **Structured Reports**: Detailed feedback per module
- **Research Paper Builder**: Save drafts, generate and analyze structured papers, manage versions, and export academic documents
- **College Report Generator**: Analyze college samples, extract project documents, collect missing section details, and export separately formatted college reports

## 🚀 Quick Start

### Prerequisites

- Python 3.9+
- Node.js 16+
- PostgreSQL 12+
- pip and npm

### 1. Clone & Install

```bash
cd enthesis
pip install -r requirements.txt
cd frontend && npm install && cd ..
```

### 2. Database Setup

```bash
# Run interactive setup
python setup_database.py

# Or manually:
psql -U postgres
CREATE USER enthesis_user WITH PASSWORD 'your_password';
CREATE DATABASE enthesis_db OWNER enthesis_user;
GRANT ALL PRIVILEGES ON DATABASE enthesis_db TO enthesis_user;
```

### 3. Environment Configuration

```bash
# Copy example file
cp .env.example .env

# Generate secret key
openssl rand -hex 32

# Edit .env with your credentials
nano .env
```

**Required in .env:**
```env
DATABASE_URL=postgresql://enthesis_user:your_password@localhost:5432/enthesis_db
SECRET_KEY=your-generated-secret-key-from-openssl
```

### 4. Start Services

```bash
# Terminal 1: Backend (creates tables automatically)
python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload

# Terminal 2: Frontend
cd frontend
npm run dev
```

### 5. Access Application

- Frontend: http://localhost:3000 or http://localhost:5173
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

## 📚 API Endpoints

### Authentication
- `POST /api/v1/auth/signup` - Register new user
- `POST /api/v1/auth/login` - Login user
- `GET /api/v1/auth/me` - Get current user
- `POST /api/v1/auth/logout` - Logout user

### Research Paper Builder
- `GET /api/v1/research-papers` - List saved research papers
- `POST /api/v1/research-papers` - Save a paper draft
- `GET /api/v1/research-papers/{paper_id}` - Retrieve a saved paper
- `POST /api/v1/research-papers/{paper_id}/generate` - Generate a complete, assumption-labeled draft from supplied project details
- `POST /api/v1/research-papers/{paper_id}/analyze` - Run Enthesis analysis
- `GET /api/v1/research-papers/{paper_id}/analysis/{run_id}` - Poll persisted per-module progress and findings
- `POST /api/v1/research-papers/{paper_id}/analysis/{run_id}/retry/{module}` - Retry a failed module
- `GET|POST /api/v1/research-papers/{paper_id}/analysis/{run_id}/actions` - List or create finding-linked research tasks
- `PATCH /api/v1/research-papers/{paper_id}/analysis/{run_id}/actions/{action_id}` - Update task status
- `GET /api/v1/research-papers/{paper_id}/analysis/{run_id}/report` - Generate a report from that saved analysis
- `GET /api/v1/research-papers/{paper_id}/export?format=pdf|docx|latex|markdown` - Export a paper

### College Report Generator
- `POST /api/v1/college-reports/templates/analyze` - Upload and inspect a college-provided sample
- `POST /api/v1/college-reports/templates/{template_id}/save` - Save an analyzed template, including its semester label
- `GET /api/v1/college-reports/templates` - List saved and analyzed college templates
- `POST /api/v1/college-reports/templates/{template_id}/reanalyze` - Refresh section detection from a saved template
- `POST /api/v1/college-reports/reports` - Create a separate college report and extract uploaded project files
- `GET /api/v1/college-reports/reports` - List college reports
- `GET /api/v1/college-reports/reports/{report_id}` - Retrieve extracted material and report draft
- `PUT /api/v1/college-reports/reports/{report_id}/information` - Save information supplied for required sections
- `POST /api/v1/college-reports/reports/{report_id}/compare` - Compare template requirements with provided source material
- `POST /api/v1/college-reports/reports/{report_id}/generate` - Generate a template-ordered report from supplied information
- `POST /api/v1/college-reports/reports/{report_id}/validate` - Validate section coverage and supported formatting
- `GET /api/v1/college-reports/reports/{report_id}/export?format=pdf|docx` - Export the college report

The College Report Generator uses its own `college_report_templates` and `college_reports`
database tables and `/college-reports` UI. It does not read or write Research Paper Builder
drafts, analysis runs, or paper exports. It extracts headings and supported DOCX styles from
the uploaded sample, preserves its section order, and applies supported page margins/fonts to
PDF/DOCX output. Missing project facts are requested from the user rather than invented.
Project-information extraction only maps text under recognizable section headings; documents
without such headings remain available as extracted source text and require manual section input.

Generated prose for missing sections is labeled as assumption-based and must be verified.
Unreported experimental outcomes remain hypothetical, and missing references are explicitly
placeholders rather than fabricated citations. The builder preview is justified and shows
the full paper; DOCX export applies academic typography, justified body paragraphs, and a
two-column section layout for IEEE papers. Paper-format choices include APA student-paper,
MLA, Chicago Notes and Bibliography, IEEE, Generic, University, IMRaD, Conference, and
Thesis styles. Format selection changes the paper's structure and formatting, not its
supplied research content. APA and MLA title-page fields can be entered in the project
details form; citation entries and their locations must be supplied by the author.
The Analyze Paper workspace runs all five existing modules against the saved manuscript
version and persists each module's state and output. It provides paper-passage navigation,
finding evidence, investigation tasks, re-analysis comparisons, and reports. The current
Related Work module extracts terms but does not retrieve papers, so the interface marks
related-paper retrieval and similarity as unavailable instead of displaying synthetic
sources. Heuristic novelty and reviewer-style observations are not novelty decisions,
peer reviews, or publication predictions.

### Papers (Requires Authentication)
- `GET /api/v1/papers/list` - List all papers
- `POST /api/v1/papers/upload` - Upload paper (PDF/DOCX/TXT)
- `GET /api/v1/papers/{id}` - Get paper details
- `DELETE /api/v1/papers/{id}` - Delete paper
- `POST /api/v1/papers/{id}/pipeline/start` - Start analysis
- `GET /api/v1/papers/{id}/results` - Get results
- `GET /api/v1/papers/{id}/report` - Get comprehensive report
- `GET /api/v1/papers/{id}/download` - Download report JSON

### Health
- `GET /health` - Check API status

## 🔧 Technology Stack

### Backend
- **FastAPI** - Modern Python web framework
- **SQLAlchemy** - Database ORM
- **PostgreSQL** - Relational database
- **JWT** - Token-based authentication
- **PyPDF/python-docx** - Document parsing
- **Pydantic** - Data validation

### Frontend
- **React 18** - UI library
- **Vite** - Build tool
- **Three.js** - 3D graphics
- **React Router** - Navigation
- **Lucide React** - Icons
- **Tailwind CSS** - Styling

### NLP Pipeline
- **Related Work Analysis** - Citation and methodology extraction
- **Novelty Detection** - Innovation assessment
- **Weakness Identification** - Methodology gap detection
- **Clarity Assessment** - Readability analysis
- **Reviewer Feedback** - Comprehensive report generation

## 📖 Documentation

- [Credentials Setup Guide](./CREDENTIALS_SETUP.md) - Complete setup instructions
- [Implementation Details](./IMPLEMENTATION.md) - Architecture and modules
- [Project Guide](./docs/) - Research methodology
- [API Documentation](http://localhost:8000/docs) - Interactive API docs (when running)

## 🔐 Security

- JWT tokens with configurable expiration (default 7 days)
- Bcrypt password hashing
- CORS protection
- SQL injection prevention (parameterized queries)
- Environment-based configuration
- Authentication required for all paper operations

## 🌐 Production Deployment

See [CREDENTIALS_SETUP.md](./CREDENTIALS_SETUP.md) for detailed production deployment guide.

**Recommended Stack:**
- Frontend: Vercel/Netlify
- Backend: Railway/Render/AWS
- Database: Supabase/Railway/AWS RDS

**Required Environment Variables:**
```env
DATABASE_URL=postgresql://user:pass@host:5432/db
SECRET_KEY=your-production-secret-key
DEBUG=False
CORS_ORIGINS=https://yourdomain.com
```

## 🧪 Testing

```bash
# Run tests
pytest

# Run specific test
pytest tests/unit/test_related_work.py

# With coverage
pytest --cov=backend --cov=modules
```

## 📊 Performance

- **Analysis Speed**: 4-5 seconds per paper
- **File Support**: PDF, DOCX, TXT
- **Concurrent Users**: Scales with database
- **Storage**: JSON-based (easily migrated to database if needed)

## 🤝 Development

### Project Structure
```
enthesis/
├── backend/          # FastAPI application
│   └── app/
│       ├── api/      # API endpoints
│       ├── models/   # Database models
│       ├── schemas/  # Pydantic schemas
│       └── services/ # Business logic
├── frontend/         # React application
│   └── src/
│       ├── components/
│       ├── pages/
│       └── utils/
├── modules/          # NLP analysis modules
├── pipeline/         # Orchestration logic
├── data/            # Datasets
└── tests/           # Test suite
```

### Adding New Features

1. **New API Endpoint**: Add to `backend/app/api/`
2. **New Module**: Add to `modules/` and register in pipeline
3. **Frontend Page**: Add to `frontend/src/pages/`
4. **Database Model**: Add to `backend/app/models/`

## 🐛 Troubleshooting

### Database Connection Failed
```bash
# Check PostgreSQL is running
pg_isready

# Verify connection
psql -U enthesis_user -d enthesis_db
```

### CORS Errors
- Add your frontend URL to `CORS_ORIGINS` in `.env`
- Restart backend after changing `.env`

### Authentication Errors
- Check `SECRET_KEY` is set in `.env`
- Clear browser localStorage and login again
- Verify token hasn't expired

### Analysis Too Slow
- Check system resources
- Verify fast analysis modules are being used (not heavy AI models)
- Check file size (<10MB recommended)

## 📝 License

MIT License - See LICENSE file for details

## 👥 Contributors

Built with ❤️ for the research community

## 🔗 Links

- [Issues](https://github.com/yourusername/enthesis/issues)
- [Documentation](./docs/)
- [API Reference](http://localhost:8000/docs)
