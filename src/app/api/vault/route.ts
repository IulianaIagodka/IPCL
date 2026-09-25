import { getVaultStats, wipeAllContext } from "@/lib/vault";
import { withAuth } from "@/lib/http";

export const runtime = "nodejs";

export async function GET(request: Request) {
  return withAuth(request, async () => getVaultStats());
}

export async function DELETE(request: Request) {
  return withAuth(request, async () => {
    wipeAllContext();
    return { ok: true };
  });
}
