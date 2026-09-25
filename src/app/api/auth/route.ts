import {
  clearSessionCookieHeader,
  countUsers,
  createUser,
  deleteAccount,
  getUserById,
  loginUser,
  revokeSession,
  sessionCookieHeader,
  getSessionTokenFromRequest,
  resolveSessionToken,
} from "@/lib/auth";
import { jsonError, jsonOk, readJson, withAuth } from "@/lib/http";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const setupRequired = countUsers() === 0;
  if (setupRequired) {
    return jsonOk({ authenticated: false, setupRequired: true, user: null });
  }

  const token = getSessionTokenFromRequest(request);
  const principal = resolveSessionToken(token);
  if (!principal || principal.kind !== "user") {
    return jsonOk({ authenticated: false, setupRequired: false, user: null });
  }

  return jsonOk({
    authenticated: true,
    setupRequired: false,
    user: getUserById(principal.userId),
  });
}

export async function POST(request: Request) {
  try {
    const body = await readJson<{
      action?: "setup" | "login" | "logout" | "delete_account";
      email?: string;
      password?: string;
      displayName?: string;
    }>(request);

    if (body.action === "logout") {
      const token = getSessionTokenFromRequest(request);
      if (token) revokeSession(token);
      const res = jsonOk({ ok: true });
      res.headers.set("Set-Cookie", clearSessionCookieHeader());
      return res;
    }

    if (body.action === "setup") {
      const { user, sessionToken } = createUser({
        email: body.email || "",
        password: body.password || "",
        displayName: body.displayName,
      });
      const res = jsonOk({ user, setupRequired: false });
      res.headers.set("Set-Cookie", sessionCookieHeader(sessionToken));
      return res;
    }

    if (body.action === "login") {
      const { user, sessionToken } = loginUser({
        email: body.email || "",
        password: body.password || "",
      });
      const res = jsonOk({ user });
      res.headers.set("Set-Cookie", sessionCookieHeader(sessionToken));
      return res;
    }

    if (body.action === "delete_account") {
      return withAuth(request, async (principal) => {
        if (principal.kind !== "user") throw new Error("User session required");
        deleteAccount(principal.userId);
        const res = jsonOk({ ok: true });
        res.headers.set("Set-Cookie", clearSessionCookieHeader());
        return res;
      });
    }

    return jsonError("Unknown action");
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Auth failed", 400);
  }
}
