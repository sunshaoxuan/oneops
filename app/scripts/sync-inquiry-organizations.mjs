import { createOrganizationRepository } from "../gateway/database.mjs";
import { createInquirySupportRepository } from "../gateway/inquiry-support-database.mjs";
import {
  createOrganizationInquirySyncService,
} from "../gateway/organization-inquiry-sync.mjs";
import { InquirySourceClient } from "../gateway/inquiry-support-source.mjs";
import { loadSystemConfig } from "../gateway/system-config.mjs";

const connectionString = process.env.OPS_DATABASE_URL;
if (!connectionString) {
  throw new Error("OPS_DATABASE_URL is required.");
}

const config = await loadSystemConfig();
const source = config.organizationDirectory.dataSources.find(
  (item) => item.type === "inquiry-site" && item.enabled,
);
if (!source) {
  throw new Error("Enabled inquiry organization source was not found.");
}

const organizationRepository = createOrganizationRepository(connectionString);
const inquiryRepository = createInquirySupportRepository(connectionString);
const messages = [];
const service = createOrganizationInquirySyncService({
  organizationRepository,
  inquiryRepository,
  sourceClient: new InquirySourceClient(),
  logger: async (level, message, details) => {
    messages.push({ level, message, details });
  },
});

try {
  await organizationRepository.migrate();
  const summary = await service.synchronize(source, {
    apply: !process.argv.includes("--dry-run"),
  });
  process.stdout.write(`${JSON.stringify({ summary, messages }, null, 2)}\n`);
} finally {
  await Promise.all([
    organizationRepository.close(),
    inquiryRepository.close(),
  ]);
}
