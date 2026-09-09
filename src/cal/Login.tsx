import type { ComponentProps } from "react";
import { useEffect } from "react";

import { LoginForm, type LoginButtonProps } from "../auth/LoginForm";
import { Router } from "../router";
import { useAuth } from "./auth";
import { Button, LinkButton } from "./components/Button";
import { Input } from "./components/Input";
import { Eyebrow } from "./components/Layout";

export function Login() {
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      Router.push("Cal");
    }
  }, [user]);

  if (user) {
    return null;
  }

  return (
    <LoginForm
      Button={CalLoginButton}
      Input={CalLoginInput}
      formClassName="mt-5 flex flex-col gap-2"
      onSuccess={() => {
        Router.push("Cal");
      }}
      render={({ body, error, hint, phase, title }) => (
        <div className="mx-auto max-w-sm pt-20 pb-10">
          <div className="border-cc-border bg-cc-surface rounded-xl border p-6 shadow-xs">
            <Eyebrow>{phase === "verify" ? "Check your email" : "Sign in"}</Eyebrow>
            <h2 className="mt-1.5 text-xl font-semibold tracking-tight">{title}</h2>
            <p className="text-cc-muted mt-1.5 text-sm leading-relaxed">{hint}</p>
            {body}
            {error !== "" ? <p className="text-cc-danger mt-3 text-sm">{error}</p> : null}
          </div>
        </div>
      )}
    />
  );
}

function CalLoginButton({
  children,
  disabled,
  onClick,
  type = "submit",
  variant,
}: LoginButtonProps) {
  if (variant === "link") {
    return (
      <LinkButton disabled={disabled} onClick={onClick} type={type}>
        {children}
      </LinkButton>
    );
  }
  return (
    <Button
      disabled={disabled}
      onClick={onClick}
      type={type}
      variant={variant === "outline" ? "secondary" : "primary"}
    >
      {children}
    </Button>
  );
}

function CalLoginInput(props: ComponentProps<"input">) {
  const centered = props.autoComplete === "one-time-code";
  return (
    <Input
      {...props}
      className={centered ? "w-full text-center text-lg tracking-[0.35em] tabular-nums" : "w-full"}
    />
  );
}
