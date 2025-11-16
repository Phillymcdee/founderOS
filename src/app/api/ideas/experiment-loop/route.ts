import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { runExperimentLoopFlow } from '@/l2/ideas/experimentLoop';

const DEMO_TENANT_ID = 'demo-tenant';

export async function POST() {
  const results = await runExperimentLoopFlow(DEMO_TENANT_ID);
  revalidatePath('/founder/ideas');

  return NextResponse.json({ ok: true, results });
}

