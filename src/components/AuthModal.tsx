import React, { useState, useEffect } from 'react';
import {
  X,
  Bot,
  Mail,
  Lock,
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Shield,
  Sparkles,
  Loader2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'signin' | 'signup';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'signin',
}) => {
  const { signIn, signUp, isConfigured, user } = useAuth();
  const [isSignUp, setIsSignUp] = useState(initialMode === 'signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsSignUp(initialMode === 'signup');
      setError(null);
      setSuccessMessage(null);
    }
  }, [isOpen, initialMode]);

  // Close modal if user gets authenticated
  useEffect(() => {
    if (user && isOpen) {
      onClose();
    }
  }, [user, isOpen, onClose]);

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    // Validation
    if (!email.trim() || !password.trim()) {
      setError('Please provide both email and password.');
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email address.');
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
        const { error: signUpError, user: newUser } = await signUp(email.trim(), password);
        if (signUpError) {
          setError(signUpError.message);
        } else if (newUser && !newUser.confirmed_at && isConfigured) {
          setSuccessMessage(
            'Account created! If confirmation is enabled on your Supabase project, please check your inbox.'
          );
        } else {
          onClose();
        }
      } else {
        const { error: signInError } = await signIn(email.trim(), password);
        if (signInError) {
          setError(signInError.message || 'Invalid email or password.');
        } else {
          onClose();
        }
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An authentication error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-md bg-neutral-900/95 border border-neutral-800 rounded-2xl shadow-2xl backdrop-blur-xl p-6 sm:p-7 z-10 animate-in fade-in zoom-in-95 duration-200">
        {/* Close Button */}
        <button
          onClick={onClose}
          type="button"
          className="absolute top-4 right-4 p-1.5 rounded-lg text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition-colors cursor-pointer"
          aria-label="Close modal"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-5">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-cyan-500/20 via-blue-500/20 to-indigo-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-lg shadow-cyan-950/40 mb-2.5">
            <Bot className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            Darshan AI
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800/50">
              Supabase Auth
            </span>
          </h2>
          <p className="text-xs text-neutral-400 mt-1 max-w-xs">
            {isSignUp
              ? 'Create an account to save up to 10 persistent chats and 10 agent memories.'
              : 'Sign in to access your saved conversations and personalized memories.'}
          </p>
        </div>

        {/* Configuration notice if Supabase env vars are pending */}
        {!isConfigured && (
          <div className="mb-4 p-2.5 rounded-xl bg-amber-950/30 border border-amber-800/40 text-amber-300 text-xs flex items-start gap-2">
            <Shield className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
            <div className="text-[11px] leading-relaxed">
              <span className="font-semibold text-amber-200">Preview Mode:</span> You can sign in or sign up with any test email. Configure <code className="text-amber-100 font-mono">VITE_SUPABASE_URL</code> & <code className="text-amber-100 font-mono">VITE_SUPABASE_ANON_KEY</code> for live Supabase Auth.
            </div>
          </div>
        )}

        {/* Error notification */}
        {error && (
          <div
            role="alert"
            className="mb-4 p-3 rounded-xl bg-red-950/40 border border-red-800/50 text-red-200 text-xs flex items-start gap-2.5"
          >
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
            <div className="flex-1 leading-snug">{error}</div>
          </div>
        )}

        {/* Success notification */}
        {successMessage && (
          <div
            role="status"
            className="mb-4 p-3 rounded-xl bg-emerald-950/40 border border-emerald-800/50 text-emerald-200 text-xs flex items-start gap-2.5"
          >
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
            <div className="flex-1 leading-snug">{successMessage}</div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
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
            <div>
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
        <div className="mt-5 pt-4 border-t border-neutral-800/80 text-center text-xs text-neutral-400">
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

        {/* Persistence summary notice */}
        <div className="mt-4 text-center flex items-center justify-center gap-2 text-[10px] text-neutral-500">
          <Sparkles className="w-3 h-3 text-cyan-400" />
          <span>Keeps 10 latest conversations & 10 memories per account</span>
        </div>
      </div>
    </div>
  );
};
