import * as Dialog from "@radix-ui/react-dialog";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Check, ChevronDown, Copy, Ellipsis, Plus, Search, UserRound, X } from "lucide-react";
import { useEffect, useId, useRef, useState, type ComponentProps, type ReactNode } from "react";

import { LoginRedirect } from "../auth/LoginRedirect";
import { pb, pbMessage } from "../auth/pb";
import { usePbAuth } from "../auth/usePbAuth";
import { PageShell } from "../PageShell";
import { balanceLookup, knownMerchants, parseBalance } from "./balance";
import {
  loadShares,
  loadCards,
  revealCard,
  confirmBalance,
  money,
  type WalletShare,
  type GiftCard,
} from "./data";
import cinemarkLogo from "./logos/cinemark.jpg";
import dominosLogo from "./logos/dominos.jpg";
import shakeShackLogo from "./logos/shakeshack.jpg";
import steakNShakeLogo from "./logos/steaknshake.jpg";
import targetLogo from "./logos/target.jpg";
import { groupCardsByStore, type StoreGroup } from "./stores";

import "./style.css";

function Input({ className = "", ...props }: ComponentProps<"input">) {
  return <input {...props} className={`gc-input ${className}`} />;
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
      wide
      headerAction={
        auth.ready && auth.user ? (
          <AccountMenu userId={auth.user.id} email={auth.user.email} />
        ) : undefined
      }
    >
      <div className="gift-cards">
        {!auth.ready ? (
          <p role="status">Checking your session…</p>
        ) : auth.user ? (
          <Wallet key={auth.user.id} userId={auth.user.id} />
        ) : (
          <LoginRedirect />
        )}
      </div>
    </PageShell>
  );
}

function AccountMenu({ userId, email }: { userId: string; email: string }) {
  const [sharing, setSharing] = useState(false);
  return (
    <Dialog.Root open={sharing} onOpenChange={setSharing}>
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <button className="gc-avatar" aria-label="Account menu">
            <UserRound size={21} aria-hidden="true" />
          </button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content
            className="gift-cards gc-account-menu"
            align="end"
            sideOffset={8}
            collisionPadding={16}
          >
            <DropdownMenu.Label className="gc-account-email">{email}</DropdownMenu.Label>
            <DropdownMenu.Separator className="gc-menu-separator" />
            <DropdownMenu.Item className="gc-menu-item" onSelect={() => setSharing(true)}>
              Share all cards
            </DropdownMenu.Item>
            <DropdownMenu.Item className="gc-menu-item" onSelect={() => pb.authStore.clear()}>
              Sign out
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
      <Dialog.Portal>
        <Dialog.Overlay className="gc-modal-overlay" />
        <Dialog.Content className="gift-cards gc-modal">
          <Sharing ownerId={userId} onClose={() => setSharing(false)} />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function Wallet({ userId }: { userId: string }) {
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
  const stores = groupCardsByStore(visible);
  return (
    <>
      <section className="gc-overview">
        <div>
          <p className="gc-muted">Total balance</p>
          <div className="gc-total">
            {loading
              ? "…"
              : totals.size
                ? [...totals].map(([currency, balance]) => (
                    <span key={currency}>{money({ currency, balance })}</span>
                  ))
                : "$0.00"}
          </div>
        </div>
        <div className="gc-actions">
          <button className="gc-button gc-primary" onClick={() => setEditing("new")}>
            <Plus size={18} />
            Add card
          </button>
        </div>
      </section>
      {editing !== null && (
        <CardForm
          key={editing === "new" ? "new" : editing.id}
          card={editing === "new" ? null : editing}
          userId={userId}
          merchants={[...new Set([...knownMerchants, ...cards.map((item) => item.merchant)])]}
          onCancel={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            setRevision((n) => n + 1);
          }}
        />
      )}
      <div className="gc-toolbar gc-filters">
        <label className="gc-search" htmlFor="gift-card-search">
          <Search size={18} aria-hidden="true" />
          <Input
            id="gift-card-search"
            aria-label="Search by merchant"
            placeholder="Search cards"
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
          <h2>{cards.length ? "No matching cards" : "No cards yet"}</h2>
        </div>
      ) : (
        <div className="gc-list">
          {stores.map((store) => (
            <Store
              key={store.key}
              store={store}
              userId={userId}
              onEdit={setEditing}
              onChanged={() => setRevision((n) => n + 1)}
            />
          ))}
        </div>
      )}
    </>
  );
}

function CardForm({
  card,
  userId,
  onSaved,
  onCancel,
  merchants,
}: {
  card: GiftCard | null;
  userId: string;
  onSaved: () => void;
  onCancel: () => void;
  merchants: string[];
}) {
  const merchantsId = useId();
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
            currency: "USD",
            ...(value("number").trim() || form.has("removeNumber")
              ? { cardNumber: form.has("removeNumber") ? "" : value("number").trim() }
              : {}),
            ...(value("pin").trim() || form.has("removePin")
              ? { cardPin: form.has("removePin") ? "" : value("pin").trim() }
              : {}),
            expires: value("expires"),
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
            <Input
              name="merchant"
              list={merchantsId}
              defaultValue={card?.merchant ?? ""}
              maxLength={120}
              autoComplete="off"
              required
            />
            <datalist id={merchantsId}>
              {merchants.toSorted().map((merchant) => (
                <option key={merchant} value={merchant}>
                  {merchant}
                </option>
              ))}
            </datalist>
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
          <Field label="Expiration (optional)">
            <Input name="expires" type="date" defaultValue={card?.expires ?? ""} />
          </Field>
          <Field label="Card number / code (optional)">
            <Input
              name="number"
              type="text"
              className="gc-secret-input"
              autoComplete="off"
              autoCapitalize="none"
              spellCheck={false}
              data-1p-ignore
              data-lpignore="true"
              data-bwignore
              maxLength={200}
              placeholder={card?.hasNumber ? "Leave blank to keep saved number" : ""}
            />
          </Field>
          <Field label="PIN (optional)">
            <Input
              name="pin"
              type="text"
              className="gc-secret-input"
              autoComplete="off"
              autoCapitalize="none"
              spellCheck={false}
              data-1p-ignore
              data-lpignore="true"
              data-bwignore
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

const storeLogos = [
  { name: "domino’s", src: dominosLogo },
  { name: "shake shack", src: shakeShackLogo },
  { name: "steak ’n shake", src: steakNShakeLogo },
  { name: "cinemark", src: cinemarkLogo },
  { name: "target", src: targetLogo },
];

function StoreLogo({ merchant }: { merchant: string }) {
  const [failed, setFailed] = useState(false);
  const name = balanceLookup(merchant)?.name ?? merchant.trim();
  const logo = storeLogos.find((store) => store.name === name.toLowerCase());
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
  return (
    <span className="gc-store-logo" aria-hidden="true">
      {logo && !failed ? (
        <img
          src={logo.src}
          alt=""
          width={36}
          height={36}
          decoding="async"
          onError={() => setFailed(true)}
        />
      ) : (
        initials
      )}
    </span>
  );
}

function Store({
  store,
  userId,
  onEdit,
  onChanged,
}: {
  store: StoreGroup;
  userId: string;
  onEdit: (card: GiftCard) => void;
  onChanged: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const panelId = useId();
  return (
    <section className="gc-store">
      <h2>
        <button
          className="gc-store-toggle"
          aria-expanded={expanded}
          aria-controls={panelId}
          onClick={() => setExpanded(!expanded)}
        >
          <StoreLogo key={store.merchant} merchant={store.merchant} />
          <span className="gc-store-label">
            <span className="gc-store-name">{store.merchant}</span>
            <span className="gc-store-meta">
              {store.cards.length} {store.cards.length === 1 ? "card" : "cards"}
              {store.checkedCount === store.cards.length && (
                <>
                  {" "}
                  · Checked{" "}
                  <time
                    dateTime={store.oldestCheckedAt.replace(" ", "T")}
                    title="Oldest last-check date among these cards"
                  >
                    {new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(
                      new Date(store.oldestCheckedAt.replace(" ", "T")),
                    )}
                  </time>
                </>
              )}
            </span>
          </span>
          <span className="gc-amount">{money(store)}</span>
          <ChevronDown
            size={18}
            className={expanded ? "gc-store-expanded" : ""}
            aria-hidden="true"
          />
        </button>
      </h2>
      {expanded && (
        <div id={panelId} className="gc-store-cards">
          {store.cards.map((card) => (
            <Card
              key={card.id}
              card={card}
              own={card.owner === userId}
              onEdit={() => onEdit(card)}
              onChanged={onChanged}
            />
          ))}
        </div>
      )}
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
  const [checking, setChecking] = useState<GiftCard | null>(null);
  const actionsRef = useRef<HTMLButtonElement>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return (
    <Dialog.Root
      open={checking !== null}
      onOpenChange={(open) => {
        if (!open) setChecking(null);
      }}
    >
      <article className="gc-card">
        <div className="gc-row-main">
          <div className="gc-row-name">
            <h3>
              <time dateTime={card.created.replace(" ", "T")}>
                {new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(
                  new Date(card.created.replace(" ", "T")),
                )}
              </time>
              {card.numberLast4 && <span className="gc-card-suffix"> *{card.numberLast4}</span>}
            </h3>
            {(card.balanceCheckedAt || !own) && (
              <p className="gc-muted">
                {card.balanceCheckedAt && (
                  <>
                    Checked{" "}
                    <time
                      dateTime={card.balanceCheckedAt.replace(" ", "T")}
                      title={new Date(card.balanceCheckedAt.replace(" ", "T")).toLocaleString()}
                    >
                      {new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(
                        new Date(card.balanceCheckedAt.replace(" ", "T")),
                      )}
                    </time>
                  </>
                )}
                {!own && (card.balanceCheckedAt ? " · Shared" : "Shared")}
              </p>
            )}
          </div>
          <p className="gc-amount">{money(card)}</p>
          <div className="gc-row-actions">
            <CopyCardDetails card={card} />
            <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild>
                <button
                  ref={actionsRef}
                  className="gc-icon-button"
                  aria-label="Card actions"
                  title="Card actions"
                >
                  <Ellipsis size={20} aria-hidden="true" />
                </button>
              </DropdownMenu.Trigger>
              <DropdownMenu.Portal>
                <DropdownMenu.Content
                  className="gift-cards gc-account-menu gc-card-menu"
                  align="end"
                  sideOffset={4}
                  collisionPadding={16}
                >
                  <DropdownMenu.Item className="gc-menu-item" onSelect={() => setChecking(card)}>
                    Check
                  </DropdownMenu.Item>
                  {own && (
                    <>
                      <DropdownMenu.Item className="gc-menu-item" onSelect={onEdit}>
                        Edit
                      </DropdownMenu.Item>
                      <DropdownMenu.Item
                        className="gc-menu-item gc-menu-delete"
                        onSelect={() => setConfirmDelete(true)}
                      >
                        Delete
                      </DropdownMenu.Item>
                    </>
                  )}
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>
          </div>
        </div>
        {confirmDelete && (
          <div className="gc-confirm">
            <p>Delete {card.merchant}? This cannot be undone.</p>
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
        {checking && (
          <Dialog.Portal>
            <Dialog.Overlay className="gc-modal-overlay" />
            <Dialog.Content
              className="gift-cards gc-modal gc-balance-modal"
              onCloseAutoFocus={(event) => {
                event.preventDefault();
                actionsRef.current?.focus();
              }}
            >
              <BalanceCheck
                card={checking}
                own={own}
                onReload={() => {
                  setChecking(null);
                  onChanged();
                }}
                onCancel={() => setChecking(null)}
              />
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </article>
    </Dialog.Root>
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
    <section className="gc-stack">
      <div className="gc-modal-heading">
        <div>
          <Dialog.Title asChild>
            <h2>Check {card.merchant} balance</h2>
          </Dialog.Title>
          <Dialog.Description className="gc-muted">
            Card ending {card.numberLast4 || "••••"} · Current balance {money(card)}
          </Dialog.Description>
          {card.expires && <p className="gc-muted">Expires {card.expires}</p>}
        </div>
        <Dialog.Close asChild>
          <button className="gc-icon-button" aria-label="Close balance check">
            <X size={20} aria-hidden="true" />
          </button>
        </Dialog.Close>
      </div>
      <ol className="gc-check-steps">
        {(card.hasNumber || card.hasPin) && (
          <li>
            <h4>Copy your card details</h4>
            <CopyCardDetails card={card} />
          </li>
        )}
        <li>
          <h4>Check with {retailer?.name ?? card.merchant}</h4>
          <p className="gc-muted">
            {retailer?.instructions ??
              "Check the retailer’s website, call the number on the card, or ask in store."}
          </p>
          {retailer && (
            <a className="gc-button" href={retailer.url} target="_blank" rel="noopener noreferrer">
              Open {retailer.name} balance help
            </a>
          )}
        </li>
        <li>
          <h4>{own ? "Save the balance you found" : "Share the balance with the owner"}</h4>
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
              <Field label="Confirmed balance">
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
                Only the owner can save a confirmed balance. You can still check it with the
                retailer.
              </p>
              <button className="gc-button" onClick={onCancel}>
                Close
              </button>
            </>
          )}
        </li>
      </ol>
    </section>
  );
}

function CopyCardDetails({ card }: { card: GiftCard }) {
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState<"number" | "pin" | null>(null);
  async function copy(field: "number" | "pin") {
    setBusy(true);
    setStatus("");
    setCopied(null);
    try {
      await navigator.clipboard.write([
        new ClipboardItem({
          "text/plain": revealCard(card.id).then(
            (secrets) => new Blob([secrets[field]], { type: "text/plain" }),
          ),
        }),
      ]);
      setCopied(field);
      setStatus(field === "number" ? "Number copied" : "PIN copied");
    } catch {
      setStatus("Could not copy. Check clipboard permissions and try again.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="gc-codes">
      <button
        type="button"
        className="gc-copy-button"
        disabled={busy || !card.hasNumber}
        aria-label={copied === "number" ? "Number copied" : "Copy number"}
        title={card.hasNumber ? "Copy number" : "No card number saved"}
        onClick={() => void copy("number")}
      >
        {copied === "number" ? (
          <Check size={15} aria-hidden="true" />
        ) : (
          <Copy size={15} aria-hidden="true" />
        )}
        <span className="gc-copy-label">
          {copied === "number" ? "Copied number" : "Copy number"}
        </span>
        <span className="gc-copy-short" aria-hidden="true">
          {copied === "number" ? "✓" : "Number"}
        </span>
      </button>
      <button
        type="button"
        className="gc-copy-button"
        disabled={busy || !card.hasPin}
        aria-label={copied === "pin" ? "PIN copied" : "Copy PIN"}
        title={card.hasPin ? "Copy PIN" : "No PIN saved"}
        onClick={() => void copy("pin")}
      >
        {copied === "pin" ? (
          <Check size={15} aria-hidden="true" />
        ) : (
          <Copy size={15} aria-hidden="true" />
        )}
        <span className="gc-copy-label">{copied === "pin" ? "Copied PIN" : "Copy PIN"}</span>
        <span className="gc-copy-short" aria-hidden="true">
          {copied === "pin" ? "✓" : "PIN"}
        </span>
      </button>
      <span
        className={status.startsWith("Could not") ? "gc-error gc-copy-status" : "gc-sr-only"}
        role="status"
      >
        {status}
      </span>
    </div>
  );
}

function Sharing({ ownerId, onClose }: { ownerId: string; onClose: () => void }) {
  const [access, setAccess] = useState<WalletShare[]>([]);
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(true);
  useEffect(() => {
    let live = true;
    void loadShares()
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
  }, [ownerId]);
  async function change(action: () => Promise<unknown>) {
    setBusy(true);
    setError("");
    try {
      await action();
      setAccess(await loadShares());
      setEmail("");
    } catch (e) {
      setError(pbMessage(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="gc-panel gc-wallet-sharing">
      <div className="gc-toolbar">
        <div>
          <Dialog.Title>Share all my cards</Dialog.Title>
          <Dialog.Description className="gc-muted">
            View-only access · current and future cards
          </Dialog.Description>
        </div>
        <button className="gc-icon-button" aria-label="Close sharing" onClick={onClose}>
          <X size={20} aria-hidden="true" />
        </button>
      </div>
      <ul>
        {access.map((item) => (
          <li key={item.id}>
            <span>{item.email}</span>
            <button
              className="gc-link"
              disabled={busy}
              onClick={() => void change(() => pb.collection("giftcard_shares").delete(item.id))}
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
          if (busy) return;
          void change(() =>
            pb
              .collection("giftcard_shares")
              .create({ owner: ownerId, email: email.trim().toLowerCase() }),
          );
        }}
      >
        <Field label="Email address">
          <Input
            type="email"
            disabled={busy}
            required
            maxLength={254}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="family@example.com"
          />
        </Field>
        <button className="gc-button" disabled={busy}>
          Add person
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
