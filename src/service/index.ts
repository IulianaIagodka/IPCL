/**
 * Public Context Service surface (ADR-004).
 * Prefer importing from `@/service` in API routes and MCP over deep `@/lib/*`
 * when adding new call sites.
 */
export * from "./context-service";
