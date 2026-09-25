import {
  getControlPlaneStatus,
  buildMcpClientConfig,
} from "@/service";
import {
  jsonError,
  jsonOk,
  readJson,
  resolveRequestPrincipal,
  withAuth,
} from "@/lib/http";

export const runtime = "nodejs";

/** ADR-004 control-plane status for Home + onboarding. */
export async function GET(request: Request) {
  const principal = resolveRequestPrincipal(request);
  return jsonOk(getControlPlaneStatus(principal));
}

/** Generate MCP client config JSON after an integration token is issued. */
export async function POST(request: Request) {
  return withAuth(
    request,
    async () => {
      const body = await readJson<{
        action?: "mcp_config";
        token?: string;
        cwd?: string;
      }>(request);

      if (body.action !== "mcp_config") {
        return jsonError("Unknown action");
      }
      if (!body.token?.trim()) {
        return jsonError("Integration token is required");
      }

      const cwd = body.cwd?.trim() || process.cwd();
      return buildMcpClientConfig({ token: body.token.trim(), cwd });
    },
    { allowIntegration: false }
  );
}
