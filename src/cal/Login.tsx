import { useState } from "react";

import { Router } from "../router";
import { sendLoginCode, verifyLoginCode } from "./auth";
import { Button } from "./components/Button";
import { Input } from "./components/Input";

export function Login() {
  const [sentEmail, setSentEmail] = useState("");
  if (sentEmail === "") {
    return <Email setSentEmail={setSentEmail} />;
  }
  return <MagicCode sentEmail={sentEmail} />;
}

function Email({ setSentEmail }: { setSentEmail: (email: string) => void }) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  return (
    <div className="flex flex-col gap-4">
      <h2>Let&apos;s log you in!</h2>

      <form
        className="flex gap-2"
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
          id="email"
          name="email"
          onChange={(e) => setEmail(e.currentTarget.value)}
          placeholder="Enter your email"
          type="email"
          value={email}
        />

        <Button type="submit">Send Code</Button>
      </form>

      {error !== "" ? <p className="text-red-500">{error}</p> : null}
    </div>
  );
}

function MagicCode({ sentEmail }: { sentEmail: string }) {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  return (
    <div className="flex flex-col gap-4">
      <h2>Okay we sent an email to {sentEmail}! What was the code?</h2>
      <form
        className="flex gap-2"
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
        <Input onChange={(e) => setCode(e.currentTarget.value)} size={6} type="text" value={code} />

        <Button type="submit">Verify</Button>
      </form>

      {error !== "" ? <p className="text-red-500">{error}</p> : null}
    </div>
  );
}
