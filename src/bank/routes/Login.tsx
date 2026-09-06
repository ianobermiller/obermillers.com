import { isAppleAuthConfigured, signInWithApple } from "@bank/core/appleAuth";
import {
  authClient,
  clearPendingOtp,
  peekPendingOtp,
  type OtpVerification,
} from "@bank/core/authClient";
import { Button } from "@bank/ui/Button";
import { Card } from "@bank/ui/Card";
import { Input } from "@bank/ui/Input";
import { PageTitle } from "@bank/ui/PageTitle";
import { useState } from "react";

type Mode = "code" | "password" | "reset" | "signUp";

export function Login() {
  const pending = peekPendingOtp();
  const [email, setEmail] = useState(pending?.email ?? "");
  const [mode, setMode] = useState<Mode>("code");
  const [verification, setVerification] = useState<OtpVerification | undefined>(
    pending?.verification,
  );

  return (
    <Card className="mx-auto flex max-w-sm flex-col gap-4 p-6">
      <div className="text-center">
        <div className="text-5xl">{verification ? "📬" : "💰"}</div>
        <PageTitle className="mt-2">
          {verification ? "Check your email!" : "Let’s log you in!"}
        </PageTitle>
        {verification && (
          <p className="text-muted-foreground font-semibold">We sent a code to {email}.</p>
        )}
      </div>

      {verification ? (
        <VerificationForm
          email={email}
          onCancel={() => {
            clearPendingOtp();
            setVerification(undefined);
          }}
          type={verification}
        />
      ) : (
        <CredentialsForm
          email={email}
          mode={mode}
          onEmailChange={setEmail}
          onModeChange={setMode}
          onVerification={setVerification}
        />
      )}

      {!verification && isAppleAuthConfigured() && (
        <>
          <p className="text-muted-foreground text-center text-sm font-bold">or</p>
          <AppleButton />
        </>
      )}
    </Card>
  );
}

function CredentialsForm({
  email,
  mode,
  onEmailChange,
  onModeChange,
  onVerification,
}: {
  email: string;
  mode: Mode;
  onEmailChange: (email: string) => void;
  onModeChange: (mode: Mode) => void;
  onVerification: (verification: OtpVerification) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState("");

  async function submit() {
    setLoading(true);
    try {
      if (mode === "code") {
        const result = await authClient.emailOtp.sendVerificationOtp({ email, type: "sign-in" });
        throwIfError(result.error);
        onVerification("email-code");
      } else if (mode === "reset") {
        const result = await authClient.emailOtp.requestPasswordReset({ email });
        throwIfError(result.error);
        onVerification("password-reset");
      } else if (mode === "signUp") {
        const result = await authClient.signUp.email({ email, name: email, password });
        throwIfError(result.error);
        onVerification("password-sign-up");
      } else {
        const result = await authClient.signIn.email({ email, password });
        throwIfError(result.error);
      }
    } catch (error) {
      alert("Uh oh: " + getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        if (email) void submit();
      }}
    >
      <Input
        autoComplete="email webauthn"
        name="email"
        onChange={(event) => onEmailChange(event.currentTarget.value)}
        placeholder="Enter your email"
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

      <Button disabled={loading} type="submit">
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
    </form>
  );
}

function VerificationForm({
  email,
  onCancel,
  type,
}: {
  email: string;
  onCancel: () => void;
  type: OtpVerification;
}) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState("");

  async function verify() {
    setLoading(true);
    try {
      if (type === "email-code") {
        const result = await authClient.signIn.emailOtp({ email, otp: code });
        throwIfError(result.error);
      } else if (type === "password-reset") {
        const result = await authClient.emailOtp.resetPassword({ email, otp: code, password });
        throwIfError(result.error);
        const signInResult = await authClient.signIn.email({ email, password });
        throwIfError(signInResult.error);
      } else {
        const result = await authClient.emailOtp.verifyEmail({ email, otp: code });
        throwIfError(result.error);
        const signInResult = await authClient.signIn.email({ email, password });
        throwIfError(signInResult.error);
      }
    } catch (error) {
      alert("Uh oh: " + getErrorMessage(error));
      setCode("");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        if (code) void verify();
      }}
    >
      <Input
        autoComplete="one-time-code"
        inputMode="numeric"
        onChange={(event) => setCode(event.currentTarget.value)}
        placeholder="Enter the code from the email"
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
      <Button disabled={loading} type="submit">
        {loading ? "Verifying…" : "Verify"}
      </Button>
      <Button onClick={onCancel} type="button" variant="link">
        Cancel
      </Button>
    </form>
  );
}

function AppleButton() {
  const [loading, setLoading] = useState(false);

  return (
    <Button
      disabled={loading}
      onClick={() => {
        setLoading(true);
        signInWithApple()
          .catch((error: unknown) => alert("Uh oh: " + getErrorMessage(error)))
          .finally(() => setLoading(false));
      }}
      type="button"
      variant="outline"
    >
      {loading ? "Signing in…" : "Sign in with Apple"}
    </Button>
  );
}

function throwIfError(error: null | { message?: string } | undefined): void {
  if (error) {
    throw new Error(error.message ?? "Authentication failed");
  }
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unknown error";
}
