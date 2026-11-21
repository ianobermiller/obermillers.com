import { Gift, Plus, Search, ShieldCheck } from "lucide-react";
import { useEffect, useState, type ComponentProps, type ReactNode } from "react";

import { LoginForm, type LoginButtonProps } from "../auth/LoginForm";
import { pb, pbMessage } from "../auth/pb";
import { usePbAuth } from "../auth/usePbAuth";
import { PageShell } from "../PageShell";
import { balanceLookup, parseBalance } from "./balance";
import {
  loadAccess,
  loadCards,
  revealCard,
  confirmBalance,
  money,
  type CardAccess,
  type GiftCard,
} from "./data";

import "./style.css";

function Input(props: ComponentProps<"input">) {
  return <input {...props} className="gc-input" />;
}
function LoginButton({ variant: _variant, ...props }: LoginButtonProps) {
  return <button {...props} className="gc-button" />;
}
function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="gc-field">
      <span>{label}</span>
      {children}
    </label>
  );
}

export default function GiftCardsPage() {
  const auth = usePbAuth();
  useEffect(() => {
    document.title = "Gift cards · Obermillers";
  }, []);
  return (
    <PageShell
      backTo="/"
      backLabel="Family hub"
      title="Gift cards"
      description="A little less forgotten money. Keep your cards in one place."
      wide
    >
      <div className="gift-cards">
        {!auth.ready ? (
          <p role="status">Checking your session…</p>
        ) : auth.user ? (
          <Wallet key={auth.user.id} userId={auth.user.id} email={auth.user.email} />
        ) : (
          <section className="gc-panel gc-login">
            <LoginForm
              Button={LoginButton}
              Input={Input}
              formClassName="gc-stack"
              render={({ body, error, title, hint }) => (
                <>
                  <h2>{title}</h2>
                  <p>{hint}</p>
                  {body}
                  {error && <p role="alert">{error}</p>}
                </>
              )}
            />
          </section>
        )}
      </div>
    </PageShell>
  );
}

function Wallet({ userId, email }: { userId: string; email: string }) {
  const [cards, setCards] = useState<GiftCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("active");
  const [revision, setRevision] = useState(0);
  const [editing, setEditing] = useState<GiftCard | "new" | null>(null);
  useEffect(() => {
    let live = true;
    void loadCards()
      .then((items) => {
        if (live) {
          setCards(items);
          setError("");
        }
      })
      .catch(() => {
        if (live) {
          setCards([]);
          setError("Could not load gift cards. Try refreshing.");
        }
      })
      .finally(() => {
        if (live) setLoading(false);
      });
    return () => {
      live = false;
    };
  }, [revision]);
  useEffect(() => {
    const refresh = () => {
      if (editing !== null) return;
      setRevision((n) => n + 1);
    };
    const visible = () => {
      if (document.visibilityState === "visible") refresh();
    };
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", visible);
    const timer = window.setInterval(refresh, 60000);
    return () => {
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", visible);
      window.clearInterval(timer);
    };
  }, [editing]);
  const totals = new Map<GiftCard["currency"], number>();
  for (const card of cards)
    totals.set(card.currency, (totals.get(card.currency) ?? 0) + card.balance);
  const visible = cards.filter(
    (card) =>
      card.merchant.toLowerCase().includes(query.toLowerCase()) &&
      (filter === "all" || (filter === "used" ? card.balance === 0 : card.balance > 0)),
  );
  return (
    <>
      <div className="gc-toolbar">
        <span className="gc-muted gc-email">{email}</span>
        <button className="gc-link" onClick={() => pb.authStore.clear()}>
          Sign out
        </button>
      </div>
      <section className="gc-overview">
        <div>
          <p className="gc-eyebrow">Available balance</p>
          <div className="gc-total">
            {loading
              ? "…"
              : totals.size
                ? [...totals].map(([currency, balance]) => (
                    <span key={currency}>{money({ currency, balance })}</span>
                  ))
                : "$0.00"}
          </div>
          <p className="gc-muted">
            {cards.length} {cards.length === 1 ? "card" : "cards"}, including cards shared with you
          </p>
        </div>
        <button className="gc-button gc-primary" onClick={() => setEditing("new")}>
          <Plus size={18} />
          Add card
        </button>
      </section>
      <p className="gc-safety">
        <ShieldCheck size={18} />
        Private by default. Only you decide who gets access.
      </p>
      {editing !== null && (
        <CardForm
          key={editing === "new" ? "new" : editing.id}
          card={editing === "new" ? null : editing}
          userId={userId}
          onCancel={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            setRevision((n) => n + 1);
          }}
        />
      )}
      <div className="gc-toolbar gc-filters">
        <label className="gc-search" htmlFor="gift-card-search">
          <Search size={18} />
          <Input
            id="gift-card-search"
            aria-label="Search by merchant"
            placeholder="Find a merchant…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <select
          className="gc-input"
          aria-label="Filter cards"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="active">With a balance</option>
          <option value="all">All cards</option>
          <option value="used">Used up</option>
        </select>
        <button className="gc-link" onClick={() => setRevision((n) => n + 1)}>
          Refresh
        </button>
      </div>
      {error && (
        <p role="alert" className="gc-error">
          {error}
        </p>
      )}
      {loading ? (
        <p role="status">Loading your cards…</p>
      ) : visible.length === 0 ? (
        <div className="gc-empty">
          <Gift size={36} />
          <h2>{cards.length ? "No matching cards" : "Give your gift cards a home"}</h2>
          <p>
            {cards.length
              ? "Try another search or filter."
              : "Add your first card to keep its balance handy."}
          </p>
        </div>
      ) : (
        <div className="gc-grid">
          {visible.map((card) => (
            <Card
              key={card.id}
              card={card}
              own={card.owner === userId}
              onEdit={() => setEditing(card)}
              onChanged={() => setRevision((n) => n + 1)}
            />
          ))}
        </div>
      )}
      <p className="gc-footnote">
        Use Check balance to open the retailer’s checker and save a confirmed balance with the date.
        Sharing lets someone view the card, including its number and PIN. It does not send an email.
        Ask them to sign in here with that verified email.
      </p>
    </>
  );
}

function CardForm({
  card,
  userId,
  onSaved,
  onCancel,
}: {
  card: GiftCard | null;
  userId: string;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return (
    <section className="gc-panel">
      <h2>{card ? "Edit card" : "Add a gift card"}</h2>
      <form
        className="gc-stack"
        autoComplete="off"
        onSubmit={(e) => {
          e.preventDefault();
          const form = new FormData(e.currentTarget);
          const value = (name: string) => {
            const entry = form.get(name);
            return typeof entry === "string" ? entry : "";
          };
          const amount = value("balance");
          const balance = parseBalance(amount);
          if (balance === null) {
            setError("Enter a balance from 0 to 1,000,000 with up to two decimal places.");
            return;
          }
          const body = {
            owner: userId,
            merchant: value("merchant").trim(),
            balance,
            currency: value("currency"),
            ...(value("number").trim() || form.has("removeNumber")
              ? { cardNumber: form.has("removeNumber") ? "" : value("number").trim() }
              : {}),
            ...(value("pin").trim() || form.has("removePin")
              ? { cardPin: form.has("removePin") ? "" : value("pin").trim() }
              : {}),
            expires: value("expires"),
            notes: value("notes").trim(),
          };
          setBusy(true);
          setError("");
          const request = card
            ? pb.collection("giftcards").update(card.id, body)
            : pb.collection("giftcards").create(body);
          void request.then(onSaved).catch(() => {
            setError("Could not save this card. Check the fields and try again.");
            setBusy(false);
          });
        }}
      >
        <div className="gc-form-grid">
          <Field label="Merchant">
            <Input name="merchant" defaultValue={card?.merchant ?? ""} maxLength={120} required />
          </Field>
          <Field label="Remaining balance">
            <Input
              name="balance"
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0"
              max="1000000"
              defaultValue={card ? (card.balance / 100).toFixed(2) : ""}
              placeholder="0.00"
              required
            />
          </Field>
          <Field label="Currency">
            <select className="gc-input" name="currency" defaultValue={card?.currency ?? "USD"}>
              {["USD", "CAD", "EUR", "GBP"].map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </Field>
          <Field label="Expiration (optional)">
            <Input name="expires" type="date" defaultValue={card?.expires ?? ""} />
          </Field>
          <Field label="Card number / code (optional)">
            <Input
              name="number"
              type="password"
              maxLength={200}
              placeholder={card?.hasNumber ? "Leave blank to keep saved number" : ""}
            />
          </Field>
          <Field label="PIN (optional)">
            <Input
              name="pin"
              type="password"
              maxLength={100}
              placeholder={card?.hasPin ? "Leave blank to keep saved PIN" : ""}
            />
          </Field>
        </div>
        {card?.hasNumber && (
          <label className="gc-check">
            <input type="checkbox" name="removeNumber" /> Remove saved card number
          </label>
        )}
        {card?.hasPin && (
          <label className="gc-check">
            <input type="checkbox" name="removePin" /> Remove saved PIN
          </label>
        )}
        <Field label="Notes (optional)">
          <textarea
            className="gc-input"
            name="notes"
            rows={3}
            maxLength={2000}
            defaultValue={card?.notes ?? ""}
          />
        </Field>
        <p className="gc-muted">
          Card numbers and PINs are encrypted on the server. Notes are not encrypted; keep codes out
          of notes. People you share with can reveal the saved details.
        </p>
        {error && (
          <p role="alert" className="gc-error">
            {error}
          </p>
        )}
        <div className="gc-actions">
          <button className="gc-button gc-primary" disabled={busy}>
            {busy ? "Saving…" : "Save card"}
          </button>
          <button type="button" className="gc-button" disabled={busy} onClick={onCancel}>
            Cancel
          </button>
        </div>
      </form>
    </section>
  );
}

function Card({
  card,
  own,
  onEdit,
  onChanged,
}: {
  card: GiftCard;
  own: boolean;
  onEdit: () => void;
  onChanged: () => void;
}) {
  const [revealed, setRevealed] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [checking, setChecking] = useState<GiftCard | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    if (!revealed) return;
    const hide = () => setRevealed(false);
    const timer = window.setTimeout(hide, 30000);
    window.addEventListener("blur", hide);
    document.addEventListener("visibilitychange", hide);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("blur", hide);
      document.removeEventListener("visibilitychange", hide);
    };
  }, [revealed]);
  const today = new Date();
  const localDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  return (
    <article className="gc-card">
      <div className="gc-card-heading">
        <span className="gc-card-icon">
          <Gift size={22} />
        </span>
        <span className="gc-badge">{own ? "Only you + people you add" : "Shared with you"}</span>
      </div>
      <h2>{card.merchant}</h2>
      <p className="gc-amount">
        {money(card)} <span>{card.currency}</span>
      </p>
      <p className="gc-muted gc-last-checked">
        {card.balanceCheckedAt ? (
          <>
            Last checked{" "}
            <time dateTime={card.balanceCheckedAt.replace(" ", "T")}>
              {new Intl.DateTimeFormat(undefined, {
                dateStyle: "medium",
                timeStyle: "short",
              }).format(new Date(card.balanceCheckedAt.replace(" ", "T")))}
            </time>{" "}
            · entered manually
          </>
        ) : (
          "Balance not checked yet"
        )}
      </p>
      {card.expires && (
        <p className={card.expires < localDate ? "gc-expired" : "gc-muted"}>
          {card.expires < localDate ? "Expired" : "Expires"} {card.expires}
        </p>
      )}
      {card.notes && <p className="gc-notes">{card.notes}</p>}
      {(card.hasNumber || card.hasPin) && (
        <div className="gc-codes">
          {revealed ? (
            <SecretDetails id={card.id} />
          ) : (
            <>
              <p>
                Card: <span>{card.hasNumber ? "•••• ••••" : "Not set"}</span>
              </p>
              {card.hasPin && (
                <p>
                  PIN: <span>••••</span>
                </p>
              )}
            </>
          )}
          <button
            className="gc-link"
            aria-pressed={revealed}
            onClick={() => setRevealed(!revealed)}
          >
            {revealed ? "Hide details" : "Reveal for 30 seconds"}
          </button>
        </div>
      )}
      <div className="gc-actions">
        <button
          className="gc-button"
          aria-expanded={checking !== null}
          onClick={() => setChecking(checking === null ? card : null)}
        >
          Check balance
        </button>
      </div>
      {checking && (
        <BalanceCheck
          card={checking}
          own={own}
          onReload={() => {
            setChecking(null);
            onChanged();
          }}
          onCancel={() => setChecking(null)}
        />
      )}
      {own && (
        <div className="gc-actions">
          <button className="gc-button" onClick={onEdit}>
            Edit
          </button>
          <button
            className="gc-button"
            aria-expanded={sharing}
            onClick={() => setSharing(!sharing)}
          >
            Manage access
          </button>
          <button className="gc-link" onClick={() => setConfirmDelete(!confirmDelete)}>
            Delete
          </button>
        </div>
      )}
      {sharing && <Sharing cardId={card.id} />}
      {confirmDelete && (
        <div className="gc-confirm">
          <p>Delete this gift card and revoke all shared access? This cannot be undone.</p>
          <div className="gc-actions">
            <button
              className="gc-button"
              disabled={busy}
              onClick={() => {
                setBusy(true);
                void pb
                  .collection("giftcards")
                  .delete(card.id)
                  .then(onChanged)
                  .catch(() => {
                    setError("Could not delete this card.");
                    setBusy(false);
                  });
              }}
            >
              Delete permanently
            </button>
            <button className="gc-link" disabled={busy} onClick={() => setConfirmDelete(false)}>
              Keep card
            </button>
          </div>
        </div>
      )}
      {error && (
        <p role="alert" className="gc-error">
          {error}
        </p>
      )}
    </article>
  );
}

function BalanceCheck({
  card,
  own,
  onReload,
  onCancel,
}: {
  card: GiftCard;
  own: boolean;
  onReload: () => void;
  onCancel: () => void;
}) {
  const retailer = balanceLookup(card.merchant);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return (
    <section className="gc-sharing gc-stack">
      <h3>Check {card.merchant} balance</h3>
      <p className="gc-muted">
        {retailer?.instructions ??
          "Check the retailer’s website, call the number on the card, or ask in store. Then save the balance you confirmed below."}
      </p>
      {retailer && (
        <a className="gc-button" href={retailer.url} target="_blank" rel="noopener noreferrer">
          Open {retailer.name} balance help
        </a>
      )}
      {(card.hasNumber || card.hasPin) && (
        <p className="gc-muted">
          Use Reveal above if you need your saved card number or PIN. Card details are not sent in
          the link.
        </p>
      )}
      {own ? (
        <form
          className="gc-stack"
          onSubmit={(event) => {
            event.preventDefault();
            const entry = new FormData(event.currentTarget).get("checkedBalance");
            const balance = typeof entry === "string" ? parseBalance(entry) : null;
            if (balance === null) {
              setError("Enter a balance from 0 to 1,000,000 with up to two decimal places.");
              return;
            }
            setBusy(true);
            setError("");
            void confirmBalance(card, balance)
              .then(onReload)
              .catch((e: unknown) => {
                setError(pbMessage(e));
                setBusy(false);
              });
          }}
        >
          <Field label={`Confirmed balance (${card.currency})`}>
            <Input
              name="checkedBalance"
              type="number"
              inputMode="decimal"
              required
              min="0"
              max="1000000"
              step="0.01"
              placeholder="0.00"
            />
          </Field>
          <label className="gc-check">
            <input type="checkbox" required name="confirmedCheck" />I checked this balance with the
            retailer.
          </label>
          <p className="gc-muted">
            Save the confirmed amount, even if it has not changed. The check date is recorded when
            you save.
          </p>
          {error && (
            <div>
              <p role="alert" className="gc-error">
                {error}
              </p>
              <button type="button" className="gc-link" onClick={onReload}>
                Close and refresh
              </button>
            </div>
          )}
          <div className="gc-actions">
            <button className="gc-button gc-primary" disabled={busy}>
              {busy ? "Saving…" : "Save checked balance"}
            </button>
            <button type="button" className="gc-button" disabled={busy} onClick={onCancel}>
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <>
          <p className="gc-muted">
            Only the owner can save a confirmed balance. You can still check it with the retailer.
          </p>
          <button className="gc-button" onClick={onCancel}>
            Close
          </button>
        </>
      )}
    </section>
  );
}

function SecretDetails({ id }: { id: string }) {
  const [result, setResult] = useState<
    | { kind: "loading" }
    | { kind: "loaded"; secrets: Awaited<ReturnType<typeof revealCard>> }
    | { kind: "error" }
  >({ kind: "loading" });
  useEffect(() => {
    let active = true;
    void revealCard(id)
      .then((secrets) => {
        if (active) setResult({ kind: "loaded", secrets });
      })
      .catch(() => {
        if (active) setResult({ kind: "error" });
      });
    return () => {
      active = false;
    };
  }, [id]);
  if (result.kind === "loading") return <p role="status">Loading details…</p>;
  if (result.kind === "error")
    return (
      <p role="alert" className="gc-error">
        Could not reveal this card. Refresh to check your access.
      </p>
    );
  return (
    <>
      <p>
        Card: <span>{result.secrets.number || "Not set"}</span>
      </p>
      {result.secrets.pin && (
        <p>
          PIN: <span>{result.secrets.pin}</span>
        </p>
      )}
    </>
  );
}

function Sharing({ cardId }: { cardId: string }) {
  const [access, setAccess] = useState<CardAccess[]>([]);
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(true);
  useEffect(() => {
    let live = true;
    void loadAccess(cardId)
      .then((items) => {
        if (live) setAccess(items);
      })
      .catch(() => {
        if (live) setError("Could not load access. Close and try again.");
      })
      .finally(() => {
        if (live) setBusy(false);
      });
    return () => {
      live = false;
    };
  }, [cardId]);
  async function change(action: () => Promise<unknown>) {
    setBusy(true);
    setError("");
    try {
      await action();
      setAccess(await loadAccess(cardId));
      setEmail("");
    } catch (e) {
      setError(pbMessage(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="gc-sharing">
      <h3>Who can view this card</h3>
      <p className="gc-muted">
        People you add can view the balance, number, and PIN. Only you can make changes.
      </p>
      <ul>
        {access.map((item) => (
          <li key={item.id}>
            <span>{item.email}</span>
            <button
              className="gc-link"
              disabled={busy}
              onClick={() => void change(() => pb.collection("giftcard_access").delete(item.id))}
            >
              Revoke<span className="sr-only"> access for {item.email}</span>
            </button>
          </li>
        ))}
      </ul>
      <form
        className="gc-stack"
        onSubmit={(e) => {
          e.preventDefault();
          void change(() =>
            pb
              .collection("giftcard_access")
              .create({ card: cardId, email: email.trim().toLowerCase() }),
          );
        }}
      >
        <Field label="Share with email">
          <Input
            type="email"
            required
            maxLength={254}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="family@example.com"
          />
        </Field>
        <button className="gc-button" disabled={busy}>
          Give view access
        </button>
      </form>
      {error && (
        <p role="alert" className="gc-error">
          {error}
        </p>
      )}
    </section>
  );
}
