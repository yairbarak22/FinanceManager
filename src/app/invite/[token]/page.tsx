'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Users, Check, X, Loader2 } from 'lucide-react';

export default function InvitePage() {
  const { token } = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [accountName, setAccountName] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      // Redirect to login with callback
      router.push(`/login?callbackUrl=${encodeURIComponent(`/invite/${token}`)}`);
    }
  }, [status, token, router]);

  const handleAccept = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch('/api/account/invite/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to accept invite');
        return;
      }

      setSuccess(true);
      setAccountName(data.sharedAccountName);

      // Redirect to home after 3 seconds
      setTimeout(() => {
        router.push('/');
      }, 3000);
    } catch (err) {
      setError('Failed to accept invite');
    } finally {
      setLoading(false);
    }
  };

  const handleDecline = () => {
    router.push('/');
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return null; // Will redirect to login
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
        {/* Icon */}
        <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Users className="w-8 h-8 text-blue-600" />
        </div>

        {success ? (
          <>
            {/* Success State */}
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-6 h-6 text-green-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">הצטרפת בהצלחה!</h1>
              <p className="text-gray-600 mb-4">
                הצטרפת לחשבון "{accountName}"
              </p>
              <p className="text-sm text-gray-500">
                מעביר אותך לדף הבית...
              </p>
            </div>
          </>
        ) : error ? (
          <>
            {/* Error State */}
            <div className="text-center">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <X className="w-6 h-6 text-red-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">שגיאה</h1>
              <p className="text-red-600 mb-6">{error}</p>
              <button
                onClick={() => router.push('/')}
                className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors"
              >
                חזרה לדף הבית
              </button>
            </div>
          </>
        ) : (
          <>
            {/* Invite State */}
            <h1 className="text-2xl font-bold text-gray-900 text-center mb-2">
              הזמנה לשיתוף חשבון
            </h1>
            <p className="text-gray-600 text-center mb-8">
              הוזמנת להצטרף לחשבון משותף.
              <br />
              כל הנתונים הפיננסיים שלך יהיו משותפים.
            </p>

            {/* User Info */}
            {session?.user && (
              <div className="bg-gray-50 rounded-xl p-4 mb-6 flex items-center gap-3">
                {session.user.image ? (
                  <img
                    src={session.user.image}
                    alt={session.user.name || 'User'}
                    className="w-12 h-12 rounded-full"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                    <Users className="w-6 h-6 text-gray-500" />
                  </div>
                )}
                <div>
                  <p className="font-medium text-gray-900">{session.user.name}</p>
                  <p className="text-sm text-gray-500">{session.user.email}</p>
                </div>
              </div>
            )}

            {/* Warning */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
              <p className="text-sm text-amber-800">
                <strong>שים לב:</strong> לאחר ההצטרפות, הנתונים הקיימים שלך יוחלפו בנתוני החשבון המשותף.
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={handleDecline}
                className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors"
              >
                דחה
              </button>
              <button
                onClick={handleAccept}
                disabled={loading}
                className="flex-1 px-4 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Check className="w-5 h-5" />
                )}
                קבל הזמנה
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

