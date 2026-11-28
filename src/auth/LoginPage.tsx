import { Link } from "@zoontek/chicane";
import { useEffect, useState, type ComponentProps } from "react";

import { Router } from "../router";
import { LoginForm, type LoginButtonProps } from "./LoginForm";
import { loginReturnTo } from "./loginNavigation";
import { pb } from "./pb";
import { usePbAuth } from "./usePbAuth";

import "./login.css";

export default function LoginPage() {
  const { user, ready } = usePbAuth();
  const [existingSession] = useState(() => pb.authStore.isValid);
  const returnTo = loginReturnTo(
    new URLSearchParams(window.location.search).get("returnTo"),
    window.location.origin,
  );

  useEffect(() => {
    document.title = "Log in · Obermillers";
  }, []);

  useEffect(() => {
    if (existingSession && ready && user) window.location.replace(returnTo);
  }, [existingSession, ready, user, returnTo]);

  return (
    <main className="hub-login">
      <div className="hub-login-content">
        <Link className="hub-login-brand" to={Router.Home()}>
          Obermillers
        </Link>
        {!ready || (existingSession && user) ? (
          <p role="status">Checking your session…</p>
        ) : (
          <LoginForm
            Button={LoginButton}
            Input={LoginInput}
            copy={{
              credentialsTitle: "Welcome back",
              credentialsHint:
                "One account for all your family apps. We’ll email you a code to sign in or create an account.",
              verifyTitle: "Check your email",
              verifyHint: (email) => `Enter the code we sent to ${email}.`,
            }}
            formClassName="hub-login-form"
            onSuccess={() => window.location.replace(returnTo)}
            render={({ body, error, hint, title }) => (
              <section className="hub-login-panel" aria-labelledby="hub-login-title">
                <p className="hub-login-eyebrow">Family hub</p>
                <h1 id="hub-login-title">{title}</h1>
                <p className="hub-login-hint">{hint}</p>
                {body}
                {error && (
                  <p className="hub-login-error" role="alert">
                    {error}
                  </p>
                )}
              </section>
            )}
          />
        )}
        <Link className="hub-login-home" to={Router.Home()}>
          Back to the family hub
        </Link>
      </div>
    </main>
  );
}

function LoginButton({ children, variant, type = "button", ...props }: LoginButtonProps) {
  return (
    <button {...props} className={`hub-login-button ${variant}`} type={type}>
      {children}
    </button>
  );
}

function LoginInput(props: ComponentProps<"input">) {
  const label =
    props.autoComplete === "one-time-code"
      ? "Verification code"
      : props.type === "email"
        ? "Email address"
        : props.autoComplete === "new-password"
          ? "New password"
          : "Password";
  return (
    <label className="hub-login-field">
      <span>{label}</span>
      <input {...props} />
    </label>
  );
}
