import type { ComponentProps, ComponentType, ReactNode } from "react";
import { useState } from "react";

import {
  authErrorMessage,
  clearPendingOtp,
  peekPendingOtp,
  requestPasswordReset,
  resetPassword,
  sendVerificationOtp,
  signInWithOtp,
  signInWithPassword,
  signUpWithEmail,
  throwIfAuthError,
  verifyEmailOtp,
  type OtpVerification,
} from "./authClient";

export type LoginMode = "code" | "password" | "reset" | "signUp";

export type LoginButtonProps = {
  children: ReactNode;
  disabled?: boolean;
  onClick?: () => void;
  type?: "button" | "submit";
  variant: "link" | "outline" | "primary";
};

export type LoginCopy = {
  credentialsHint: string;
  credentialsTitle: string;
  verifyHint: (email: string) => string;
  verifyTitle: string;
};

export type LoginFields = {
  body: ReactNode;
  error: string;
  hint: string;
  phase: "credentials" | "verify";
  title: string;
};

const defaultCopy: LoginCopy = {
  credentialsHint: "We'll email you a one-time code. No password to remember.",
  credentialsTitle: "Let's log you in",
  verifyHint: (email) => `We sent a code to ${email}. Enter it below to finish signing in.`,
  verifyTitle: "What was the code?",
};

export function LoginForm({
  Button,
  Input,
  allowPassword = true,
  alternate,
  copy = defaultCopy,
  formClassName,
  onSuccess,
  render,
}: {
  Button: ComponentType<LoginButtonProps>;
  Input: ComponentType<ComponentProps<"input">>;
  allowPassword?: boolean;
  alternate?: ReactNode;
  copy?: LoginCopy;
  formClassName: string;
  onSuccess?: () => void;
  render: (fields: LoginFields) => ReactNode;
}) {
  const pending = peekPendingOtp();
  const [email, setEmail] = useState(pending?.email ?? "");
  const [mode, setMode] = useState<LoginMode>("code");
  const [verification, setVerification] = useState<OtpVerification | undefined>(
    pending?.verification,
  );
  const [error, setError] = useState("");

  const phase = verification ? "verify" : "credentials";
  const title = phase === "verify" ? copy.verifyTitle : copy.credentialsTitle;
  const hint = phase === "verify" ? copy.verifyHint(email) : copy.credentialsHint;

  const credentials = (
    <CredentialsForm
      Button={Button}
      Input={Input}
      allowPassword={allowPassword}
      email={email}
      formClassName={formClassName}
      mode={mode}
      onEmailChange={setEmail}
      onError={setError}
      onModeChange={setMode}
      onVerification={setVerification}
      {...(onSuccess ? { onSuccess } : {})}
    />
  );

  const body =
    verification === undefined ? (
      alternate ? (
        <div className={formClassName}>
          {credentials}
          {alternate}
        </div>
      ) : (
        credentials
      )
    ) : (
      <VerificationForm
        Button={Button}
        Input={Input}
        email={email}
        formClassName={formClassName}
        onCancel={() => {
          clearPendingOtp();
          setVerification(undefined);
          setError("");
        }}
        onError={setError}
        type={verification}
        {...(onSuccess ? { onSuccess } : {})}
      />
    );

  return render({ body, error, hint, phase, title });
}

function CredentialsForm({
  Button,
  Input,
  allowPassword,
  email,
  formClassName,
  mode,
  onEmailChange,
  onError,
  onModeChange,
  onSuccess,
  onVerification,
}: {
  Button: ComponentType<LoginButtonProps>;
  Input: ComponentType<ComponentProps<"input">>;
  allowPassword: boolean;
  email: string;
  formClassName: string;
  mode: LoginMode;
  onEmailChange: (email: string) => void;
  onError: (error: string) => void;
  onModeChange: (mode: LoginMode) => void;
  onSuccess?: () => void;
  onVerification: (verification: OtpVerification) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState("");

  async function submit() {
    setLoading(true);
    onError("");
    try {
      if (mode === "code") {
        const result = await sendVerificationOtp(email);
        throwIfAuthError(result.error);
        onVerification("email-code");
      } else if (mode === "reset") {
        const result = await requestPasswordReset(email);
        throwIfAuthError(result.error);
        onVerification("password-reset");
      } else if (mode === "signUp") {
        const result = await signUpWithEmail(email, email, password);
        throwIfAuthError(result.error);
        onVerification("password-sign-up");
      } else {
        const result = await signInWithPassword(email, password);
        throwIfAuthError(result.error);
        onSuccess?.();
      }
    } catch (error) {
      onError(authErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      className={formClassName}
      onSubmit={(event) => {
        event.preventDefault();
        if (email) void submit();
      }}
    >
      <Input
        autoComplete="email webauthn"
        name="email"
        onChange={(event) => onEmailChange(event.currentTarget.value)}
        placeholder="you@example.com"
        required
        type="email"
        value={email}
      />

      {mode !== "code" && mode !== "reset" && (
        <Input
          autoComplete={mode === "signUp" ? "new-password" : "current-password webauthn"}
          minLength={8}
          onChange={(event) => setPassword(event.currentTarget.value)}
          placeholder="Password"
          required
          type="password"
          value={password}
        />
      )}

      <Button disabled={loading} type="submit" variant="primary">
        {loading
          ? "Please wait…"
          : mode === "code"
            ? "Send code"
            : mode === "reset"
              ? "Send reset code"
              : mode === "signUp"
                ? "Create account"
                : "Sign in"}
      </Button>

      {allowPassword ? (
        <div className="flex flex-wrap justify-center gap-x-2">
          {mode !== "code" && (
            <Button onClick={() => onModeChange("code")} type="button" variant="link">
              Use an email code
            </Button>
          )}
          {mode !== "password" && (
            <Button onClick={() => onModeChange("password")} type="button" variant="link">
              Use a password
            </Button>
          )}
          {mode === "password" && (
            <>
              <Button onClick={() => onModeChange("reset")} type="button" variant="link">
                Forgot password?
              </Button>
              <Button onClick={() => onModeChange("signUp")} type="button" variant="link">
                Create an account
              </Button>
            </>
          )}
        </div>
      ) : null}
    </form>
  );
}

function VerificationForm({
  Button,
  Input,
  email,
  formClassName,
  onCancel,
  onError,
  onSuccess,
  type,
}: {
  Button: ComponentType<LoginButtonProps>;
  Input: ComponentType<ComponentProps<"input">>;
  email: string;
  formClassName: string;
  onCancel: () => void;
  onError: (error: string) => void;
  onSuccess?: () => void;
  type: OtpVerification;
}) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState("");

  async function verify() {
    setLoading(true);
    onError("");
    try {
      if (type === "email-code") {
        const result = await signInWithOtp(email, code);
        throwIfAuthError(result.error);
      } else if (type === "password-reset") {
        const result = await resetPassword(email, code, password);
        throwIfAuthError(result.error);
        const signInResult = await signInWithPassword(email, password);
        throwIfAuthError(signInResult.error);
      } else {
        const result = await verifyEmailOtp(email, code);
        throwIfAuthError(result.error);
        const signInResult = await signInWithPassword(email, password);
        throwIfAuthError(signInResult.error);
      }
      onSuccess?.();
    } catch (error) {
      onError(authErrorMessage(error));
      setCode("");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      className={formClassName}
      onSubmit={(event) => {
        event.preventDefault();
        if (code) void verify();
      }}
    >
      <Input
        autoComplete="one-time-code"
        inputMode="numeric"
        onChange={(event) => setCode(event.currentTarget.value)}
        placeholder="······"
        required
        value={code}
      />
      {type !== "email-code" && (
        <Input
          autoComplete="new-password"
          minLength={8}
          onChange={(event) => setPassword(event.currentTarget.value)}
          placeholder="New password"
          required
          type="password"
          value={password}
        />
      )}
      <Button disabled={loading} type="submit" variant="primary">
        {loading ? "Verifying…" : "Verify"}
      </Button>
      <Button onClick={onCancel} type="button" variant="link">
        Cancel
      </Button>
    </form>
  );
}
