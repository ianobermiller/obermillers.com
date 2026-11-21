import { Gift, Plus, Search, ShieldCheck } from "lucide-react";
import { useEffect, useState, type ComponentProps, type ReactNode } from "react";

import { LoginForm, type LoginButtonProps } from "../auth/LoginForm";
import { pb, pbMessage } from "../auth/pb";
import { usePbAuth } from "../auth/usePbAuth";
import { PageShell } from "../PageShell";
import { loadAccess, loadCards, money, type CardAccess, type GiftCard } from "./data";

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
        Balances are updated manually. Sharing lets someone view the card, including its number and
        PIN. It does not send an email. Ask them to sign in here with that verified email.
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
          if (!/^\d+(\.\d{1,2})?$/.test(amount)) {
            setError("Enter a positive balance with up to two decimal places.");
            return;
          }
          const balance = Math.round(Number(amount) * 100);
          const body = {
            owner: userId,
            merchant: value("merchant").trim(),
            balance,
            currency: value("currency"),
            number: value("number").trim(),
            pin: value("pin").trim(),
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
              defaultValue={card?.number ?? ""}
            />
          </Field>
          <Field label="PIN (optional)">
            <Input name="pin" type="password" maxLength={100} defaultValue={card?.pin ?? ""} />
          </Field>
        </div>
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
          Only store codes if you need them. They are accessible to the server administrator and
          anyone you share with.
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
      {card.expires && (
        <p className={card.expires < localDate ? "gc-expired" : "gc-muted"}>
          {card.expires < localDate ? "Expired" : "Expires"} {card.expires}
        </p>
      )}
      {card.notes && <p className="gc-notes">{card.notes}</p>}
      {(card.number || card.pin) && (
        <div className="gc-codes">
          <p>
            Card: <span>{revealed ? card.number || "Not set" : "•••• ••••"}</span>
          </p>
          {card.pin && (
            <p>
              PIN: <span>{revealed ? card.pin : "••••"}</span>
            </p>
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
