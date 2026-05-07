"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";

export default function LoginPage() {
  const router = useRouter();
  const [isSignup, setIsSignup] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const endpoint = isSignup ? "/api/auth/signup" : "/api/auth/login";
      const body = isSignup
        ? { username, password, displayName: displayName || username }
        : { username, password };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong");
        setLoading(false);
        return;
      }

      router.push(data.redirect || "/dashboard");
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  };

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        {/* Logo */}
        <div className={styles.logo}>
          <svg width="40" height="40" viewBox="0 0 48 48" fill="none">
            <defs>
              <linearGradient id="loginLogoGrad" x1="0" y1="0" x2="48" y2="48">
                <stop offset="0%" stopColor="#0a84ff" />
                <stop offset="100%" stopColor="#bf5af2" />
              </linearGradient>
            </defs>
            <circle cx="24" cy="24" r="22" stroke="url(#loginLogoGrad)" strokeWidth="2.5" fill="none" />
            <circle cx="24" cy="24" r="4" fill="url(#loginLogoGrad)" />
          </svg>
          <span>Nexus Feed</span>
        </div>

        {/* Card */}
        <div className={styles.card}>
          <h1 className={styles.title}>
            {isSignup ? "Create your account" : "Welcome back"}
          </h1>
          <p className={styles.subtitle}>
            {isSignup
              ? "Sign up to build your personalized daily digest"
              : "Sign in to see what happened today"}
          </p>

          <form onSubmit={handleSubmit} className={styles.form}>
            {isSignup && (
              <div className={styles.field}>
                <label className={styles.label} htmlFor="displayName">Display Name</label>
                <input
                  id="displayName"
                  type="text"
                  className="input"
                  placeholder="How should we call you?"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                />
              </div>
            )}

            <div className={styles.field}>
              <label className={styles.label} htmlFor="username">Username</label>
              <input
                id="username"
                type="text"
                className="input"
                placeholder="Enter a username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                minLength={3}
                maxLength={30}
                autoComplete="username"
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                className="input"
                placeholder={isSignup ? "Min 6 characters" : "Enter your password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                autoComplete={isSignup ? "new-password" : "current-password"}
              />
            </div>

            {error && (
              <div className={styles.error}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M8 1a7 7 0 100 14A7 7 0 008 1zm-.75 4a.75.75 0 011.5 0v3a.75.75 0 01-1.5 0V5zm.75 6.5a1 1 0 110-2 1 1 0 010 2z" />
                </svg>
                {error}
              </div>
            )}

            <button
              type="submit"
              className={`btn btn-primary btn-lg ${styles.submitBtn}`}
              disabled={loading || !username || !password}
              id="auth-submit"
            >
              {loading
                ? "Please wait..."
                : isSignup
                ? "Create Account"
                : "Sign In"}
            </button>
          </form>

          <div className={styles.switchMode}>
            <span className="text-caption">
              {isSignup ? "Already have an account?" : "Don't have an account?"}
            </span>
            <button
              className={styles.switchBtn}
              onClick={() => {
                setIsSignup(!isSignup);
                setError("");
              }}
              id="switch-auth-mode"
            >
              {isSignup ? "Sign in" : "Sign up"}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
