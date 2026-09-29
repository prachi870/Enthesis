# Enthesis Credentials Setup Guide

This guide will help you set up all required credentials for Enthesis production deployment.

## Required Credentials

### 1. PostgreSQL Database

**What it's for:** Stores user accounts, authentication data, and application state.

**Setup Options:**

#### Option A: Local PostgreSQL (Development/Testing)
1. **Install PostgreSQL:**
   - Windows: Download from https://www.postgresql.org/download/windows/
   - Mac: `brew install postgresql`
   - Linux: `sudo apt-get install postgresql postgresql-contrib`

2. **Run setup script:**
   ```bash
   python setup_database.py
   ```
   Follow the prompts to create database and user.

3. **Or manual setup:**
   ```bash
   # Connect to PostgreSQL
   psql -U postgres
   
   # Create user and database
   CREATE USER enthesis_user WITH PASSWORD 'your_secure_password';
   CREATE DATABASE enthesis_db OWNER enthesis_user;
   GRANT ALL PRIVILEGES ON DATABASE enthesis_db TO enthesis_user;
   ```

#### Option B: Cloud PostgreSQL (Production)
Choose one of these managed PostgreSQL providers:

- **AWS RDS PostgreSQL**
  - Go to: https://console.aws.amazon.com/rds/
  - Create new PostgreSQL database
  - Note the endpoint, username, and password

- **Heroku PostgreSQL**
  - Go to: https://www.heroku.com/postgres
  - Create addon, get connection string

- **DigitalOcean Managed PostgreSQL**
  - Go to: https://cloud.digitalocean.com/databases
  - Create PostgreSQL cluster
  - Get connection details

- **Supabase** (Free tier available)
  - Go to: https://supabase.com/
  - Create project
  - Go to Settings → Database → Connection string

**Connection String Format:**
```
postgresql://username:password@host:port/database_name
```

Example:
```
postgresql://enthesis_user:mypassword123@localhost:5432/enthesis_db
```

---

### 2. JWT Secret Key

**What it's for:** Signs and verifies authentication tokens (JWT).

**How to generate:**

```bash
# Using OpenSSL (Recommended)
openssl rand -hex 32

# Using Python
python -c "import secrets; print(secrets.token_hex(32))"
```

**Example output:**
```
a8f5f167f44f4964e6c998dee827110c47a8a8ffb8e3f5a3c5bfe5d5c5f8b8e3
```

**Security:**
- NEVER commit this to git
- Use a different key for production vs development
- Keep it secret and secure
- Length should be at least 32 characters

---

### 3. Environment File (.env)

Create `.env` file in the `enthesis` directory:

```bash
# Copy example file
cp .env.example .env

# Edit with your credentials
nano .env  # or use your preferred editor
```

**Required variables:**

```env
# Database (from step 1)
DATABASE_URL=postgresql://enthesis_user:your_password@localhost:5432/enthesis_db

# JWT Secret (from step 2)
SECRET_KEY=your-generated-secret-key-here

# Application
DEBUG=False
ENTHESIS_STORAGE_DIR=storage

# CORS (add your frontend URL in production)
CORS_ORIGINS=http://localhost:3000,http://localhost:5173
```

---

## Optional Credentials

### 4. WandB (Weights & Biases) - For Experiment Tracking

**What it's for:** Track ML experiments, metrics, and model performance (optional).

**Setup:**
1. Go to: https://wandb.ai/
2. Create account
3. Go to: https://wandb.ai/authorize
4. Copy your API key

**Add to .env:**
```env
WANDB_API_KEY=your-wandb-api-key-here
```

---

## Production Deployment Checklist

### Security Checklist
- [ ] Generate new SECRET_KEY for production (don't reuse development key)
- [ ] Use strong database password (16+ characters, mixed case, numbers, symbols)
- [ ] Enable SSL for database connection in production
- [ ] Set DEBUG=False in production
- [ ] Use HTTPS for frontend (not HTTP)
- [ ] Restrict CORS_ORIGINS to your actual domain
- [ ] Never commit .env file to git (already in .gitignore)
- [ ] Use environment variables or secrets manager in cloud deployments

### Database Checklist
- [ ] Database created and accessible
- [ ] Connection string works
- [ ] User has appropriate permissions
- [ ] Backup strategy in place for production
- [ ] Connection pooling configured (for high traffic)

### Testing Checklist
- [ ] Test database connection: `python -c "from backend.app.database import engine; engine.connect()"`
- [ ] Test authentication endpoints
- [ ] Test paper upload and analysis
- [ ] Verify JWT tokens work correctly

---

## Quick Start Commands

```bash
# 1. Install dependencies
pip install -r requirements.txt

# 2. Set up database (if local)
python setup_database.py

# 3. Create .env file
cp .env.example .env
# Edit .env with your credentials

# 4. Generate secret key
openssl rand -hex 32
# Add to .env as SECRET_KEY

# 5. Start backend (will auto-create tables)
python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload

# 6. In another terminal, start frontend
cd frontend
npm install
npm run dev
```

---

## Troubleshooting

### "Could not connect to database"
- Check PostgreSQL is running: `pg_isready`
- Verify connection string in .env
- Check database exists: `psql -U postgres -l`
- Check user permissions

### "Invalid JWT token"
- Check SECRET_KEY matches between .env and running server
- Token may be expired (default 7 days)
- Clear browser localStorage and login again

### "CORS error"
- Add your frontend URL to CORS_ORIGINS in .env
- Restart backend after changing .env
- Check browser console for exact origin

---

## Production-Ready Cloud Deployment

### Recommended Stack:

1. **Frontend:** Vercel or Netlify
   - Deploy React app
   - Set environment variables (API URL)

2. **Backend:** Railway, Render, or AWS
   - Deploy FastAPI app
   - Set environment variables (DATABASE_URL, SECRET_KEY, etc.)

3. **Database:** Supabase, Railway, or AWS RDS
   - Managed PostgreSQL
   - Automatic backups

4. **File Storage:** AWS S3 or Cloudflare R2
   - Store uploaded papers
   - Store analysis results

### Environment Variables for Cloud:
Most cloud platforms allow setting environment variables through their dashboard. Set:
- `DATABASE_URL`
- `SECRET_KEY`
- `DEBUG=False`
- `CORS_ORIGINS=https://yourdomain.com`

---

## Need Help?

- PostgreSQL docs: https://www.postgresql.org/docs/
- FastAPI docs: https://fastapi.tiangolo.com/
- JWT docs: https://jwt.io/
- Supabase (easy managed DB): https://supabase.com/docs
