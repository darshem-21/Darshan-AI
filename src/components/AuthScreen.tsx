import React, { useState } from 'react';
import { Bot, Mail, Lock, AlertCircle, ArrowRight, CheckCircle2, Shield, Sparkles, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const AuthScreen: React.FC = () => {
  const { signIn, signUp, isConfigured } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    // Basic Validation
    if (!email.trim() || !password.trim()) {
      setError('Please fill in both email and password.');
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Please provide a valid email address.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (isSignUp && password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (isSignUp) {
        const { error: signUpError, user } = await signUp(email.trim(), password);
        if (signUpError) {
          setError(signUpError.message);
        } else if (user && !user.confirmed_at && isConfigured) {
          setSuccessMessage(
            'Account created! Please check your email inbox to confirm your registration, or sign in if email confirmations are disabled.'
          );
        }
      } else {
        const { error: signInError } = await signIn(email.trim(), password);
        if (signInError) {
          setError(signInError.message || 'Invalid email or password.');
        }
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An unexpected authentication error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-neutral-950 px-4 py-8 relative overflow-hidden select-none">
      {/* Background ambient glowing spheres */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Auth Card Container */}
      <div className="relative w-full max-w-md bg-neutral-900/80 border border-neutral-800/90 rounded-2xl shadow-2xl backdrop-blur-xl p-8 z-10">
        {/* Brand header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-500/20 via-blue-500/20 to-indigo-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-lg shadow-cyan-950/40 mb-3.5">
            <Bot className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            Darshan AI
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800/50">
              Auth
            </span>
          </h1>
          <p className="text-xs text-neutral-400 mt-1 max-w-xs">
            {isSignUp
              ? 'Create your account to unlock private conversations and Supabase memory'
              : 'Sign in to access your personal AI agent, memory bank, and tools'}
          </p>
        </div>

        {/* Configuration notice if Supabase env vars are pending */}
        {!isConfigured && (
          <div className="mb-5 p-3 rounded-xl bg-amber-950/30 border border-amber-800/40 text-amber-300 text-xs flex items-start gap-2.5">
            <Shield className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
            <div className="text-[11px] leading-relaxed">
              <span className="font-semibold text-amber-200">Supabase Connected:</span> Fill in your real login credentials below. In development preview mode, accounts authenticate with deterministic user UUIDs. Configure <code className="text-amber-100 font-mono">VITE_SUPABASE_URL</code> & <code className="text-amber-100 font-mono">VITE_SUPABASE_ANON_KEY</code> for live cloud auth.
            </div>
          </div>
        )}

        {/* Error notification */}
        {error && (
          <div
            role="alert"
            className="mb-4 p-3 rounded-xl bg-red-950/40 border border-red-800/50 text-red-200 text-xs flex items-start gap-2.5 animate-in fade-in duration-200"
          >
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
            <div className="flex-1 leading-snug">{error}</div>
          </div>
        )}

        {/* Success notification */}
        {successMessage && (
          <div
            role="status"
            className="mb-4 p-3 rounded-xl bg-emerald-950/40 border border-emerald-800/50 text-emerald-200 text-xs flex items-start gap-2.5 animate-in fade-in duration-200"
          >
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
            <div className="flex-1 leading-snug">{successMessage}</div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1.5 uppercase tracking-wider">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                required
                className="w-full bg-neutral-950/80 border border-neutral-800 focus:border-cyan-500/80 focus:ring-1 focus:ring-cyan-500/50 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-neutral-100 placeholder-neutral-500 transition-all outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1.5 uppercase tracking-wider">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                className="w-full bg-neutral-950/80 border border-neutral-800 focus:border-cyan-500/80 focus:ring-1 focus:ring-cyan-500/50 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-neutral-100 placeholder-neutral-500 transition-all outline-none"
              />
            </div>
          </div>

          {isSignUp && (
            <div className="animate-in fade-in duration-150">
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5 uppercase tracking-wider">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500" />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className="w-full bg-neutral-950/80 border border-neutral-800 focus:border-cyan-500/80 focus:ring-1 focus:ring-cyan-500/50 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-neutral-100 placeholder-neutral-500 transition-all outline-none"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-neutral-950 font-semibold text-sm transition-all shadow-md shadow-cyan-500/20 active:scale-98 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-neutral-950" />
                <span>{isSignUp ? 'Creating Account...' : 'Signing In...'}</span>
              </>
            ) : (
              <>
                <span>{isSignUp ? 'Create Account' : 'Sign In'}</span>
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </>
            )}
          </button>
        </form>

        {/* Toggle between Sign In and Sign Up */}
        <div className="mt-6 pt-5 border-t border-neutral-800/80 text-center text-xs text-neutral-400">
          {isSignUp ? (
            <p>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(false);
                  setError(null);
                  setSuccessMessage(null);
                }}
                className="text-cyan-400 hover:text-cyan-300 font-semibold hover:underline cursor-pointer ml-1"
              >
                Sign In
              </button>
            </p>
          ) : (
            <p>
              Don't have an account yet?{' '}
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(true);
                  setError(null);
                  setSuccessMessage(null);
                }}
                className="text-cyan-400 hover:text-cyan-300 font-semibold hover:underline cursor-pointer ml-1"
              >
                Sign Up
              </button>
            </p>
          )}
        </div>

        {/* Architecture verification quiet badge */}
        <div className="mt-5 text-center flex items-center justify-center gap-2 text-[10px] text-neutral-500">
          <Sparkles className="w-3 h-3 text-cyan-400" />
          <span>Secured with Supabase Auth & JWTs</span>
        </div>
      </div>
    </div>
  );
};
