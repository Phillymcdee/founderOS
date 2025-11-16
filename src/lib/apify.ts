const DEFAULT_APIFY_API_URL =
  process.env.APIFY_API_URL ?? 'https://api.apify.com';

type RunApifyActorOptions = {
  token?: string;
  input?: Record<string, unknown>;
  waitSeconds?: number;
};

type ApifyRunResponse = {
  data?: {
    defaultDatasetId?: string;
  };
};

/**
 * Runs an Apify actor and returns the dataset items from the default dataset.
 */
export async function runApifyActor<T = Record<string, unknown>>(
  actorId: string,
  options: RunApifyActorOptions = {}
): Promise<T[]> {
  const token = options.token ?? process.env.APIFY_TOKEN;

  if (!token) {
    throw new Error('APIFY token is required to run actors.');
  }

  const searchParams = new URLSearchParams({
    token,
    waitForFinish: String(options.waitSeconds ?? 120)
  });

  const runResponse = await fetch(
    `${DEFAULT_APIFY_API_URL}/v2/acts/${actorId}/runs?${searchParams.toString()}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: options.input ? JSON.stringify(options.input) : '{}'
    }
  );

  if (!runResponse.ok) {
    const text = await runResponse.text();
    throw new Error(
      `Apify actor run failed (${runResponse.status}): ${text.slice(0, 200)}`
    );
  }

  const runJson = (await runResponse.json().catch(() => ({}))) as ApifyRunResponse;
  const datasetId = runJson.data?.defaultDatasetId;

  if (!datasetId) {
    return [];
  }

  const datasetResponse = await fetch(
    `${DEFAULT_APIFY_API_URL}/v2/datasets/${datasetId}/items?token=${token}&clean=1`
  );

  if (!datasetResponse.ok) {
    const text = await datasetResponse.text();
    throw new Error(
      `Apify dataset fetch failed (${datasetResponse.status}): ${text.slice(0, 200)}`
    );
  }

  const items = (await datasetResponse.json().catch(() => [])) as T[];
  return items ?? [];
}


