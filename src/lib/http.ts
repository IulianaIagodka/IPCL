import { NextResponse } from "next/server";
import {
  getSessionTokenFromRequest,
  resolveSessionToken,
} from "./auth";
import { resolveIntegrationToken } from "./integrations";
import { PolicyDeniedError, type Principal } from "./policy";
import { runWithPrincipalAsync } from "./request-context";
import { createId } from "./id";
import { logError } from "./logger";

export function jsonOk<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function readJson<T>(request: Request): Promise<T> {
  return (await request.json()) as T;
}

export function resolveRequestPrincipal(request: Request): Principal | null {
  const token = getSessionTokenFromRequest(request);
  return resolveSessionToken(token) ?? resolveIntegrationToken(token);
}

export async function withAuth<T>(
  request: Request,
  handler: (principal: Principal) => Promise<T> | T,
  options?: { allowIntegration?: boolean }
): Promise<Response> {
  const requestId = createId("req");
  try {
    const principal = resolveRequestPrincipal(request);
    if (!principal) {
      return jsonError("Authentication required", 401);
    }
    if (principal.kind === "integration" && options?.allowIntegration === false) {
      return jsonError("User session required", 403);
    }
    const result = await runWithPrincipalAsync(principal, async () =>
      handler(principal)
    );
    if (result instanceof Response) return result;
    return jsonOk(result);
  } catch (error) {
    if (error instanceof PolicyDeniedError) {
      return jsonError(error.message, 403);
    }
    logError("request_failed", {
      requestId,
      category: error instanceof Error ? error.name : "Error",
    });
    return jsonError(
      error instanceof Error ? error.message : "Request failed",
      400
    );
  }
}

export function withHeaders(response: Response, headers: Record<string, string>) {
  const next = new NextResponse(response.body, response);
  for (const [k, v] of Object.entries(headers)) next.headers.set(k, v);
  return next;
}
