import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { runWeeklyDiscoverAndCompressFlow } from '@/l2/ideas/discoverAndCompress';

const DEMO_TENANT_ID = 'demo-tenant';

export async function POST() {
  const results = await runWeeklyDiscoverAndCompressFlow(DEMO_TENANT_ID);
  revalidatePath('/founder/ideas');
  revalidatePath('/founder/settings');

  return NextResponse.json({ ok: true, results });
}

