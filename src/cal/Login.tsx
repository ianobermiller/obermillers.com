import type { ReactNode } from "react";
import { useState } from "react";

import { Router } from "../router";
import { sendLoginCode, verifyLoginCode } from "./auth";
import { Button } from "./components/Button";
import { Input } from "./components/Input";
import { Eyebrow } from "./components/Layout";

export function Login() {
  const [sentEmail, setSentEmail] = useState("");
  if (sentEmail === "") {
    return <Email setSentEmail={setSentEmail} />;
  }
  return <MagicCode sentEmail={sentEmail} />;
}

function LoginCard({
  children,
  eyebrow,
  hint,
  title,
}: {
  children: ReactNode;
  eyebrow: string;
  hint: string;
  title: string;
}) {
  return (
    <div className="mx-auto max-w-sm pt-20 pb-10">
      <div className="border-cc-border bg-cc-surface rounded-xl border p-6 shadow-xs">
        <Eyebrow>{eyebrow}</Eyebrow>
        <h2 className="mt-1.5 text-xl font-semibold tracking-tight">{title}</h2>
        <p className="text-cc-muted mt-1.5 text-sm leading-relaxed">{hint}</p>
        {children}
      </div>
    </div>
  );
}

function Email({ setSentEmail }: { setSentEmail: (email: string) => void }) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  return (
    <LoginCard
      eyebrow="Sign in"
      hint="We'll email you a one-time code. No password to remember."
      title="Let's log you in"
    >
      <form
        className="mt-5 flex flex-col gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (email === "") return;
          setSentEmail(email);
          void sendLoginCode(email).catch((err: unknown) => {
            console.error(err);
            setSentEmail("");
            setError(`Unable to send code${err instanceof Error ? `: ${err.message}` : ""}`);
          });
        }}
      >
        <Input
          autoComplete="email"
          className="w-full"
          id="email"
          name="email"
          onChange={(e) => setEmail(e.currentTarget.value)}
          placeholder="you@example.com"
          type="email"
          value={email}
        />

        <Button type="submit" variant="primary">
          Send code
        </Button>
      </form>

      {error !== "" ? <p className="text-cc-danger mt-3 text-sm">{error}</p> : null}
    </LoginCard>
  );
}

function MagicCode({ sentEmail }: { sentEmail: string }) {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  return (
    <LoginCard
      eyebrow="Check your email"
      hint={`We sent a code to ${sentEmail}. Enter it below to finish signing in.`}
      title="What was the code?"
    >
      <form
        className="mt-5 flex flex-col gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (code === "") return;
          void verifyLoginCode(sentEmail, code)
            .then(() => {
              Router.push("Cal");
            })
            .catch((err: unknown) => {
              console.error(err);
              setCode("");
              setError(`Unable to verify code${err instanceof Error ? `: ${err.message}` : ""}`);
            });
        }}
      >
        <Input
          autoComplete="one-time-code"
          className="w-full text-center text-lg tracking-[0.35em] tabular-nums"
          inputMode="numeric"
          onChange={(e) => setCode(e.currentTarget.value)}
          placeholder="······"
          type="text"
          value={code}
        />

        <Button type="submit" variant="primary">
          Verify
        </Button>
      </form>

      {error !== "" ? <p className="text-cc-danger mt-3 text-sm">{error}</p> : null}
    </LoginCard>
  );
}
