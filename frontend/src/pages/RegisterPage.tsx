import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldCheck, Lock, ArrowRight, AlertCircle, Building2, User, Mail, Phone } from 'lucide-react';
import { api, setAuthToken } from '../services/api';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [organization, setOrganization] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Background flowing nodes animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth);
    let height = (canvas.height = canvas.parentElement?.clientHeight || window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.parentElement?.clientWidth || window.innerWidth;
      height = canvas.height = canvas.parentElement?.clientHeight || window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    const nodeCount = 35;
    const nodes: { x: number; y: number; vx: number; vy: number; radius: number }[] = [];
    for (let i = 0; i < nodeCount; i++) {
      nodes.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        radius: Math.random() * 2 + 1,
      });
    }

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      const bgGrad = ctx.createLinearGradient(0, 0, width, height);
      bgGrad.addColorStop(0, '#1A0E23');
      bgGrad.addColorStop(0.5, '#24132F');
      bgGrad.addColorStop(1, '#14091C');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 130) {
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.strokeStyle = `rgba(139, 92, 246, ${0.16 * (1 - dist / 130)})`;
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }
      }

      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        n.x += n.vx;
        n.y += n.vy;

        if (n.x < 0 || n.x > width) n.vx *= -1;
        if (n.y < 0 || n.y > height) n.vy *= -1;

        ctx.beginPath();
        ctx.arc(n.x, n.y, n.radius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(139, 92, 246, 0.6)';
        ctx.fill();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match. Please re-enter.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    setLoading(true);

    try {
      const data = await api.register({
        name: name.trim(),
        email: email.trim(),
        password: password.trim(),
        confirm_password: confirmPassword.trim(),
        organization_name: organization.trim(),
        phone: phone.trim()
      });
      setAuthToken(data.access_token);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please check details.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      const res = await api.getGoogleAuthUrl();
      if (res.configured && res.url) {
        window.location.href = res.url;
      } else {
        alert(res.message || "Google OAuth is not configured on the server yet. Please configure GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in your .env file.");
      }
    } catch (err: any) {
      alert("Failed to initiate Google OAuth: " + err.message);
    }
  };

  return (
    <div className="relative w-screen min-h-screen py-10 overflow-y-auto flex items-center justify-center bg-plum-900">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none fixed" />

      <div className="relative z-10 w-full max-w-xl mx-auto px-6">
        <div className="bg-cream-100 text-charcoal-900 rounded-2xl p-8 sm:p-10 shadow-2xl border border-cream-border relative">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-plum-900/10 border border-plum-border/40 text-plum-900 text-xs font-mono font-semibold mb-2">
              <ShieldCheck className="w-4 h-4 text-violet-deep" />
              <span>TrustLedger Enterprise Security</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-charcoal-950">
              Create your TrustLedger account
            </h2>
            <p className="text-xs text-charcoal-700 mt-1 max-w-md mx-auto">
              Set up your secure workspace to begin verifying applications.
            </p>
          </div>

          {/* Google OAuth Button */}
          <div className="mb-5">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-slate-50 border border-charcoal-300 text-charcoal-900 font-semibold text-xs tracking-wide shadow-sm transition-all flex items-center justify-center space-x-2.5"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-charcoal-200"></div>
              </div>
              <div className="relative flex justify-center text-[10px] uppercase">
                <span className="bg-cream-100 px-2 text-charcoal-500 font-mono">Or register with email</span>
              </div>
            </div>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-coral-subtle border border-coral-vibrant/40 flex items-start space-x-2 text-xs text-coral-dark font-medium">
              <AlertCircle className="w-4 h-4 text-coral-vibrant flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Registration Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal-750 mb-1">
                  Full Name *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-charcoal-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Jane Doe"
                    className="w-full pl-9 pr-3 py-2 rounded-lg bg-white border border-charcoal-300 text-charcoal-900 text-xs focus:outline-none focus:ring-2 focus:ring-violet-deep"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal-750 mb-1">
                  Work Email *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-charcoal-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="jane@company.com"
                    className="w-full pl-9 pr-3 py-2 rounded-lg bg-white border border-charcoal-300 text-charcoal-900 text-xs focus:outline-none focus:ring-2 focus:ring-violet-deep"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal-750 mb-1">
                  Organization / Company *
                </label>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-charcoal-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={organization}
                    onChange={(e) => setOrganization(e.target.value)}
                    placeholder="Apex Capital Partners"
                    className="w-full pl-9 pr-3 py-2 rounded-lg bg-white border border-charcoal-300 text-charcoal-900 text-xs focus:outline-none focus:ring-2 focus:ring-violet-deep"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal-750 mb-1">
                  Phone Number *
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-charcoal-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 555-0199"
                    className="w-full pl-9 pr-3 py-2 rounded-lg bg-white border border-charcoal-300 text-charcoal-900 text-xs focus:outline-none focus:ring-2 focus:ring-violet-deep"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal-750 mb-1">
                  Password *
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  className="w-full px-3 py-2 rounded-lg bg-white border border-charcoal-300 text-charcoal-900 text-xs focus:outline-none focus:ring-2 focus:ring-violet-deep"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal-750 mb-1">
                  Confirm Password *
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat password"
                  className="w-full px-3 py-2 rounded-lg bg-white border border-charcoal-300 text-charcoal-900 text-xs focus:outline-none focus:ring-2 focus:ring-violet-deep"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-plum-800 via-plum-700 to-coral-vibrant hover:from-plum-900 hover:to-coral-dark text-white font-bold text-xs tracking-wide shadow-lg transition-all flex items-center justify-center space-x-2 disabled:opacity-60"
            >
              <span>{loading ? 'Creating Workspace...' : 'Create Account'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Footer Navigation */}
          <div className="mt-5 pt-4 border-t border-charcoal-200 text-center text-xs text-charcoal-700">
            <span>Already have an account? </span>
            <Link to="/login" className="text-violet-deep hover:underline font-bold">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
