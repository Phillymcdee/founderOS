import { NextResponse } from 'next/server';
import { approveFounderSummary } from '@/l2/ops/weeklyFounderSummary';
import { revalidatePath } from 'next/cache';

const DEMO_TENANT_ID = 'demo-tenant';

type Params = {
  params: {
    id: string;
  };
};

export async function POST(_request: Request, { params }: Params) {
  await approveFounderSummary(params.id, DEMO_TENANT_ID);
  revalidatePath('/founder/business');

  return NextResponse.json({ ok: true });
}


