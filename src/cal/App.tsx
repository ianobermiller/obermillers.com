import { Link } from "@zoontek/chicane";
import { match } from "ts-pattern";

import { Router } from "../router";
import { ColorSchemeToggle } from "../theme/ColorSchemeToggle";
import { signOut, useAuth } from "./auth";
import { CalendarList } from "./CalendarList";
import { ButtonLink, LinkButton } from "./components/Button";
import { CAL_ROUTE_NAMES } from "./core/routes";
import { Editor } from "./Editor";
import { Landing } from "./Landing";
import { Login } from "./Login";
import { COLORS } from "./utils/colors";

/** Four swatches from the trip palette, which is the whole product in a square. */
function BrandMark() {
  return (
    <span className="grid size-7 shrink-0 grid-cols-2 overflow-hidden rounded-md">
      {[COLORS[0], COLORS[1], COLORS[2], COLORS[5]].map((color) => (
        <span key={color} style={{ background: color }} />
      ))}
    </span>
  );
}

function Topbar() {
  const { user } = useAuth();

  return (
    <header className="border-cc-border bg-cc-surface border-b">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-4 px-5 sm:px-8">
        <Link
          className="flex items-center gap-2.5 text-[17px] font-semibold tracking-tight"
          to={Router.Cal()}
        >
          <BrandMark />
          Color Calendar
        </Link>

        <div className="flex items-center gap-3">
          <ColorSchemeToggle className="border-cc-border text-cc-muted hover:bg-cc-surface-2 hover:text-cc-text size-9 rounded-md border" />

          {user ? (
            <div className="flex items-center gap-3 text-sm">
              <span className="text-cc-muted hidden sm:inline">{user.email}</span>
              <LinkButton onClick={() => signOut()} type="button">
                Log out
              </LinkButton>
            </div>
          ) : (
            <ButtonLink href={Router.CalLogin()} variant="primary">
              Log in
            </ButtonLink>
          )}
        </div>
      </div>
    </header>
  );
}

export function App() {
  const { user } = useAuth();
  const route = Router.useRoute(CAL_ROUTE_NAMES);

  return (
    <>
      <Topbar />

      <main className="mx-auto max-w-5xl px-5 pb-20 sm:px-8">
        {match(route)
          .with({ name: "Cal" }, () => (user ? <CalendarList /> : <Landing />))
          .with({ name: "CalLogin" }, () => <Login />)
          .with({ name: "CalCalendar" }, ({ params }) => <Editor id={params.id} />)
          .otherwise(() => (
            <Landing />
          ))}
      </main>
    </>
  );
}
