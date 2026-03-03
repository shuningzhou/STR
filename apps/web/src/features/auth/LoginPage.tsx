import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { apiFetch, ApiError } from '@/api/api-client';
import { useAuthStore } from './auth-store';
import { useSettings } from '@/api/hooks';
import { Button, Input, Label } from '@/components/ui';

type Step = 'register' | 'verify-email' | 'login' | 'verify-otp';

const STEP_TITLES: Record<Step, string> = {
  register: 'Create account',
  'verify-email': 'Verify email',
  login: '',
  'verify-otp': '',
};

export function LoginPage() {
  const navigate = useNavigate();
  const setToken = useAuthStore((s) => s.setToken);
  const [step, setStep] = useState<Step>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { data: settings } = useSettings();
  const allowRegistration = settings?.allowRegistration ?? true;

  useEffect(() => {
    if (!allowRegistration && step === 'register') setStep('login');
  }, [allowRegistration, step]);

  const reset = () => {
    setError('');
    setMessage('');
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    reset();
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      await apiFetch('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email: email.toLowerCase(), password }),
      });
      setMessage('Verification code sent to your email');
      setStep('verify-email');
    } catch (err) {
      const msg = err instanceof ApiError && err.body && typeof err.body === 'object' && 'message' in err.body
        ? String((err.body as { message: string }).message)
        : err instanceof ApiError
          ? String(err.body ?? err.message)
          : 'Registration failed';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    reset();
    setLoading(true);
    try {
      await apiFetch('/auth/verify-email', {
        method: 'POST',
        body: JSON.stringify({ email: email.toLowerCase(), code }),
      });
      setMessage('Email verified. You can now sign in.');
      setStep('login');
      setCode('');
    } catch (err) {
      const msg = err instanceof ApiError && err.body && typeof err.body === 'object' && 'message' in err.body
        ? String((err.body as { message: string }).message)
        : err instanceof ApiError
          ? String(err.body ?? err.message)
          : 'Verification failed';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    reset();
    setLoading(true);
    try {
      await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: email.toLowerCase(), password }),
      });
      setMessage('');
      setStep('verify-otp');
      setCode('');
    } catch (err) {
      const msg = err instanceof ApiError && err.body && typeof err.body === 'object' && 'message' in err.body
        ? String((err.body as { message: string }).message)
        : err instanceof ApiError
          ? String(err.body ?? err.message)
          : 'Sign in failed';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    reset();
    setLoading(true);
    try {
      const res = await apiFetch<{ accessToken: string }>('/auth/verify', {
        method: 'POST',
        body: JSON.stringify({ email: email.toLowerCase(), code }),
      });
      setToken(res.accessToken);
      navigate('/', { replace: true });
    } catch (err) {
      const msg = err instanceof ApiError && err.body && typeof err.body === 'object' && 'message' in err.body
        ? String((err.body as { message: string }).message)
        : err instanceof ApiError
          ? String(err.body ?? err.message)
          : 'Verification failed';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const linkStyle = {
    color: 'var(--color-accent)',
    cursor: 'pointer',
    fontSize: 'var(--font-size-body)',
    textDecoration: 'none',
  } as const;

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ backgroundColor: 'var(--color-bg-page)' }}
    >
      <div
        className="w-full max-w-[400px] rounded-[var(--radius-card)] border"
        style={{
          backgroundColor: 'var(--palette-offblack)',
          borderColor: 'var(--color-border)',
          boxShadow: '0 4px 24px var(--color-shadow)',
          padding: 'var(--space-modal)',
        }}
      >
        <div style={{ marginBottom: 'var(--space-section)' }}>
          <h1
            className="font-semibold"
            style={{
              fontSize: 'var(--font-size-display)',
              color: 'var(--color-text-primary)',
              marginBottom: 4,
            }}
          >
            STR
          </h1>
          {STEP_TITLES[step] && (
            <p
              className="font-medium"
              style={{
                fontSize: 'var(--font-size-title)',
                color: 'var(--color-text-secondary)',
              }}
            >
              {STEP_TITLES[step]}
            </p>
          )}
        </div>

        {error && (
          <div
            className="mb-4 p-3 rounded-[var(--radius-medium)]"
            style={{
              backgroundColor: 'rgba(255,89,77,0.15)',
              color: 'var(--color-negative)',
              fontSize: 'var(--font-size-body)',
            }}
          >
            {typeof error === 'object' && error !== null && 'message' in error
              ? String((error as { message: string }).message)
              : String(error)}
          </div>
        )}
        {message && (
          <div
            className="mb-4 p-3 rounded-[var(--radius-medium)]"
            style={{
              color: 'var(--color-positive)',
              fontSize: 'var(--font-size-body)',
            }}
          >
            {message}
          </div>
        )}

        {step === 'register' && allowRegistration && (
          <form onSubmit={handleRegister} className="flex flex-col gap-4">
            <div>
              <Label htmlFor="auth-email" uppercase={false}>Email</Label>
              <div className="mt-1">
                <Input
                  id="auth-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="you@example.com"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="auth-password" uppercase={false}>Password</Label>
              <div className="mt-1 relative">
                <Input
                  id="auth-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  placeholder="Min 8 characters"
                  style={{ paddingRight: 40 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:opacity-80"
                  style={{ color: 'var(--color-text-muted)' }}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <div>
              <Label htmlFor="auth-confirm" uppercase={false}>Confirm password</Label>
              <div className="mt-1 relative">
                <Input
                  id="auth-confirm"
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={8}
                  placeholder="Repeat password"
                  style={{ paddingRight: 40 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:opacity-80"
                  style={{ color: 'var(--color-text-muted)' }}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <div style={{ marginTop: 'var(--space-gap)' }}>
              <Button type="submit" variant="primary" className="w-full" disabled={loading}>
                {loading ? 'Sending...' : 'Register'}
              </Button>
            </div>
            <p style={{ fontSize: 'var(--font-size-body)', color: 'var(--color-text-muted)' }}>
              Already have an account?{' '}
              <button type="button" onClick={() => { setStep('login'); reset(); }} style={linkStyle}>
                Sign in
              </button>
            </p>
          </form>
        )}

        {step === 'verify-email' && (
          <form onSubmit={handleVerifyEmail} className="flex flex-col gap-4">
            <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-body)' }}>
              We sent a 6-digit code to <strong style={{ color: 'var(--color-text-primary)' }}>{email}</strong>. Enter it below.
            </p>
            <div>
              <Label htmlFor="auth-code-verify" uppercase={false}>6-digit code</Label>
              <div className="mt-1">
                <Input
                  id="auth-code-verify"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  maxLength={6}
                  placeholder="000000"
                  style={{ textAlign: 'center', letterSpacing: '0.4em' }}
                />
              </div>
            </div>
            <div style={{ marginTop: 'var(--space-gap)' }}>
              <Button type="submit" variant="primary" className="w-full" disabled={loading || code.length !== 6}>
                {loading ? 'Verifying...' : 'Verify'}
              </Button>
            </div>
          </form>
        )}

        {step === 'login' && (
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div>
              <Label htmlFor="auth-email-login" uppercase={false}>Email</Label>
              <div className="mt-1">
                <Input
                  id="auth-email-login"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="you@example.com"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="auth-password-login" uppercase={false}>Password</Label>
              <div className="mt-1 relative">
                <Input
                  id="auth-password-login"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Your password"
                  style={{ paddingRight: 40 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:opacity-80"
                  style={{ color: 'var(--color-text-muted)' }}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <div style={{ marginTop: 'var(--space-gap)' }}>
              <Button type="submit" variant="primary" className="w-full" disabled={loading}>
                {loading ? 'Sending code...' : 'Sign in'}
              </Button>
            </div>
            {allowRegistration && (
              <p style={{ fontSize: 'var(--font-size-body)', color: 'var(--color-text-muted)' }}>
                Need an account?{' '}
                <button type="button" onClick={() => { setStep('register'); reset(); setEmail(''); setPassword(''); }} style={linkStyle}>
                  Register
                </button>
              </p>
            )}
          </form>
        )}

        {step === 'verify-otp' && (
          <form onSubmit={handleVerifyOtp} className="flex flex-col gap-4">
            <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-body)' }}>
              Enter the 6-digit code we sent to <strong style={{ color: 'var(--color-text-primary)' }}>{email}</strong>
            </p>
            <div>
              <Label htmlFor="auth-code-otp" uppercase={false}>6-digit code</Label>
              <div className="mt-1">
                <Input
                  id="auth-code-otp"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  maxLength={6}
                  placeholder="000000"
                  style={{ textAlign: 'center', letterSpacing: '0.4em' }}
                />
              </div>
            </div>
            <div style={{ marginTop: 'var(--space-gap)' }}>
              <Button type="submit" variant="primary" className="w-full" disabled={loading || code.length !== 6}>
                {loading ? 'Verifying...' : 'Verify'}
              </Button>
            </div>
            <p style={{ fontSize: 'var(--font-size-body)', color: 'var(--color-text-muted)' }}>
              <button type="button" onClick={() => { setStep('login'); setCode(''); reset(); }} style={linkStyle}>
                Use different email
              </button>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
