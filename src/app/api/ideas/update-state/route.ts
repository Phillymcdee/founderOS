import { NextRequest, NextResponse } from 'next/server';
import { updateIdeaState } from '@/l2/ideas/ideaSelection';
import { revalidatePath } from 'next/cache';

const DEMO_TENANT_ID = 'demo-tenant';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const ideaId = String(formData.get('ideaId'));
    const state = String(formData.get('state'));

    if (!ideaId || !state) {
      return NextResponse.json(
        { error: 'ideaId and state are required' },
        { status: 400 }
      );
    }

    const updated = await updateIdeaState(DEMO_TENANT_ID, ideaId, state);
    revalidatePath('/founder/ideas');

    return NextResponse.json({ ok: true, idea: updated });
  } catch (error) {
    console.error('Error updating idea state:', error);
    return NextResponse.json(
      { error: 'Failed to update idea state' },
      { status: 500 }
    );
  }
}

