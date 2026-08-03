import type { AuthSession } from "@one-ops/api-client";

export function authSessionRenderKey(session: AuthSession): string {
  const userId = session.user?.id ?? "anonymous";
  const actorId = session.impersonation?.actor.id ?? "direct";
  return `${userId}:${actorId}`;
}
