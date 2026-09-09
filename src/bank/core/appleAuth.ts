import { signInWithSocial } from "./authClient";

const APPLE_SERVICES_ID = import.meta.env.VITE_APPLE_SERVICES_ID;

const APPLE_SCRIPT_SRC =
  "https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js";

interface AppleSignInResponse {
  authorization: {
    id_token: string;
  };
}

declare global {
  interface Window {
    AppleID?: {
      auth: {
        init: (config: { clientId: string; redirectURI: string; scope: string }) => void;
        signIn: (config: { nonce: string; usePopup: boolean }) => Promise<AppleSignInResponse>;
      };
    };
  }
}

let scriptPromise: null | Promise<void> = null;

export function isAppleAuthConfigured() {
  return Boolean(APPLE_SERVICES_ID);
}

export async function signInWithApple() {
  const appleAuth = await ensureAppleAuthReady();
  const nonce = crypto.randomUUID();
  const resp = await appleAuth.signIn({
    nonce,
    usePopup: true,
  });
  const result = await signInWithSocial({
    idToken: {
      nonce,
      token: resp.authorization.id_token,
    },
    provider: "apple",
  });
  if (result.error) {
    throw new Error(result.error.message);
  }
}

async function ensureAppleAuthReady() {
  if (!APPLE_SERVICES_ID) {
    throw new Error("Missing VITE_APPLE_SERVICES_ID. Add your Apple Services ID to .env.");
  }
  await loadAppleScript();
  const appleId = window.AppleID;
  if (!appleId) {
    throw new Error("Apple Sign In script failed to load.");
  }
  appleId.auth.init({
    clientId: APPLE_SERVICES_ID,
    redirectURI: new URL("/bank", window.location.origin).href,
    scope: "name email",
  });
  return appleId.auth;
}

function loadAppleScript() {
  if (window.AppleID) {
    return Promise.resolve();
  }
  if (scriptPromise) {
    return scriptPromise;
  }

  const { promise, reject, resolve } = Promise.withResolvers<void>();
  scriptPromise = promise;

  const existing = document.querySelector<HTMLScriptElement>(`script[src="${APPLE_SCRIPT_SRC}"]`);
  if (existing) {
    existing.addEventListener("load", () => resolve());
    existing.addEventListener("error", () =>
      reject(new Error("Apple Sign In script failed to load.")),
    );
    return promise;
  }

  const script = document.createElement("script");
  script.src = APPLE_SCRIPT_SRC;
  script.async = true;
  script.onload = () => resolve();
  script.onerror = () => {
    scriptPromise = null;
    reject(new Error("Apple Sign In script failed to load."));
  };
  document.head.appendChild(script);
  return promise;
}
