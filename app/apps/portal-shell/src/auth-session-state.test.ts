import type { AuthSession } from "@one-ops/api-client";
import { describe, expect, it } from "vitest";
import { authSessionRenderKey } from "./auth-session-state";

function session(
  userId: string,
  actorId?: string,
): AuthSession {
  return {
    authenticated: true,
    user: {
      id: userId,
      username: userId,
      displayName: userId,
      email: `${userId}@example.test`,
      locale: "ja-JP",
      compactPageHeadings: false,
    },
    permissions: [],
    impersonation: actorId
      ? {
          actor: {
            id: actorId,
            username: actorId,
            displayName: actorId,
            email: `${actorId}@example.test`,
          },
        }
      : null,
  };
}

describe("代理ログイン画面状態", () => {
  it("利用者と代理実行者が変わるたびに画面再構築キーを変更する", () => {
    const administrator = session("administrator");
    const viewer = session("viewer", "administrator");

    expect(authSessionRenderKey(administrator)).toBe(
      "administrator:direct",
    );
    expect(authSessionRenderKey(viewer)).toBe(
      "viewer:administrator",
    );
    expect(authSessionRenderKey(viewer)).not.toBe(
      authSessionRenderKey(administrator),
    );
  });
});
