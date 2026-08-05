function normalizedName(value) {
  return String(value ?? "")
    .normalize("NFKC")
    .replace(/[\s\u3000]+/g, "")
    .toLocaleLowerCase("ja");
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

export function planOrganizationInquiryMapping(
  organization,
  searchResult,
  customerOptions,
) {
  if (!searchResult || Number(searchResult.actualCount) === 0) {
    return { action: "unmatched", type: "code-not-found" };
  }

  const acceptedNames = new Set(
    [organization.name, organization.shortName]
      .map(normalizedName)
      .filter(Boolean),
  );
  const matchingLabels = unique(
    (searchResult.tickets ?? [])
      .map((ticket) => String(ticket.customer ?? "").trim())
      .filter((label) => acceptedNames.has(normalizedName(label))),
  );
  if (matchingLabels.length !== 1) {
    return {
      action: "conflict",
      type: matchingLabels.length
        ? "multiple-name-matches"
        : "same-code-different-name",
      externalNames: unique(
        (searchResult.tickets ?? [])
          .map((ticket) => String(ticket.customer ?? "").trim()),
      ),
    };
  }

  const customerName = matchingLabels[0];
  const matchingOptions = (customerOptions ?? []).filter(
    (option) => normalizedName(option.label) === normalizedName(customerName),
  );
  const incomingExternalCustomerId = matchingOptions.length === 1
    ? String(matchingOptions[0].value)
    : null;

  const existingCode = String(
    organization.explicitInquiryCustomerCode ?? "",
  ).trim();
  if (existingCode && existingCode !== organization.code) {
    return {
      action: "conflict",
      type: "existing-mapping-differs",
      existingCode,
      incomingCode: organization.code,
      externalNames: [customerName],
    };
  }
  const existingExternalCustomerId = String(
    organization.inquiryExternalCustomerId ?? "",
  ).trim();
  if (
    incomingExternalCustomerId &&
    existingExternalCustomerId &&
    existingExternalCustomerId !== incomingExternalCustomerId
  ) {
    return {
      action: "conflict",
      type: "existing-external-customer-differs",
      existingExternalCustomerId,
      incomingExternalCustomerId,
      externalNames: [customerName],
    };
  }

  return {
    action: "map",
    organizationId: String(organization.id),
    inquiryCustomerCode: String(organization.code),
    inquiryExternalCustomerId: incomingExternalCustomerId,
    externalCustomerIdStatus: matchingOptions.length === 1
      ? "resolved"
      : matchingOptions.length
        ? "duplicate-name"
        : "not-listed",
    inquiryCustomerName: customerName,
  };
}

export function inquiryOrganizationSearchFilters(customerCode) {
  return {
    status: "all",
    customerCode,
    customer: null,
    customerName: null,
    assignee: null,
    assigneeName: null,
    unassignedOnly: false,
    ticketNo: null,
    content: null,
    createdFrom: null,
    createdTo: null,
    requestedReplyFrom: null,
    requestedReplyTo: null,
    updatedFrom: null,
    updatedTo: null,
    subStatus: null,
    category: null,
    classificationResult: null,
    questionerName: null,
  };
}

export function createOrganizationInquirySyncService({
  organizationRepository,
  inquiryRepository,
  sourceClient,
  logger,
}) {
  return {
    async synchronize(source, { apply = true } = {}) {
      const settings = await inquiryRepository.getSourceSettings(
        source.sourceCode,
        { includeCredentials: true },
      );
      if (
        !settings.id ||
        !settings.enabled ||
        !settings.username ||
        !settings.password
      ) {
        const error = new Error("Inquiry source is not ready for synchronization.");
        error.code = "INQUIRY_SOURCE_NOT_READY";
        throw error;
      }

      const [organizations, options] = await Promise.all([
        organizationRepository.listInquirySyncCandidates(),
        sourceClient.options(settings),
      ]);
      const mappings = [];
      const conflicts = [];
      const unmatched = [];
      for (const organization of organizations) {
        const searchResult = await sourceClient.search(
          settings,
          inquiryOrganizationSearchFilters(organization.code),
        );
        const plan = planOrganizationInquiryMapping(
          organization,
          searchResult,
          options.customers,
        );
        if (plan.action === "map") {
          mappings.push(plan);
          continue;
        }
        const issue = {
          organizationId: String(organization.id),
          code: organization.code,
          name: organization.name,
          ...plan,
        };
        if (plan.action === "conflict") conflicts.push(issue);
        else unmatched.push(issue);
      }

      const applied = apply
        ? await organizationRepository.applyInquiryMappings({
          sourceSettingId: settings.id,
          mappings,
        })
        : 0;
      const summary = {
        sourceId: source.id,
        sourceSettingId: settings.id,
        organizationCount: organizations.length,
        externalCustomerCount: options.customers.length,
        plannedMappings: mappings.length,
        plannedWithoutExternalCustomerId: mappings.filter(
          (mapping) => !mapping.inquiryExternalCustomerId,
        ).length,
        mapped: applied,
        dryRun: !apply,
        conflicts,
        unmatched,
      };
      await logger?.("info", "organization inquiry source synchronized", {
        sourceId: source.id,
        organizations: organizations.length,
        externalCustomers: options.customers.length,
        mapped: applied,
        conflicts: conflicts.length,
        unmatched: unmatched.length,
      });
      for (const conflict of conflicts) {
        await logger?.(
          "warn",
          "organization inquiry source conflict requires system message",
          { todo: "SYSTEM_MESSAGE", sourceId: source.id, ...conflict },
        );
      }
      return summary;
    },
  };
}
