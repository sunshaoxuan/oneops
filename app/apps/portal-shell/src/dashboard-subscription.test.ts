import { afterEach, describe, expect, it, vi } from "vitest";
import type { WorkCenterSnapshot } from "@one-ops/api-client";
import { subscribeDashboard } from "@one-ops/api-client";

class TestEventSource {
  static latest: TestEventSource | null = null;

  onopen: ((event: Event) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  readonly close = vi.fn();
  private readonly listeners = new Map<
    string,
    Array<(event: MessageEvent<string>) => void>
  >();

  constructor(readonly url: string) {
    TestEventSource.latest = this;
  }

  addEventListener(
    type: string,
    listener: (event: MessageEvent<string>) => void,
  ) {
    const current = this.listeners.get(type) ?? [];
    current.push(listener);
    this.listeners.set(type, current);
  }

  emit(type: string, data: string) {
    for (const listener of this.listeners.get(type) ?? []) {
      listener(new MessageEvent(type, { data }));
    }
  }
}

const originalEventSource = globalThis.EventSource;

afterEach(() => {
  globalThis.EventSource = originalEventSource;
  TestEventSource.latest = null;
});

describe("Dashboard SSE 購読", () => {
  it("接続成立では有効扱いせず、Snapshot 受信後だけ有効状態にする", () => {
    globalThis.EventSource = TestEventSource as unknown as typeof EventSource;
    const snapshots: WorkCenterSnapshot[] = [];
    const states: boolean[] = [];
    const unsubscribe = subscribeDashboard(
      (snapshot) => snapshots.push(snapshot),
      (connected) => states.push(connected),
    );
    const source = TestEventSource.latest;

    expect(source?.url).toBe("/api/work-center/v1/events");
    source?.onopen?.(new Event("open"));
    expect(states).toEqual([]);

    source?.emit(
      "snapshot",
      JSON.stringify({
        generatedAt: "2026-08-10T12:00:00.000Z",
        correlationId: "subscription-test",
        upstream: { online: true, latencyMs: 1, message: "ready" },
        summary: {
          total: 0,
          running: 0,
          failed: 0,
          completed: 0,
          organizations: 0,
        },
        resources: {
          cpuCount: null,
          memoryAvailableBytes: null,
          diskFreeBytes: null,
        },
        tasks: [],
        organizations: [],
      } satisfies WorkCenterSnapshot),
    );
    expect(snapshots).toHaveLength(1);
    expect(states).toEqual([true]);

    source?.onerror?.(new Event("error"));
    expect(states).toEqual([true, false]);

    unsubscribe();
    expect(source?.close).toHaveBeenCalledTimes(1);
  });
});
