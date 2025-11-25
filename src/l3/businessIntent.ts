import { z } from 'zod';
import { prisma } from '@/l0/db';

const BusinessIntentSchema = z.object({
  targetMrr: z.number(),
  acceptableChurnRate: z.number(),
  alertThresholds: z.object({
    churnRate: z.number(),
    runwayMonths: z.number().nullable()
  }),
  resourceConstraints: z.object({
    maxActiveProducts: z.number().min(1).max(10).nullable(),
    weeklyFounderHours: z.number().min(1).max(80).nullable()
  }),
  summaryPreferences: z.object({
    tone: z.enum(['concise', 'narrative']),
    maxActions: z.number().min(1).max(10)
  })
});

export type BusinessIntent = z.infer<typeof BusinessIntentSchema>;

export const DEFAULT_BUSINESS_INTENT: BusinessIntent = {
  targetMrr: 20000,
  acceptableChurnRate: 0.05,
  alertThresholds: {
    churnRate: 0.08,
    runwayMonths: 6
  },
  resourceConstraints: {
    maxActiveProducts: 4,
    weeklyFounderHours: 15
  },
  summaryPreferences: {
    tone: 'concise',
    maxActions: 4
  }
};

export type BusinessIntentResponse = {
  intent: BusinessIntent;
  version: string;
};

export async function getBusinessIntent(
  tenantId: string
): Promise<BusinessIntentResponse> {
  const config = await prisma.businessIntentConfig.findUnique({
    where: { tenantId }
  });

  if (!config) {
    return {
      intent: DEFAULT_BUSINESS_INTENT,
      version: 'default'
    };
  }

  const intent: BusinessIntent = {
    targetMrr: config.targetMrr,
    acceptableChurnRate: config.acceptableChurnRate,
    alertThresholds: {
      churnRate: config.alertChurnRate,
      runwayMonths: config.alertRunwayMonths ?? null
    },
    resourceConstraints: {
      maxActiveProducts:
        config.maxActiveProducts ?? DEFAULT_BUSINESS_INTENT.resourceConstraints.maxActiveProducts,
      weeklyFounderHours:
        config.weeklyFounderHours ?? DEFAULT_BUSINESS_INTENT.resourceConstraints.weeklyFounderHours
    },
    summaryPreferences: {
      tone:
        config.summaryTone === 'narrative' ? 'narrative' : 'concise',
      maxActions: config.summaryMaxActions
    }
  };

  return {
    intent,
    version: config.updatedAt.toISOString()
  };
}


