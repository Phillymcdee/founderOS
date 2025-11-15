import { z } from 'zod';

const BusinessIntentSchema = z.object({
  targetMrr: z.number(),
  acceptableChurnRate: z.number(),
  alertThresholds: z.object({
    churnRate: z.number(),
    runwayMonths: z.number().nullable()
  }),
  summaryPreferences: z.object({
    tone: z.enum(['concise', 'narrative']),
    maxActions: z.number().min(1).max(10)
  })
});

export type BusinessIntent = z.infer<typeof BusinessIntentSchema>;

// In v0 we keep these configs in code. Later they can move to L0.
const DEFAULT_BUSINESS_INTENT: BusinessIntent = {
  targetMrr: 20000,
  acceptableChurnRate: 0.05,
  alertThresholds: {
    churnRate: 0.08,
    runwayMonths: 6
  },
  summaryPreferences: {
    tone: 'concise',
    maxActions: 4
  }
};

export async function getBusinessIntent(
  _tenantId: string
): Promise<BusinessIntent> {
  return DEFAULT_BUSINESS_INTENT;
}


