import { Link } from "@zoontek/chicane";
import { Palette } from "lucide-react";
import { match } from "ts-pattern";

import { Router } from "../router";
import { useAuth, signOut } from "./auth";
import { CalendarList } from "./CalendarList";
import { ButtonLink, LinkButton } from "./components/Button";
import { CAL_ROUTE_NAMES } from "./core/routes";
import { Editor } from "./Editor";
import { Landing } from "./Landing";
import { Login } from "./Login";

export function App() {
  const { user } = useAuth();
  const route = Router.useRoute(CAL_ROUTE_NAMES);

  return (
    <div className="mx-auto max-w-2xl p-3 lg:w-[1024px] lg:max-w-none">
      <header className="mb-3 flex items-center justify-between">
        <h1>
          <Link className="flex items-center gap-1 text-2xl" to={Router.Cal()}>
            <Palette size={24} />
            Color Calendar
          </Link>
        </h1>
        <p>
          {user ? (
            <>
              {user.email}{" "}
              <LinkButton onClick={() => signOut()} type="button">
                Logout
              </LinkButton>
            </>
          ) : (
            <ButtonLink href={Router.CalLogin()}>Login</ButtonLink>
          )}
        </p>
      </header>

      {match(route)
        .with({ name: "Cal" }, () => (user ? <CalendarList /> : <Landing />))
        .with({ name: "CalLogin" }, () => <Login />)
        .with({ name: "CalCalendar" }, ({ params }) => <Editor id={params.id} />)
        .otherwise(() => (
          <Landing />
        ))}
    </div>
  );
}
