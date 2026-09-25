import { getVaultStats, wipeAllContext } from "@/lib/vault";
import { jsonOk } from "@/lib/http";

export const runtime = "nodejs";

export async function GET() {
  return jsonOk(getVaultStats());
}

export async function DELETE() {
  wipeAllContext();
  return jsonOk({ ok: true });
}
