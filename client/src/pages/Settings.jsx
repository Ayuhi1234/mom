import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';
import { CheckCircle, XCircle, Link as LinkIcon } from 'lucide-react';

export default function Settings() {
  const { user } = useAuth();

  async function handleConnectZoom() {
    try {
      const { data } = await authAPI.getZoomAuthUrl();
      window.location.href = data.url;
    } catch {
      toast.error('Failed to get Zoom auth URL');
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Settings</h1>

      {/* Profile */}
      <section className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Profile</h2>
        <div className="flex items-center gap-4">
          {user?.avatar && (
            <img src={user.avatar} alt={user.name} className="h-16 w-16 rounded-full" />
          )}
          <div>
            <p className="font-medium text-gray-900">{user?.name}</p>
            <p className="text-sm text-gray-500">{user?.email}</p>
          </div>
        </div>
      </section>

      {/* Connected Accounts */}
      <section className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Connected Accounts</h2>
        <div className="space-y-4">
          {/* Google */}
          <div className="flex items-center justify-between p-4 border border-gray-100 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-red-50 rounded-lg flex items-center justify-center">
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-gray-900">Google</p>
                <p className="text-sm text-gray-500">Calendar & Google Meet</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm">
              {user?.hasGoogle ? (
                <span className="flex items-center gap-1 text-green-600">
                  <CheckCircle className="h-4 w-4" /> Connected
                </span>
              ) : (
                <span className="flex items-center gap-1 text-gray-400">
                  <XCircle className="h-4 w-4" /> Not connected
                </span>
              )}
            </div>
          </div>

          {/* Zoom */}
          <div className="flex items-center justify-between p-4 border border-gray-100 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-blue-50 rounded-lg flex items-center justify-center">
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="#2D8CFF">
                  <path d="M4.585 15.235V8.766c0-1.11.9-2.012 2.012-2.012h8.167c1.11 0 2.012.901 2.012 2.012v6.469c0 1.11-.901 2.011-2.012 2.011H6.597c-1.111 0-2.012-.9-2.012-2.011zm13.793-4.406l3.206-2.287c.26-.185.416-.13.416.208v6.5c0 .337-.156.393-.416.208l-3.206-2.287V10.83z" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-gray-900">Zoom</p>
                <p className="text-sm text-gray-500">Zoom Meetings</p>
              </div>
            </div>
            {user?.hasZoom ? (
              <span className="flex items-center gap-1 text-green-600 text-sm">
                <CheckCircle className="h-4 w-4" /> Connected
              </span>
            ) : (
              <button
                onClick={handleConnectZoom}
                className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
              >
                <LinkIcon className="h-4 w-4" /> Connect
              </button>
            )}
          </div>
        </div>
      </section>

      {/* API Keys Info */}
      <section className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Setup Guide</h2>
        <div className="space-y-3 text-sm text-gray-600">
          <p>To use MOM Generator, ensure the following are configured on the server:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Google OAuth credentials (Google Cloud Console)</li>
            <li>Zoom OAuth app (Zoom Marketplace)</li>
            <li>Recall.ai API key (recall.ai)</li>
            <li>Claude API key (Anthropic)</li>
            <li>MongoDB connection</li>
          </ul>
        </div>
      </section>
    </div>
  );
}
