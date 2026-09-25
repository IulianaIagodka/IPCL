import { redirect } from "next/navigation";

/** Legacy ADR-003 route — split into Integrations / Activity / Settings. */
export default function SecurityRedirectPage() {
  redirect("/vault/integrations");
}
