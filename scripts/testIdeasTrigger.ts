import 'dotenv/config';
import { Client } from '@upstash/qstash';

async function main() {
  const token = process.env.QSTASH_TOKEN;

  if (!token) {
    throw new Error('QSTASH_TOKEN is required to publish a test message.');
  }

  const destination =
    process.env.IDEAS_DISCOVER_ENDPOINT ??
    buildDefaultDestination(process.env.APP_BASE_URL);

  if (!destination) {
    throw new Error(
      'Set IDEAS_DISCOVER_ENDPOINT or APP_BASE_URL to build the destination URL.'
    );
  }

  const client = new Client({
    token,
    baseUrl: process.env.QSTASH_URL
  });

  const response = await client.publishJSON({
    url: destination,
    body: {
      trigger: 'manual-test',
      timestamp: new Date().toISOString()
    }
  });

  console.log(
    `Triggered manual publish to ${destination} (messageId: ${response.messageId ?? 'unknown'})`
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


