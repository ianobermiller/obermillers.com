import type { RecordModel } from "pocketbase";

import type { AuthResult } from "./authClient";
import { pb, pbMessage } from "./pb";

function ok(): AuthResult {
  return { error: null };
}

function fail(error: unknown): AuthResult {
  return { error: { message: pbMessage(error) } };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function passkeyError(data: unknown, fallback: string): Error {
  if (isRecord(data) && typeof data["error"] === "string") {
    return new Error(data["error"]);
  }
  return new Error(fallback);
}

function isCancelled(error: unknown): boolean {
  if (error instanceof DOMException) {
    return error.name === "NotAllowedError" || error.name === "AbortError";
  }
  return error instanceof Error && error.name === "NotAllowedError";
}

function base64urlToBuffer(value: string): ArrayBuffer {
  const base64 = value.replaceAll("-", "+").replaceAll("_", "/");
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

function bufferToBase64url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

function requiredString(record: Record<string, unknown>, key: string): string {
  const value = record[key];
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`Passkey options missing ${key}`);
  }
  return value;
}

function isAuthenticatorTransport(value: unknown): value is AuthenticatorTransport {
  return (
    value === "ble" ||
    value === "hybrid" ||
    value === "internal" ||
    value === "nfc" ||
    value === "usb"
  );
}

function credentialDescriptors(value: unknown): PublicKeyCredentialDescriptor[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.flatMap((item) => {
    if (!isRecord(item) || typeof item["id"] !== "string") {
      return [];
    }
    const transports = Array.isArray(item["transports"])
      ? item["transports"].filter(isAuthenticatorTransport)
      : [];
    const descriptor: PublicKeyCredentialDescriptor = {
      id: base64urlToBuffer(item["id"]),
      type: "public-key",
    };
    if (transports.length > 0) {
      descriptor.transports = transports;
    }
    return [descriptor];
  });
}

function pubKeyCredParams(value: unknown): PublicKeyCredentialParameters[] {
  const fallback: PublicKeyCredentialParameters = { alg: -7, type: "public-key" };
  if (!Array.isArray(value)) {
    return [fallback];
  }
  const params: PublicKeyCredentialParameters[] = [];
  for (const item of value) {
    if (isRecord(item) && item["type"] === "public-key" && typeof item["alg"] === "number") {
      params.push({ alg: item["alg"], type: "public-key" });
    }
  }
  return params.length > 0 ? params : [fallback];
}

function userVerification(value: unknown): UserVerificationRequirement | undefined {
  return value === "required" || value === "preferred" || value === "discouraged"
    ? value
    : undefined;
}

function creationOptions(data: unknown): PublicKeyCredentialCreationOptions {
  const root = isRecord(data) ? data : {};
  const publicKey = isRecord(root["publicKey"]) ? root["publicKey"] : root;
  const user = isRecord(publicKey["user"]) ? publicKey["user"] : {};
  const rp = isRecord(publicKey["rp"]) ? publicKey["rp"] : {};
  const excludeCredentials = credentialDescriptors(publicKey["excludeCredentials"]);
  const attestation =
    publicKey["attestation"] === "none" ||
    publicKey["attestation"] === "indirect" ||
    publicKey["attestation"] === "direct" ||
    publicKey["attestation"] === "enterprise"
      ? publicKey["attestation"]
      : undefined;
  const selection = isRecord(publicKey["authenticatorSelection"])
    ? publicKey["authenticatorSelection"]
    : undefined;
  const authenticatorSelection: AuthenticatorSelectionCriteria | undefined = (() => {
    if (!selection) {
      return undefined;
    }
    const criteria: AuthenticatorSelectionCriteria = {};
    const residentKey = selection["residentKey"];
    if (
      residentKey === "discouraged" ||
      residentKey === "preferred" ||
      residentKey === "required"
    ) {
      criteria.residentKey = residentKey;
    }
    if (typeof selection["requireResidentKey"] === "boolean") {
      criteria.requireResidentKey = selection["requireResidentKey"];
    }
    const verification = userVerification(selection["userVerification"]);
    if (verification) {
      criteria.userVerification = verification;
    }
    return criteria;
  })();

  return {
    challenge: base64urlToBuffer(requiredString(publicKey, "challenge")),
    pubKeyCredParams: pubKeyCredParams(publicKey["pubKeyCredParams"]),
    rp: {
      name: typeof rp["name"] === "string" ? rp["name"] : "Obermiller",
      ...(typeof rp["id"] === "string" ? { id: rp["id"] } : {}),
    },
    user: {
      displayName:
        typeof user["displayName"] === "string"
          ? user["displayName"]
          : requiredString(user, "name"),
      id: base64urlToBuffer(requiredString(user, "id")),
      name: requiredString(user, "name"),
    },
    ...(typeof publicKey["timeout"] === "number" ? { timeout: publicKey["timeout"] } : {}),
    ...(attestation ? { attestation } : {}),
    ...(authenticatorSelection ? { authenticatorSelection } : {}),
    ...(excludeCredentials.length > 0 ? { excludeCredentials } : {}),
  };
}

function requestOptions(data: unknown): PublicKeyCredentialRequestOptions {
  const root = isRecord(data) ? data : {};
  const publicKey = isRecord(root["publicKey"]) ? root["publicKey"] : root;
  const allowCredentials = credentialDescriptors(publicKey["allowCredentials"]);
  const verification = userVerification(publicKey["userVerification"]);

  return {
    challenge: base64urlToBuffer(requiredString(publicKey, "challenge")),
    ...(typeof publicKey["rpId"] === "string" ? { rpId: publicKey["rpId"] } : {}),
    ...(typeof publicKey["timeout"] === "number" ? { timeout: publicKey["timeout"] } : {}),
    ...(verification ? { userVerification: verification } : {}),
    ...(allowCredentials.length > 0 ? { allowCredentials } : {}),
  };
}

async function postPasskey(path: string, body: unknown, authed: boolean): Promise<unknown> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (authed) {
    const token = pb.authStore.token;
    if (!token) {
      throw new Error("Not authenticated");
    }
    headers["Authorization"] = token;
  }
  const response = await fetch(`${pb.baseUrl}${path}`, {
    body: JSON.stringify(body),
    headers,
    method: "POST",
  });
  const data: unknown = await response.json().catch(() => undefined);
  if (!response.ok) {
    throw passkeyError(data, `Passkey request failed (${response.status})`);
  }
  return data;
}

function credentialJSON(credential: PublicKeyCredential): Record<string, unknown> {
  const response = credential.response;
  const base: Record<string, unknown> = {
    id: credential.id,
    rawId: bufferToBase64url(credential.rawId),
    type: credential.type,
  };
  if (response instanceof AuthenticatorAttestationResponse) {
    base["response"] = {
      attestationObject: bufferToBase64url(response.attestationObject),
      clientDataJSON: bufferToBase64url(response.clientDataJSON),
      ...(typeof response.getTransports === "function"
        ? { transports: response.getTransports() }
        : {}),
    };
  } else if (response instanceof AuthenticatorAssertionResponse) {
    base["response"] = {
      authenticatorData: bufferToBase64url(response.authenticatorData),
      clientDataJSON: bufferToBase64url(response.clientDataJSON),
      signature: bufferToBase64url(response.signature),
      userHandle: response.userHandle ? bufferToBase64url(response.userHandle) : null,
    };
  }
  return base;
}

function saveAuth(data: unknown): void {
  if (!isRecord(data) || typeof data["token"] !== "string" || !isRecord(data["record"])) {
    throw new Error("No token received");
  }
  pb.authStore.save(data["token"], data["record"] as RecordModel);
}

export function isPasskeySupported(): boolean {
  return typeof window !== "undefined" && typeof window.PublicKeyCredential === "function";
}

export async function registerPasskey(): Promise<AuthResult> {
  const userId = pb.authStore.record?.id;
  if (!userId) {
    return fail(new Error("Not authenticated"));
  }
  try {
    const options = await postPasskey("/api/passkey/register/begin", { userId }, true);
    const credential = await navigator.credentials.create({ publicKey: creationOptions(options) });
    if (!(credential instanceof PublicKeyCredential)) {
      throw new Error("Passkey was cancelled");
    }
    await postPasskey("/api/passkey/register/finish", credentialJSON(credential), true);
    return ok();
  } catch (error) {
    if (isCancelled(error)) {
      return fail(new Error("Passkey was cancelled"));
    }
    return fail(error);
  }
}

export async function signInWithPasskey(email = ""): Promise<AuthResult> {
  try {
    const beginBody = email === "" ? {} : { email };
    const options = await postPasskey("/api/passkey/login/begin", beginBody, false);
    const assertion = await navigator.credentials.get({ publicKey: requestOptions(options) });
    if (!(assertion instanceof PublicKeyCredential)) {
      throw new Error("Passkey was cancelled");
    }
    const finishBody = {
      ...credentialJSON(assertion),
      ...(email === "" ? {} : { email }),
    };
    saveAuth(await postPasskey("/api/passkey/login/finish", finishBody, false));
    return ok();
  } catch (error) {
    if (isCancelled(error)) {
      return fail(new Error("Passkey was cancelled"));
    }
    return fail(error);
  }
}

export async function setPassword(
  password: string,
  passwordConfirm = password,
): Promise<AuthResult> {
  try {
    const token = pb.authStore.token;
    if (!token) {
      throw new Error("Not authenticated");
    }
    const response = await fetch(`${pb.baseUrl}/api/account/password`, {
      body: JSON.stringify({ password, passwordConfirm }),
      headers: {
        Authorization: token,
        "Content-Type": "application/json",
      },
      method: "POST",
    });
    const data: unknown = await response.json().catch(() => undefined);
    if (!response.ok) {
      throw passkeyError(data, `Could not save password (${response.status})`);
    }
    saveAuth(data);
    return ok();
  } catch (error) {
    return fail(error);
  }
}
