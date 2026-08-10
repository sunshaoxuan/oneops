export function createDashboardRefreshLifecycle({
  refreshSnapshot,
  synchronizeOrganizationSources,
  hasActiveDashboardClients,
  refreshIntervalMs,
  organizationSourceSyncIntervalMs,
  scheduleInterval = setInterval,
  cancelInterval = clearInterval,
  onError = async () => {},
}) {
  let started = false;
  let dashboardRefreshTimer = null;
  let organizationSourceSyncTimer = null;

  async function execute(taskName, task) {
    try {
      return await task();
    } catch (error) {
      try {
        await onError(taskName, error);
      } catch {}
      return null;
    }
  }

  function refreshForActiveClients() {
    if (!hasActiveDashboardClients()) {
      return Promise.resolve(null);
    }
    return refreshOnDemand();
  }

  function refreshOnDemand(taskName = "dashboard-refresh") {
    return execute(taskName, refreshSnapshot);
  }

  function synchronizeSources() {
    return execute(
      "organization-source-sync",
      synchronizeOrganizationSources,
    );
  }

  async function start() {
    if (started) {
      return;
    }
    started = true;
    await refreshOnDemand("initial-dashboard-refresh");
    dashboardRefreshTimer = scheduleInterval(
      refreshForActiveClients,
      refreshIntervalMs,
    );
    dashboardRefreshTimer?.unref?.();
    organizationSourceSyncTimer = scheduleInterval(
      synchronizeSources,
      organizationSourceSyncIntervalMs,
    );
    organizationSourceSyncTimer?.unref?.();
  }

  function stop() {
    if (dashboardRefreshTimer) {
      cancelInterval(dashboardRefreshTimer);
      dashboardRefreshTimer = null;
    }
    if (organizationSourceSyncTimer) {
      cancelInterval(organizationSourceSyncTimer);
      organizationSourceSyncTimer = null;
    }
    started = false;
  }

  return {
    refreshForActiveClients,
    refreshOnDemand,
    start,
    stop,
    synchronizeSources,
  };
}
