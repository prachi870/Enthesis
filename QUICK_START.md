# 🚀 Enthesis - Quick Start Guide

## ✅ System Status

**Backend**: ✅ Running on http://localhost:8000
**Frontend**: ✅ Running on http://localhost:3000

## 📋 Quick Access

### Main Application
🌐 **Open**: http://localhost:3000

You'll see:
1. Login page (first time)
2. Dashboard (if already logged in)

### API Documentation
📚 **Swagger UI**: http://localhost:8000/docs
📊 **Health Check**: http://localhost:8000/health

## 🎯 First Time Setup (Already Done!)

Both servers are running. If they stop, restart with:

### Backend
```bash
cd enthesis
python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
```

### Frontend
```bash
cd enthesis/frontend
npm run dev
```

## 🧭 Navigation Guide

### 1. **Login/Signup** (`/login`, `/signup`)
- Create account or login (any credentials work for demo)
- Auto-redirects to dashboard after successful auth

### 2. **Dashboard** (`/dashboard`)
Main hub showing:
- 📊 **Stats Cards**: Total papers, completed, processing, avg score
- 📑 **Papers Table**: All uploaded research papers with scores
- 🔍 **Search**: Find papers by filename
- 🎯 **Filter**: Filter by status (completed/processing/failed)
- ➕ **New Analysis**: Upload new paper button (top-right)
- 👤 **User Profile**: Name, email, logout (top-right)

### 3. **Upload Paper** (`/analyze`)
Click "New Analysis" from dashboard to:
- Drag & drop PDF, DOCX, or TXT file
- File uploads and appears in dashboard
- Start analysis to run 4 AI modules

## 📊 Dashboard Features

### Stats Overview
| Metric | Description |
|--------|-------------|
| Total Papers | Count of all uploads |
| Completed | Successfully analyzed |
| Processing | Currently running |
| Avg Score | Overall performance |

### Papers Table Columns
| Column | Description |
|--------|-------------|
| Paper | Filename and ID |
| Status | Completed/Processing/Failed |
| Related Work | Score 0-100% |
| Novelty | Score 0-100% |
| Weaknesses | Score 0-100% |
| Clarity | Score 0-100% |
| Avg Score | Average of all scores |
| Date | Upload timestamp |
| Actions | View details button |

### Score Color Coding
- 🟢 **Green** (≥80%): Excellent
- 🟡 **Yellow** (≥60%): Good
- 🟠 **Orange** (<60%): Needs improvement
- ⚪ **Gray** (-): Not yet analyzed

## 🎨 UI Features

### Text Visibility ✅
- High contrast white text on dark backgrounds
- Proper opacity levels (60-85%)
- Text shadows for depth
- Clear, readable font sizes

### 3D Background
- Subtle animated research theme
- 20% opacity (doesn't interfere with text)
- Auto-rotating camera
- Floating papers, neural networks, particles

### Responsive Design
- Works on desktop, tablet, mobile
- Adaptive layouts
- Touch-friendly controls

## 🧪 Test the System

### Upload a Test Paper
1. Go to http://localhost:3000
2. Login with any credentials
3. Click "New Analysis" button
4. Upload `test_paper.txt` from project root
5. See it appear in dashboard immediately

### Check API Endpoint
```bash
# List all papers
curl http://localhost:8000/api/v1/papers/list

# Check health
curl http://localhost:8000/health
```

## 🎯 Key Workflows

### Analyze a Research Paper
1. **Dashboard** → Click "New Analysis"
2. **Upload** → Drag & drop your paper
3. **Wait** → File uploads and saves
4. **Start Analysis** → Click "Start Analysis" button
5. **Monitor** → Watch real-time progress
6. **View Results** → See scores for each module
7. **Download Report** → Get comprehensive PDF

### Search Your Papers
1. **Dashboard** → Use search box
2. Type filename or keywords
3. Results filter instantly

### Filter by Status
1. **Dashboard** → Use status dropdown
2. Select "Completed", "Processing", or "Failed"
3. Table updates automatically

## 📱 Screenshot Tour

### Login Page
- Clean, professional design
- Email & password fields
- Social login options (Google, GitHub)
- "Create account" link

### Dashboard
- 4 stats cards at top
- Search and filter toolbar
- Comprehensive papers table
- Color-coded scores
- Action buttons

### 3D Background
- Animated neural networks
- Floating research papers
- Glowing connection rings
- Particle streams
- Knowledge graph nodes

## 🔐 Authentication (Development Mode)

Currently uses localStorage for demo purposes:
- Any email/password combination works
- Data stored locally in browser
- Logout clears session

**Production Ready**: Ready for JWT token integration

## 📝 Sample Papers in System

If you uploaded papers before, they'll show up automatically in the dashboard.

Check: `enthesis/data/storage/*.json`

## 🆘 Troubleshooting

### Frontend not loading?
```bash
cd enthesis/frontend
npm install
npm run dev
```

### Backend not responding?
```bash
cd enthesis
pip install -r requirements.txt
python -m uvicorn backend.app.main:app --reload
```

### CORS errors?
- Backend already configured with CORS
- Allows localhost:3000 and localhost:5173
- Check browser console for specific errors

### Text not visible?
- Refresh page (Ctrl+R)
- Check CSS loaded properly
- Background opacity should be 60-85%

## 🎉 You're Ready!

Open **http://localhost:3000** and start analyzing research papers!

### What You Get:
✅ Beautiful 3D animated interface
✅ Clean, readable dashboard
✅ Real-time paper analysis
✅ Score tracking and history
✅ Search and filter capabilities
✅ Professional authentication pages
✅ Responsive design

---

**Need Help?** Check the full documentation in `IMPLEMENTATION.md` or `README.md`
