import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const OAuthCallback = () => {
  const [searchParams] = useSearchParams();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get('code');
      const state = searchParams.get('state');
      const errorParam = searchParams.get('error');

      if (errorParam) {
        setError(`OAuth error: ${errorParam}`);
        setLoading(false);
        return;
      }

      if (!code || !state) {
        setError('Missing authorization code or state');
        setLoading(false);
        return;
      }

      // Determine provider from state
      const provider = state; // 'google' or 'github'

      try {
        const response = await fetch('/api/v1/auth/oauth/callback', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ code, provider }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.detail || 'OAuth authentication failed');
        }

        const data = await response.json();

        // Store token
        localStorage.setItem('token', data.access_token);
        localStorage.setItem('user', JSON.stringify(data.user));

        // Redirect to dashboard or home
        navigate('/');
      } catch (err) {
        setError(err.message || 'Authentication failed');
        setLoading(false);
      }
    };

    handleCallback();
  }, [searchParams, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          <p className="mt-4 text-gray-400">Completing authentication...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-red-950/50 border border-red-500/40 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-red-200 mb-2">
              Authentication Error
            </h2>
            <p className="text-red-300 mb-4">{error}</p>
            <button
              onClick={() => navigate('/login')}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default OAuthCallback;
