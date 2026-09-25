import { jsonOk } from "@/lib/http";
import { listActivity } from "@/lib/integrations";

export const runtime = "nodejs";

export async function GET() {
  return jsonOk({ events: listActivity(50) });
}
