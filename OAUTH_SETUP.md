# OAuth Setup Guide

This guide will help you set up Google and GitHub OAuth authentication for Enthesis.

## Prerequisites

- Google Cloud Console account
- GitHub account

## 1. Google OAuth Setup

### Step 1: Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to **APIs & Services** → **Credentials**
4. Click **Create Credentials** → **OAuth client ID**
5. If prompted, configure the OAuth consent screen:
   - User Type: External
   - App name: Enthesis
   - User support email: your email
   - Developer contact: your email
   - Save and continue through the scopes and test users sections

6. Create OAuth client ID:
   - Application type: **Web application**
   - Name: Enthesis Web App
   - Authorized JavaScript origins:
     - `http://localhost:3000`
     - `http://127.0.0.1:3000`
   - Authorized redirect URIs:
     - `http://localhost:3000/auth/callback`
     - `http://127.0.0.1:3000/auth/callback`

7. Click **Create**
8. Copy the **Client ID** and **Client Secret**

### Step 2: Add Google Credentials to .env

Open `.env` file and update:

```env
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
```

## 2. GitHub OAuth Setup

### Step 1: Create GitHub OAuth App

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click **New OAuth App**
3. Fill in the details:
   - Application name: Enthesis
   - Homepage URL: `http://localhost:3000`
   - Application description: Research paper analysis tool
   - Authorization callback URL: `http://localhost:3000/auth/callback`

4. Click **Register application**
5. On the next page, click **Generate a new client secret**
6. Copy the **Client ID** and **Client Secret**

### Step 2: Add GitHub Credentials to .env

Open `.env` file and update:

```env
GITHUB_CLIENT_ID=your_github_client_id_here
GITHUB_CLIENT_SECRET=your_github_client_secret_here
```

## 3. Update Frontend Routes

Make sure your frontend routing includes the OAuth callback route. Update `src/App.jsx` or your main routing file to include:

```jsx
import OAuthCallback from './pages/OAuthCallback';

// In your routes:
<Route path="/auth/callback" element={<OAuthCallback />} />
```

## 4. Add OAuth Buttons to Login Page

Update your login page to include the OAuth component:

```jsx
import OAuthLogin from '../components/OAuthLogin';

// In your login page JSX:
<OAuthLogin />
```

## 5. Test the Integration

1. Restart the backend server:
   ```powershell
   python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
   ```

2. Start the frontend:
   ```powershell
   cd frontend
   npm run dev
   ```

3. Navigate to the login page
4. Click "Sign in with Google" or "Sign in with GitHub"
5. Complete the OAuth flow
6. You should be redirected back and logged in

## Production Deployment

When deploying to production, update:

1. **Google Cloud Console**:
   - Add your production domain to Authorized JavaScript origins
   - Add your production callback URL to Authorized redirect URIs

2. **GitHub OAuth App**:
   - Update Homepage URL to your production domain
   - Update Authorization callback URL to your production callback

3. **.env file**:
   ```env
   OAUTH_REDIRECT_URI=https://yourdomain.com/auth/callback
   ```

## Troubleshooting

### "OAuth is not configured" error
- Make sure GOOGLE_CLIENT_ID/GITHUB_CLIENT_ID and secrets are set in .env
- Restart the backend server after updating .env

### "Redirect URI mismatch" error
- Verify the redirect URI in Google/GitHub matches exactly: `http://localhost:3000/auth/callback`
- Check for trailing slashes - they must match exactly

### "Email not verified" error
- Make sure your email is verified with the OAuth provider
- For GitHub, make sure you have a verified email address in your GitHub account

### CORS errors
- Make sure `http://localhost:3000` is in your CORS_ORIGINS in .env
- Restart both frontend and backend after changes

## Security Notes

- Never commit your .env file with real credentials to version control
- Use .env.example for templates
- For production, use environment variables or secrets management service
- Regularly rotate your OAuth secrets
- Use HTTPS in production

## Additional Features

You can enhance the OAuth integration by:

1. **Profile pictures**: Fetch and display user avatars from OAuth providers
2. **Account linking**: Allow users to link multiple OAuth providers to one account
3. **Session management**: Implement refresh tokens for longer sessions
4. **Provider-specific scopes**: Request additional permissions as needed
