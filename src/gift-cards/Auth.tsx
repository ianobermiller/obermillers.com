import { useState } from "react";

import {
  authErrorMessage,
  clearPendingOtp,
  peekPendingOtp,
  sendAccountCode,
  sendPasswordResetLink,
  signInWithOtp,
  signInWithPassword,
  throwIfAuthError,
} from "../auth/authClient";
import { isPasskeySupported, signInWithPasskey } from "../auth/passkey";

type Panel = { kind: "email" } | { kind: "password" } | { kind: "verify"; email: string };

export function GiftCardAuth() {
  const pending = peekPendingOtp();
  const [panel, setPanel] = useState<Panel>(() =>
    pending?.verification === "email-code"
      ? { kind: "verify", email: pending.email }
      : { kind: "email" },
  );
  const [email, setEmail] = useState(pending?.email ?? "");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  function switchPanel(kind: "email" | "password") {
    clearPendingOtp();
    setPanel({ kind });
    setPassword("");
    setCode("");
    setError("");
    setNotice("");
  }

  async function submit() {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      if (panel.kind === "verify") {
        throwIfAuthError((await signInWithOtp(panel.email, code.trim())).error);
      } else if (panel.kind === "password") {
        throwIfAuthError((await signInWithPassword(email.trim().toLowerCase(), password)).error);
      } else {
        const normalized = email.trim().toLowerCase();
        throwIfAuthError((await sendAccountCode(normalized)).error);
        setEmail(normalized);
        setCode("");
        setPanel({ kind: "verify", email: normalized });
      }
    } catch (cause) {
      setError(authErrorMessage(cause));
      setCode("");
    } finally {
      setBusy(false);
    }
  }

  async function resetPassword() {
    if (!email.trim()) {
      setError("Enter your email address first.");
      return;
    }
    setBusy(true);
    setError("");
    setNotice("");
    try {
      throwIfAuthError((await sendPasswordResetLink(email.trim().toLowerCase())).error);
      setNotice("Check your email for a password reset link.");
    } catch (cause) {
      setError(authErrorMessage(cause));
    } finally {
      setBusy(false);
    }
  }

  async function usePasskey() {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      throwIfAuthError((await signInWithPasskey(email.trim().toLowerCase())).error);
    } catch (cause) {
      setError(authErrorMessage(cause));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="gc-auth-wrap">
      <section className="gc-panel gc-auth" aria-labelledby="gc-auth-title">
        <header className="gc-auth-heading">
          <h2 id="gc-auth-title">Sign in or create account</h2>
          <p className="gc-muted">Enter your email to keep track of your gift cards.</p>
        </header>
        <form
          className="gc-stack"
          onSubmit={(event) => {
            event.preventDefault();
            if (!busy) void submit();
          }}
        >
          {panel.kind === "verify" ? (
            <>
              <p className="gc-muted">
                We sent a code to <strong>{panel.email}</strong>.
              </p>
              <label className="gc-field" htmlFor="gc-auth-code">
                <span>Verification code</span>
                <input
                  className="gc-input gc-code-input"
                  id="gc-auth-code"
                  name="code"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  placeholder="123456"
                  required
                  pattern="[0-9]+"
                  value={code}
                  disabled={busy}
                  aria-invalid={Boolean(error)}
                  aria-describedby={error ? "gc-auth-error" : undefined}
                  onChange={(event) => setCode(event.target.value)}
                />
              </label>
            </>
          ) : (
            <>
              <label className="gc-field" htmlFor="gc-auth-email">
                <span>Email address</span>
                <input
                  className="gc-input"
                  id="gc-auth-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  required
                  value={email}
                  disabled={busy}
                  aria-invalid={Boolean(error)}
                  aria-describedby={error ? "gc-auth-error" : undefined}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </label>
              {panel.kind === "password" && (
                <label className="gc-field" htmlFor="gc-auth-password">
                  <span>Password</span>
                  <input
                    className="gc-input"
                    id="gc-auth-password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    minLength={8}
                    required
                    value={password}
                    disabled={busy}
                    onChange={(event) => setPassword(event.target.value)}
                  />
                </label>
              )}
            </>
          )}
          {error && (
            <p className="gc-error" role="alert" id="gc-auth-error">
              {error}
            </p>
          )}
          {notice && (
            <p className="gc-notice" role="status">
              {notice}
            </p>
          )}
          <button
            className="gc-button gc-primary gc-auth-submit"
            type="submit"
            disabled={
              busy ||
              (panel.kind === "verify"
                ? !code.trim()
                : !email.trim() || (panel.kind === "password" && password.length < 8))
            }
          >
            {busy
              ? "Please wait…"
              : panel.kind === "verify"
                ? "Verify"
                : panel.kind === "password"
                  ? "Sign in"
                  : "Email me a code"}
          </button>
          <div className="gc-auth-alternatives">
            {panel.kind === "verify" ? (
              <button
                className="gc-link"
                type="button"
                disabled={busy}
                onClick={() => switchPanel("email")}
              >
                Use a different email
              </button>
            ) : (
              <>
                {panel.kind === "password" ? (
                  <>
                    <button
                      className="gc-link"
                      type="button"
                      disabled={busy}
                      onClick={() => void resetPassword()}
                    >
                      Forgot password?
                    </button>
                    <button
                      className="gc-link"
                      type="button"
                      disabled={busy}
                      onClick={() => switchPanel("email")}
                    >
                      Email me a code
                    </button>
                  </>
                ) : (
                  <button
                    className="gc-link"
                    type="button"
                    disabled={busy}
                    onClick={() => switchPanel("password")}
                  >
                    Use a password
                  </button>
                )}
                {isPasskeySupported() && (
                  <button
                    className="gc-link"
                    type="button"
                    disabled={busy}
                    onClick={() => void usePasskey()}
                  >
                    Sign in with a passkey
                  </button>
                )}
              </>
            )}
          </div>
        </form>
      </section>
    </div>
  );
}
