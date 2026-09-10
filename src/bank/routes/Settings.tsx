import { isPasskeySupported, registerPasskey, setPassword, signOut } from "@bank/core/authClient";
import { accrueAll, removeAllInterest } from "@bank/core/familyBank";
import { useIsParent, useUser } from "@bank/hooks/auth";
import { Button } from "@bank/ui/Button";
import { Input } from "@bank/ui/Input";
import { SignedMoney } from "@bank/ui/Money";
import { PageTitle } from "@bank/ui/PageTitle";
import { Panel } from "@bank/ui/Panel";
import { useCallback, useState } from "react";

import { authErrorMessage, throwIfAuthError } from "../../auth/authClient";
import { useColorScheme, type ColorSchemePreference } from "../../theme/colorScheme";

export function Settings() {
  const isParent = useIsParent();
  const user = useUser();
  const [interestSummaries, setInterestSummaries] = useState<
    {
      accountId: string;
      accountName: string;
      added: { timestamp: number; value: number }[];
      updated: { timestamp: number; value: number }[];
    }[]
  >();
  const handleEarnInterest = useCallback(async () => {
    setInterestSummaries(await accrueAll());
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <PageTitle>Settings</PageTitle>
        <p className="text-muted-foreground font-semibold">Your account and preferences</p>
      </div>

      {isParent && (
        <Panel
          description="4% a year, accrued daily and paid on the 1st of every month."
          icon="✨"
          title="Interest"
        >
          <Button className="self-start" onClick={handleEarnInterest}>
            Pay interest now
          </Button>

          {interestSummaries && <InterestResults summaries={interestSummaries} />}

          <Button
            className="border-destructive/40 text-destructive self-start"
            onClick={() => void removeAllInterest()}
            variant="outline"
          >
            Remove all interest
          </Button>
        </Panel>
      )}

      <Panel description="Pick how Family Bank looks on this device." icon="🎨" title="Look & feel">
        <ColorSchemePicker />
      </Panel>

      <SignInMethods />

      <Panel description={user?.email} icon="👋" title="You're signed in">
        <Button className="self-start" onClick={() => void signOut()} variant="outline">
          Log out
        </Button>
      </Panel>
    </div>
  );
}

const PREFERENCES: ColorSchemePreference[] = ["light", "dark", "system"];

function SignInMethods() {
  return (
    <>
      {isPasskeySupported() ? (
        <Panel
          description="Face ID, Touch ID, or a security key — no code to type."
          icon="🔑"
          title="Passkey"
        >
          <AddPasskey />
        </Panel>
      ) : null}

      <Panel
        description="Sign in with a password instead of an email code."
        icon="🔐"
        title="Password"
      >
        <PasswordForm />
      </Panel>
    </>
  );
}

function AddPasskey() {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  return (
    <>
      <Button
        className="self-start"
        disabled={busy}
        onClick={() => {
          setBusy(true);
          setError("");
          setMessage("");
          void registerPasskey()
            .then((result) => {
              throwIfAuthError(result.error);
              setMessage("Passkey saved. You can use it next time you log in.");
            })
            .catch((err: unknown) => {
              setError(authErrorMessage(err));
            })
            .finally(() => setBusy(false));
        }}
        variant="outline"
      >
        {busy ? "Waiting for your device…" : "Add a passkey"}
      </Button>
      {message !== "" ? <p className="text-sm font-semibold">{message}</p> : null}
      {error !== "" ? <p className="text-destructive text-sm font-semibold">{error}</p> : null}
    </>
  );
}

function PasswordForm() {
  const [password, setPasswordField] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(event) => {
        event.preventDefault();
        setBusy(true);
        setError("");
        setMessage("");
        void setPassword(password, confirm)
          .then((result) => {
            throwIfAuthError(result.error);
            setPasswordField("");
            setConfirm("");
            setMessage("Password saved.");
          })
          .catch((err: unknown) => {
            setError(authErrorMessage(err));
          })
          .finally(() => setBusy(false));
      }}
    >
      <Input
        autoComplete="new-password"
        minLength={8}
        onChange={(event) => setPasswordField(event.currentTarget.value)}
        placeholder="New password"
        required
        type="password"
        value={password}
      />
      <Input
        autoComplete="new-password"
        minLength={8}
        onChange={(event) => setConfirm(event.currentTarget.value)}
        placeholder="Confirm password"
        required
        type="password"
        value={confirm}
      />
      <Button className="self-start" disabled={busy} type="submit" variant="outline">
        {busy ? "Saving…" : "Save password"}
      </Button>
      {message !== "" ? <p className="text-sm font-semibold">{message}</p> : null}
      {error !== "" ? <p className="text-destructive text-sm font-semibold">{error}</p> : null}
    </form>
  );
}

/**
 * Three states are right here, unlike the header toggle: you came to this page
 * to decide something, so "follow the OS" is worth spelling out — along with
 * what it currently resolves to, since picking it produces no visible change.
 */
function ColorSchemePicker() {
  const { preference, setPreference, system } = useColorScheme();

  return (
    <div className="flex gap-3">
      {PREFERENCES.map((option) => (
        <Button
          aria-pressed={option === preference}
          className="grow capitalize"
          key={option}
          onClick={() => setPreference(option)}
          variant={option === preference ? "default" : "outline"}
        >
          {option === "system" ? `System (${system})` : option}
        </Button>
      ))}
    </div>
  );
}

function InterestResults({
  summaries,
}: {
  summaries: {
    accountId: string;
    accountName: string;
    added: { timestamp: number; value: number }[];
    updated: { timestamp: number; value: number }[];
  }[];
}) {
  const changed = summaries.filter(
    (summary) => summary.added.length > 0 || summary.updated.length > 0,
  );

  if (changed.length === 0) {
    return (
      <p className="text-muted-foreground font-semibold">Everything was already up to date.</p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {changed.map(({ accountId, accountName, added, updated }) => (
        <div className="bg-secondary rounded-md p-3" key={accountId}>
          <div className="mb-1 font-extrabold">{accountName}</div>
          {[
            ...added.map((tx) => ["Added", tx] as const),
            ...updated.map((tx) => ["Updated", tx] as const),
          ]
            .toSorted(([, a], [, b]) => a.timestamp - b.timestamp)
            .map(([label, { timestamp, value }]) => (
              <div
                className="flex items-center gap-2 text-sm font-semibold"
                key={`${label}-${timestamp}`}
              >
                <span className="text-muted-foreground">
                  {label} {new Date(timestamp).toLocaleDateString()}
                </span>
                <SignedMoney className="ml-auto" value={value} />
              </div>
            ))}
        </div>
      ))}
    </div>
  );
}
