import { prisma } from '@/l0/db';
import { logEvent } from '@/l0/events';
import {
  DEFAULT_IDEA_SOURCES,
  IdeaSourceConfig
} from '@/l3/ideasIntent';
import { runApifyActor } from '@/lib/apify';

type SignalSeed = {
  sourceId: string;
  sourceLabel: string;
  content: string;
};

type RunSignalIngestionParams = {
  tenantId: string;
  seeds?: SignalSeed[];
  sources?: IdeaSourceConfig;
  feedlyAccessToken?: string;
  apifyToken?: string;
};

export async function runSignalIngestionAgent({
  tenantId,
  seeds,
  sources = DEFAULT_IDEA_SOURCES,
  feedlyAccessToken = process.env.FEEDLY_ACCESS_TOKEN,
  apifyToken = process.env.APIFY_TOKEN
}: RunSignalIngestionParams) {
  const seedsToPersist =
    seeds ??
    (await gatherExternalSignals({
      sources,
      feedlyAccessToken,
      apifyToken
    }));

  if (!seedsToPersist.length) {
    return [];
  }

  const createdIds: string[] = [];

  for (const seed of seedsToPersist) {
    const exists = await prisma.ideaSignal.findFirst({
      where: {
        tenantId,
        content: seed.content
      }
    });

    if (exists) continue;

    const signal = await prisma.ideaSignal.create({
      data: {
        tenantId,
        source: seed.sourceLabel,
        content: seed.content
      }
    });
    createdIds.push(signal.id);

    await logEvent({
      tenantId,
      type: 'IDEA_SIGNAL_INGESTED',
      primaryEntityId: signal.id,
      payload: {
        sourceId: seed.sourceId,
        sourceLabel: seed.sourceLabel
      }
    });
  }

  return prisma.ideaSignal.findMany({
    where: { id: { in: createdIds } }
  });
}

async function gatherExternalSignals(params: {
  sources: IdeaSourceConfig;
  feedlyAccessToken?: string;
  apifyToken?: string;
}): Promise<SignalSeed[]> {
  const { sources, feedlyAccessToken, apifyToken } = params;
  const [feedlySignals, apifySignals] = await Promise.all([
    collectFeedlySignals(sources.feedlySources, feedlyAccessToken),
    collectApifySignals(sources.apifySources, apifyToken)
  ]);

  return [...feedlySignals, ...apifySignals];
}

async function collectFeedlySignals(
  configs: IdeaSourceConfig['feedlySources'],
  token?: string
): Promise<SignalSeed[]> {
  if (!configs.length || !token) {
    return [];
  }

  const results: SignalSeed[] = [];

  for (const config of configs) {
    const url = new URL(
      config.streamId
        ? 'https://cloud.feedly.com/v3/streams/contents'
        : 'https://cloud.feedly.com/v3/search/contents'
    );

    if (config.streamId) {
      url.searchParams.set('streamId', config.streamId);
    }

    if (config.query) {
      url.searchParams.set('q', config.query);
    }

    url.searchParams.set('count', String(config.maxEntries ?? 20));

    const response = await safeFetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!response?.ok) continue;

    const data = await response.json().catch(() => null);
    if (!data) continue;

    const items: any[] =
      data.items ??
      data.results ??
      [];

    for (const entry of items.slice(0, config.maxEntries ?? 20)) {
      const title: string = entry.title ?? 'Untitled signal';
      const summary =
        entry.summary?.content ??
        entry.summary ??
        entry.content?.content ??
        entry.content ??
        '';
      const origin = entry.origin?.title ?? entry.website ?? '';
      const content = [
        `Feedly – ${config.label}`,
        title,
        origin ? `Source: ${origin}` : undefined,
        cleanText(summary).slice(0, 400)
      ]
        .filter(Boolean)
        .join('\n');

      results.push({
        sourceId: `${config.id}:${entry.id ?? entry.originId ?? entry.alternate?.[0]?.href ?? title}`,
        sourceLabel: `Feedly – ${config.label}`,
        content
      });
    }
  }

  return dedupeSeeds(results);
}

async function collectApifySignals(
  configs: IdeaSourceConfig['apifySources'],
  token?: string
): Promise<SignalSeed[]> {
  if (!configs.length || !token) {
    return [];
  }

  const results: SignalSeed[] = [];

  for (const config of configs) {
    const items = await runApifyActor<Record<string, unknown>>(config.actorId, {
      token,
      input: config.input,
      waitSeconds: 180
    }).catch(() => []);

    if (!items?.length) continue;

    const totalItems = items.length;
    const highlights = items
      .slice(0, config.maxItems ?? 10)
      .map((item) => {
        if (config.summaryField && item[config.summaryField]) {
          return cleanText(String(item[config.summaryField]));
        }
        if (item.title) {
          return cleanText(String(item.title));
        }
        if (item.description) {
          return cleanText(String(item.description));
        }
        return cleanText(JSON.stringify(item)).slice(0, 160);
      })
      .filter(Boolean)
      .map((text, index) => `${index + 1}. ${text.slice(0, 200)}`);

    const content = [
      `Apify – ${config.label}`,
      `Found ${totalItems} new items.`,
      'Highlights:',
      ...highlights
    ].join('\n');

    results.push({
      sourceId: `${config.id}:${Date.now()}`,
      sourceLabel: `Apify – ${config.label}`,
      content
    });
  }

  return results;
}

function cleanText(value: string): string {
  return value
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function dedupeSeeds(seeds: SignalSeed[]): SignalSeed[] {
  const seen = new Set<string>();
  const output: SignalSeed[] = [];

  for (const seed of seeds) {
    const key = `${seed.sourceId}:${seed.content}`;
    if (seen.has(key)) continue;
    seen.add(key);
    output.push(seed);
  }

  return output;
}

async function safeFetch(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response | null> {
  try {
    return await fetch(input, init);
  } catch (error) {
    console.warn('Signal ingestion fetch failed', error);
    return null;
  }
}
