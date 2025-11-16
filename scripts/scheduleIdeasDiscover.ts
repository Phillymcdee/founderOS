import 'dotenv/config';
import { Client } from '@upstash/qstash';

const DEFAULT_CRON = '0 9 * * 1'; // Monday @ 09:00 UTC
const DEFAULT_SCHEDULE_ID = 'ideas-weekly-discover';

async function main() {
  const token = process.env.QSTASH_TOKEN;

  if (!token) {
    throw new Error('QSTASH_TOKEN environment variable is required.');
  }

  const destination =
    process.env.IDEAS_DISCOVER_ENDPOINT ??
    buildDefaultDestination(process.env.APP_BASE_URL);

  if (!destination) {
    throw new Error(
      'Set IDEAS_DISCOVER_ENDPOINT or APP_BASE_URL to build the destination URL.'
    );
  }

  const scheduleId =
    process.env.IDEAS_DISCOVER_SCHEDULE_ID ?? DEFAULT_SCHEDULE_ID;
  const cron = process.env.IDEAS_DISCOVER_CRON ?? DEFAULT_CRON;

  const client = new Client({
    token,
    baseUrl: process.env.QSTASH_URL
  });

  await client.schedules.create({
    scheduleId,
    destination,
    cron,
    retries: 3,
    retryDelay: 'pow(2, retried) * 1000'
  });

  console.log(
    `Created/updated QStash schedule "${scheduleId}" -> ${destination} (${cron})`
  );
}

function buildDefaultDestination(appBaseUrl?: string) {
  if (!appBaseUrl) return null;

  const normalized = appBaseUrl.endsWith('/')
    ? appBaseUrl.slice(0, -1)
    : appBaseUrl;

  return `${normalized}/api/ideas/discover`;
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});


