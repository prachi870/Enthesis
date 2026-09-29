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
