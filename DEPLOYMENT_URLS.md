# Deployment URLs and Configuration

## Production URLs
- **Frontend (Vercel)**: https://enthesis-git-main-mehga.vercel.app
- **Backend (Render)**: https://enthesis-1.onrender.com

## Render Backend Environment Variables

Add these in Render Dashboard → Your Service → Environment:

```env
DATABASE_URL=<Your PostgreSQL Internal Database URL from Render>
SECRET_KEY=<Your SECRET_KEY from .env file>
GOOGLE_CLIENT_ID=<Your Google OAuth Client ID>
GOOGLE_CLIENT_SECRET=<Your Google OAuth Client Secret>
GITHUB_CLIENT_ID=<Your GitHub OAuth Client ID>
GITHUB_CLIENT_SECRET=<Your GitHub OAuth Client Secret>
CORS_ORIGINS=https://enthesis-git-main-mehga.vercel.app
OAUTH_REDIRECT_URI=https://enthesis-git-main-mehga.vercel.app/auth/callback
DEBUG=False
```

## OAuth Redirect URI Configuration

### Google Cloud Console
1. Go to: https://console.cloud.google.com/apis/credentials
2. Select your OAuth Client ID
3. **Authorized redirect URIs** - Add:
   ```
   https://enthesis-git-main-mehga.vercel.app/auth/callback
   ```
4. **Authorized JavaScript origins** - Add:
   ```
   https://enthesis-git-main-mehga.vercel.app
   ```

### GitHub OAuth App
1. Go to: https://github.com/settings/developers
2. Select your OAuth App
3. **Authorization callback URL** - Set to:
   ```
   https://enthesis-git-main-mehga.vercel.app/auth/callback
   ```

## Testing Checklist

After deployment:
- [ ] Visit: https://enthesis-1.onrender.com/health (should return `{"status":"ok","app":"Enthesis"}`)
- [ ] Visit: https://enthesis-git-main-mehga.vercel.app (frontend should load)
- [ ] Click "Sign in with Google" → Should redirect to Google OAuth
- [ ] Complete Google OAuth → Should redirect back and log you in
- [ ] Upload a paper → Should work
- [ ] Generate a paper → Should download DOCX

## Troubleshooting

### CORS Errors
- Check `CORS_ORIGINS` in Render includes your Vercel URL
- No trailing slashes in URLs

### OAuth Errors
- Check redirect URIs match exactly in Google/GitHub
- Check `OAUTH_REDIRECT_URI` in Render matches Vercel URL + `/auth/callback`

### API Not Found
- Check `vercel.json` has correct Render URL
- Redeploy Vercel after updating vercel.json

### Database Errors
- Check `DATABASE_URL` in Render is the Internal Database URL (not External)
- Run migrations if needed

## Deployment Commands

### Redeploy Backend (Render)
- Automatic on git push to main
- Or: Render Dashboard → Manual Deploy

### Redeploy Frontend (Vercel)
- Automatic on git push to main
- Or: Vercel Dashboard → Redeploy

## Local Development

Use `.env` for local development:
```env
DATABASE_URL=sqlite:///./enthesis.db
CORS_ORIGINS=http://localhost:3000
OAUTH_REDIRECT_URI=http://localhost:3000/auth/callback
```

Frontend runs on: http://localhost:3000
Backend runs on: http://127.0.0.1:8000
