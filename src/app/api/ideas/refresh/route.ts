import { NextResponse } from 'next/server';
import { runIdeasRefreshFlow } from '@/l2/ideas/ideaSelection';
import { revalidatePath } from 'next/cache';

const DEMO_TENANT_ID = 'demo-tenant';

export async function POST() {
  const results = await runIdeasRefreshFlow(DEMO_TENANT_ID);
  revalidatePath('/founder/ideas');

  return NextResponse.json({ ok: true, results });
}


