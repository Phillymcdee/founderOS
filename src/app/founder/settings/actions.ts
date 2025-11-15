'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/l0/db';
import {
  DEFAULT_BUSINESS_INTENT
} from '@/l3/businessIntent';
import { DEFAULT_IDEA_FILTERS } from '@/l3/ideasIntent';

const DEMO_TENANT_ID = 'demo-tenant';

export async function updateBusinessIntentAction(formData: FormData) {
  const targetMrr =
    Number(formData.get('targetMrr')) || DEFAULT_BUSINESS_INTENT.targetMrr;
  const acceptableChurnRate =
    Number(formData.get('acceptableChurnRate')) ||
    DEFAULT_BUSINESS_INTENT.acceptableChurnRate;
  const alertChurnRate =
    Number(formData.get('alertChurnRate')) ||
    DEFAULT_BUSINESS_INTENT.alertThresholds.churnRate;
  const alertRunwayInput = formData.get('alertRunwayMonths');
  const alertRunwayMonths =
    alertRunwayInput === null || alertRunwayInput === ''
      ? null
      : Number(alertRunwayInput) || null;
  const summaryTone =
    (formData.get('summaryTone') as 'concise' | 'narrative') ??
    DEFAULT_BUSINESS_INTENT.summaryPreferences.tone;
  const summaryMaxActions =
    Number(formData.get('summaryMaxActions')) ||
    DEFAULT_BUSINESS_INTENT.summaryPreferences.maxActions;

  await prisma.businessIntentConfig.upsert({
    where: { tenantId: DEMO_TENANT_ID },
    update: {
      targetMrr,
      acceptableChurnRate,
      alertChurnRate,
      alertRunwayMonths,
      summaryTone,
      summaryMaxActions
    },
    create: {
      tenantId: DEMO_TENANT_ID,
      targetMrr,
      acceptableChurnRate,
      alertChurnRate,
      alertRunwayMonths,
      summaryTone,
      summaryMaxActions
    }
  });

  revalidatePath('/founder/business');
  revalidatePath('/founder/settings');
}

function parseListInput(value: FormDataEntryValue | null, fallback: string[]) {
  if (typeof value !== 'string') {
    return fallback;
  }
  const cleaned = value
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
  return cleaned.length ? cleaned : fallback;
}

export async function updateIdeaIntentAction(formData: FormData) {
  const arpuFloor =
    Number(formData.get('arpuFloor')) || DEFAULT_IDEA_FILTERS.arpuFloor;
  const excludedDomains = parseListInput(
    formData.get('excludedDomains'),
    DEFAULT_IDEA_FILTERS.excludedDomains
  );
  const founderStrengths = parseListInput(
    formData.get('founderStrengths'),
    DEFAULT_IDEA_FILTERS.founderStrengths
  );
  const agentFitKeywords = parseListInput(
    formData.get('agentFitKeywords'),
    DEFAULT_IDEA_FILTERS.agentFitKeywords
  );
  const minScoreForExperiment =
    Number(formData.get('minScoreForExperiment')) ||
    DEFAULT_IDEA_FILTERS.minScoreForExperiment;

  await prisma.ideaIntentConfig.upsert({
    where: { tenantId: DEMO_TENANT_ID },
    update: {
      arpuFloor,
      excludedDomains,
      founderStrengths,
      agentFitKeywords,
      minScoreForExperiment
    },
    create: {
      tenantId: DEMO_TENANT_ID,
      arpuFloor,
      excludedDomains,
      founderStrengths,
      agentFitKeywords,
      minScoreForExperiment
    }
  });

  revalidatePath('/founder/ideas');
  revalidatePath('/founder/settings');
}

