import { NextResponse } from 'next/server';
import { runWeeklyFounderSummaryFlow } from '@/l2/ops/weeklyFounderSummary';
import { revalidatePath } from 'next/cache';

const DEMO_TENANT_ID = 'demo-tenant';

export async function POST() {
  await runWeeklyFounderSummaryFlow(DEMO_TENANT_ID);
  revalidatePath('/founder/business');

  return NextResponse.json({ ok: true });
}


