import {
  listCandidateMemories,
  resolveCandidateMemory,
} from "@/lib/vault";
import { readJson, withAuth } from "@/lib/http";

export const runtime = "nodejs";

export async function GET(request: Request) {
  return withAuth(request, async () => listCandidateMemories("pending"));
}

export async function POST(request: Request) {
  return withAuth(request, async () => {
    const body = await readJson<{
      id?: string;
      decision?: "approved" | "rejected";
    }>(request);
    if (!body.id || !body.decision) throw new Error("id and decision required");
    const result = resolveCandidateMemory(body.id, body.decision);
    if (!result) throw new Error("Candidate not found");
    return result;
  });
}
