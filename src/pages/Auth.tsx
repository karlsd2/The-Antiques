import { useState } from 'react';
import { Icon } from '../components/Icon';
import type { Page } from '../types';
import type { UserRole } from '../hooks/useAuth';
import { useAuth } from '../hooks/useAuth';

export function Auth({ mode, navigate, onLogin }: { mode: "login" | "register" | "forgot"; navigate: (page: Page) => void; onLogin: () => void }) {
  const [selectedRole, setSelectedRole] = useState<UserRole>("buyer");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { signUp, signIn } = useAuth();
  const copy = mode === "login" ? ["Welcome back.", "Sign in to continue your collection."] : mode === "register" ? ["Begin your story.", "Join a community that values things made to last."] : ["Find your way back.", "We'll send a secure reset link to your email."];

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const fullName = formData.get('fullName') as string;

    try {
      if (mode === "login") {
        await signIn(email, password);
      } else if (mode === "register") {
        await signUp(email, password, fullName || '', selectedRole);
      }
      // Let App.tsx handle the redirect based on profile role
      // The useEffect in App.tsx will redirect after profile loads
    } catch (err: any) {
      setError(err.message || "An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page centered">
      <div className="auth-form-wrap">
        <div className="auth-form-container">
          <button className="auth-brand" onClick={() => navigate("login")}>The Antiques</button>
          <div className="auth-form">
            <span className="eyebrow">{mode === "login" ? "Member access" : mode === "register" ? "Create an account" : "Password recovery"}</span>
            <h1>{copy[0]}</h1>
            <p>{copy[1]}</p>
            {mode === "register" && (
              <div className="role-cards">
                <button className={selectedRole === "buyer" ? "active" : ""} onClick={() => setSelectedRole("buyer")}>
                  <Icon name="bag" />
                  <span><strong>Buyer</strong><small>Discover and collect</small></span>
                </button>
                <button className={selectedRole === "seller" ? "active" : ""} onClick={() => setSelectedRole("seller")}>
                  <Icon name="box" />
                  <span><strong>Seller</strong><small>List and manage pieces</small></span>
                </button>
              </div>
            )}
            <form onSubmit={handleSubmit}>
              {mode === "register" && <label>Full name<input name="fullName" required placeholder="Your name" /></label>}
              <label>Email address<input name="email" required type="email" placeholder="you@example.com" /></label>
              {mode !== "forgot" && <label>Password<input name="password" required type="password" placeholder="At least 8 characters" /></label>}
              {mode === "login" && <button type="button" className="forgot-link" onClick={() => navigate("forgot")}>Forgot password?</button>}
              {error && <div className="error-message" style={{ color: '#dc2626', marginTop: '1rem', fontSize: '0.875rem' }}>{error}</div>}
              <button type="submit" className="button primary wide-button" disabled={loading}>{loading ? 'Processing...' : (mode === "login" ? "Sign in" : mode === "register" ? "Create account" : "Send reset link")} <Icon name="arrow" /></button>
            </form>
            <p className="auth-switch">{mode === "login" ? "New to The Antiques?" : "Already have an account?"} <button onClick={() => navigate(mode === "login" ? "register" : "login")}>{mode === "login" ? "Create account" : "Sign in"}</button></p>
          </div>
        </div>
      </div>
    </main>
  );
}
