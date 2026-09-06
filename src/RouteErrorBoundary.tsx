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
  override state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error("Route failed to render:", error, info.componentStack);
  }

  override render(): ReactNode {
    const { error } = this.state;
    if (error === null) return this.props.children;

    return (
      <main className="grid min-h-screen place-items-center bg-zinc-950 px-5 py-12 font-sans text-zinc-100">
        <div className="w-full max-w-md">
          <p className="text-[11px] font-semibold tracking-[0.28em] text-zinc-500 uppercase">
            Something broke
          </p>
          <h1 className="mt-4 font-serif text-5xl leading-[0.95] tracking-tight">
            This page didn’t load
          </h1>
          <p className="mt-6 text-sm leading-relaxed text-zinc-400">
            Reloading usually fixes it. If it keeps happening, the page may be temporarily broken.
          </p>
          <p className="mt-3 font-mono text-xs leading-relaxed break-words text-zinc-600">
            {error.message}
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-6 border-t border-zinc-800 pt-4 text-sm">
            <button
              className="text-zinc-300 hover:text-white"
              type="button"
              onClick={() => {
                window.location.reload();
              }}
            >
              Reload
            </button>
            <a className="text-zinc-300 no-underline hover:text-white" href="/">
              Return home
            </a>
          </div>
        </div>
      </main>
    );
  }
}
