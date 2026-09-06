import { Component, type ErrorInfo, type ReactNode } from "react";

type Props = { children: ReactNode };
type State = { error: Error | null };

/**
 * Catches render and lazy-import failures below a route so a broken page shows
 * a recovery option instead of unmounting the tree and leaving a blank screen.
 *
 * App.tsx keys this on the route name, so navigating elsewhere clears the error
 * rather than leaving the shell stuck.
 */
export class RouteErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error("Route failed to render:", error, info.componentStack);
  }

  render(): ReactNode {
    const { error } = this.state;
    if (error === null) return this.props.children;

    return (
      <main className="grid min-h-screen place-items-center bg-violet-700 p-6 text-white">
        <div className="max-w-md text-center">
          <h1 className="text-3xl font-bold">This page didn’t load</h1>
          <p className="mt-3 text-white/85">
            Reloading usually fixes it. If it keeps happening, the page may be
            temporarily broken.
          </p>
          <p className="mt-3 break-words text-sm text-white/70">
            {error.message}
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button
              className="rounded-lg bg-white px-4 py-2 font-semibold text-violet-700 hover:bg-white/90"
              type="button"
              onClick={() => {
                window.location.reload();
              }}
            >
              Reload
            </button>
            <a
              className="rounded-lg border border-white/40 px-4 py-2 font-semibold text-white hover:bg-white/10"
              href="/"
            >
              Return home
            </a>
          </div>
        </div>
      </main>
    );
  }
}
