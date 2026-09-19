import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { setAuthToken } from '../services/api';
import { ShieldCheck } from 'lucide-react';

export const AuthCallbackPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const token = searchParams.get('token');
    const error = searchParams.get('error');

    if (token) {
      setAuthToken(token);
      navigate('/dashboard', { replace: true });
    } else if (error) {
      navigate(`/login?error=${encodeURIComponent(error)}`, { replace: true });
    } else {
      navigate('/login', { replace: true });
    }
  }, [searchParams, navigate]);

  return (
    <div className="w-screen h-screen flex flex-col items-center justify-center bg-plum-900 text-white">
      <div className="w-12 h-12 rounded-xl bg-plum-800 border border-violet-electric flex items-center justify-center mb-4 animate-pulse">
        <ShieldCheck className="w-6 h-6 text-violet-electric" />
      </div>
      <h2 className="text-lg font-bold">Completing Secure Authentication...</h2>
      <p className="text-xs text-slate-400 mt-1">Verifying Google identity and initializing TrustLedger session.</p>
    </div>
  );
};
