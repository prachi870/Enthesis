# Quick Deploy to Render & Vercel

## 🚀 Backend on Render (5 minutes)

### 1. Create Render Account
- Go to https://render.com/
- Sign up with GitHub

### 2. Create Database
1. New + → PostgreSQL
2. Name: `enthesis-db`
3. Plan: Free
4. Create Database
5. **Copy Internal Database URL**

### 3. Create Web Service
1. New + → Web Service
2. Connect repo: `prachi870/Enthesis`
3. Configure:
   - Name: `enthesis-backend`
   - Runtime: Python 3
   - Build: `pip install -r requirements.txt`
   - Start: `uvicorn backend.app.main:app --host 0.0.0.0 --port $PORT`
   - Plan: Free

### 4. Environment Variables
```
DATABASE_URL = (paste Internal Database URL from step 2)
SECRET_KEY = (your secret key)
GOOGLE_CLIENT_ID = (your Google client ID)
GOOGLE_CLIENT_SECRET = (your Google secret)
GITHUB_CLIENT_ID = (your GitHub client ID)
GITHUB_CLIENT_SECRET = (your GitHub secret)
OAUTH_REDIRECT_URI = https://YOUR-APP.vercel.app/auth/callback
CORS_ORIGINS = https://YOUR-APP.vercel.app
```

### 5. Deploy
- Click "Create Web Service"
- Wait 3-5 minutes
- Backend live at: `https://enthesis-backend.onrender.com`

---

## 🎨 Frontend on Vercel (3 minutes)

### 1. Create Vercel Account
- Go to https://vercel.com/
- Sign up with GitHub

### 2. Import Project
1. New Project → Import `prachi870/Enthesis`
2. Configure:
   - Framework: Vite
   - Root Directory: `frontend`
   - Build: `npm run build`
   - Output: `dist`

### 3. Environment Variable
```
VITE_API_URL = https://enthesis-backend.onrender.com
```

### 4. Deploy
- Click "Deploy"
- Wait 2 minutes
- Frontend live at: `https://YOUR-APP.vercel.app`

---

## 🔧 Update OAuth (2 minutes)

### Google Cloud Console
- Add redirect URI: `https://YOUR-APP.vercel.app/auth/callback`

### GitHub OAuth App
- Add callback URL: `https://YOUR-APP.vercel.app/auth/callback`

### Render Environment
- Update `OAUTH_REDIRECT_URI`: `https://YOUR-APP.vercel.app/auth/callback`
- Update `CORS_ORIGINS`: `https://YOUR-APP.vercel.app`

---

## ✅ Test
1. Visit your Vercel URL
2. Click "Login with Google"
3. Should work! 🎉

---

## 📝 Notes

- **Free tier limits:**
  - Render: Service sleeps after 15 min (30s cold start)
  - Vercel: Unlimited deployments, 100GB bandwidth

- **Auto-deploy:**
  - Push to `main` branch
  - Both Render and Vercel auto-deploy

- **Logs:**
  - Render: Service → Logs tab
  - Vercel: Deployment → Build Logs

---

**That's it! Your app is live! 🚀**
