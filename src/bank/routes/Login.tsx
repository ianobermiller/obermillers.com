import { isAppleAuthConfigured, signInWithApple } from "@bank/core/appleAuth";
import { Button } from "@bank/ui/Button";
import { Card } from "@bank/ui/Card";
import { Input } from "@bank/ui/Input";
import { PageTitle } from "@bank/ui/PageTitle";
import type { ComponentProps } from "react";
import { useState } from "react";

import { LoginForm, type LoginButtonProps } from "../../auth/LoginForm";

export function Login() {
  return (
    <LoginForm
      Button={BankLoginButton}
      Input={BankLoginInput}
      alternate={
        isAppleAuthConfigured() ? (
          <>
            <p className="text-muted-foreground text-center text-sm font-bold">or</p>
            <AppleButton />
          </>
        ) : null
      }
      copy={{
        credentialsHint: "We'll email you a one-time code. No password to remember.",
        credentialsTitle: "Let’s log you in!",
        verifyHint: (email) => `We sent a code to ${email}.`,
        verifyTitle: "Check your email!",
      }}
      formClassName="flex flex-col gap-4"
      render={({ body, error, hint, phase, title }) => (
        <Card className="mx-auto flex max-w-sm flex-col gap-4 p-6">
          <div className="text-center">
            <div className="text-5xl">{phase === "verify" ? "📬" : "💰"}</div>
            <PageTitle className="mt-2">{title}</PageTitle>
            <p className="text-muted-foreground font-semibold">{hint}</p>
          </div>
          {body}
          {error !== "" ? (
            <p className="text-destructive text-center text-sm font-semibold">{error}</p>
          ) : null}
        </Card>
      )}
    />
  );
}

function BankLoginButton({
  children,
  disabled,
  onClick,
  type = "submit",
  variant,
}: LoginButtonProps) {
  return (
    <Button
      disabled={disabled}
      onClick={onClick}
      type={type}
      variant={variant === "primary" ? "default" : variant === "link" ? "link" : "outline"}
    >
      {children}
    </Button>
  );
}

function BankLoginInput(props: ComponentProps<"input">) {
  if (props.autoComplete === "one-time-code") {
    return <Input {...props} placeholder="Enter the code from the email" />;
  }
  return <Input {...props} />;
}

function AppleButton() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  return (
    <>
      <Button
        disabled={loading}
        onClick={() => {
          setLoading(true);
          setError("");
          signInWithApple()
            .catch((err: unknown) => {
              setError(err instanceof Error ? err.message : "Unknown error");
            })
            .finally(() => setLoading(false));
        }}
        type="button"
        variant="outline"
      >
        {loading ? "Signing in…" : "Sign in with Apple"}
      </Button>
      {error !== "" ? (
        <p className="text-destructive text-center text-sm font-semibold">{error}</p>
      ) : null}
    </>
  );
}
