import assert from "node:assert/strict";
import test from "node:test";
import { createDashboardRefreshLifecycle } from "./dashboard-refresh-lifecycle.mjs";

function createFakeIntervals() {
  const timers = [];
  return {
    timers,
    scheduleInterval(callback, intervalMs) {
      const timer = {
        callback,
        intervalMs,
        cleared: false,
        unrefCount: 0,
        unref() {
          this.unrefCount += 1;
        },
      };
      timers.push(timer);
      return timer;
    },
    cancelInterval(timer) {
      timer.cleared = true;
    },
  };
}

function createFixture() {
  const intervals = createFakeIntervals();
  const state = {
    activeClients: 0,
    dashboardRefreshes: 0,
    organizationSynchronizations: 0,
  };
  const lifecycle = createDashboardRefreshLifecycle({
    refreshSnapshot: async () => {
      state.dashboardRefreshes += 1;
      return { generatedAt: state.dashboardRefreshes };
    },
    synchronizeOrganizationSources: async () => {
      state.organizationSynchronizations += 1;
    },
    hasActiveDashboardClients: () => state.activeClients > 0,
    refreshIntervalMs: 2_000,
    organizationSourceSyncIntervalMs: 600_000,
    scheduleInterval: intervals.scheduleInterval,
    cancelInterval: intervals.cancelInterval,
  });
  return { intervals, lifecycle, state };
}

test("起動時の Snapshot 更新は一度だけ実行する", async () => {
  const { intervals, lifecycle, state } = createFixture();

  await lifecycle.start();
  await lifecycle.start();

  assert.equal(state.dashboardRefreshes, 1);
  assert.deepEqual(
    intervals.timers.map(({ intervalMs }) => intervalMs),
    [2_000, 600_000],
  );
  assert.deepEqual(
    intervals.timers.map(({ unrefCount }) => unrefCount),
    [1, 1],
  );
});

test("Dashboard の周期更新は有効な SSE クライアントがある間だけ実行する", async () => {
  const { intervals, lifecycle, state } = createFixture();
  await lifecycle.start();
  const dashboardTimer = intervals.timers[0];

  await dashboardTimer.callback();
  assert.equal(state.dashboardRefreshes, 1);

  state.activeClients = 1;
  await dashboardTimer.callback();
  assert.equal(state.dashboardRefreshes, 2);

  state.activeClients = 0;
  await dashboardTimer.callback();
  assert.equal(state.dashboardRefreshes, 2);
});

test("新しい SSE クライアントの登録後に直ちに Snapshot を更新する", async () => {
  const { lifecycle, state } = createFixture();
  await lifecycle.start();

  await lifecycle.refreshForActiveClients();
  assert.equal(state.dashboardRefreshes, 1);

  state.activeClients = 1;
  await lifecycle.refreshForActiveClients();
  assert.equal(state.dashboardRefreshes, 2);
});

test("Dashboard GET 相当の随時更新は SSE クライアントなしでも実行する", async () => {
  const { lifecycle, state } = createFixture();
  await lifecycle.start();

  const snapshot = await lifecycle.refreshOnDemand();

  assert.deepEqual(snapshot, { generatedAt: 2 });
  assert.equal(state.activeClients, 0);
  assert.equal(state.dashboardRefreshes, 2);
});

test("組織ソース同期は Dashboard SSE の接続状態から独立して実行する", async () => {
  const { intervals, lifecycle, state } = createFixture();
  await lifecycle.start();

  await intervals.timers[1].callback();

  assert.equal(state.activeClients, 0);
  assert.equal(state.organizationSynchronizations, 1);
  assert.equal(state.dashboardRefreshes, 1);
});

test("停止時に Dashboard 更新と組織同期の両タイマーを解除する", async () => {
  const { intervals, lifecycle } = createFixture();
  await lifecycle.start();

  lifecycle.stop();

  assert.deepEqual(
    intervals.timers.map(({ cleared }) => cleared),
    [true, true],
  );
});
