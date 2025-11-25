'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/l0/db';
import {
  evaluateIdea,
  logIdeaExperiment,
  updateIdeaState
} from '@/l2/ideas/ideaSelection';

const DEMO_TENANT_ID = 'demo-tenant';

export async function createIdeaAction(formData: FormData) {
  const title = String(formData.get('title') || '').trim();
  const description = String(formData.get('description') || '').trim();
  const icpDescription = String(formData.get('icpDescription') || '').trim();
  const arpuEstimate = Number(formData.get('arpuEstimate')) || null;
  const regulatedConcern = formData.get('regulatedConcern') === 'on';
  const manualWorkHeavy = formData.get('manualWorkHeavy') === 'on';
  const founderFitSignal = formData.get('founderFitSignal') === 'on';

  if (!title || !description) {
    throw new Error('Title and description are required');
  }

  await prisma.idea.create({
    data: {
      tenantId: DEMO_TENANT_ID,
      title,
      description,
      icpDescription: icpDescription || null,
      arpuEstimate,
      regulatedConcern,
      manualWorkHeavy,
      founderFitSignal
    }
  });

  revalidatePath('/founder/ideas');
}

export async function evaluateIdeaAction(formData: FormData) {
  const ideaId = String(formData.get('ideaId'));
  await evaluateIdea(DEMO_TENANT_ID, ideaId);
  revalidatePath('/founder/ideas');
}

export async function updateIdeaStateAction(formData: FormData) {
  const ideaId = String(formData.get('ideaId'));
  const state = String(formData.get('state'));
  await updateIdeaState(DEMO_TENANT_ID, ideaId, state);
  revalidatePath('/founder/ideas');
}

export async function logExperimentAction(formData: FormData) {
  const ideaId = String(formData.get('ideaId'));
  const type = String(formData.get('type')) as
    | 'SIGNAL'
    | 'WORKFLOW'
    | 'AGENT_OWNERSHIP';
  const description = String(formData.get('description') || '').trim();
  const result = String(formData.get('result') || 'PENDING') as
    | 'PENDING'
    | 'PASSED'
    | 'FAILED'
    | 'INCONCLUSIVE';

  if (!description) throw new Error('Description required');

  await logIdeaExperiment({
    tenantId: DEMO_TENANT_ID,
    ideaId,
    type,
    description,
    result
  });

  revalidatePath('/founder/ideas');
}

export async function runArchetypeDemandTestAction(
  archetypeInstanceId: string
) {
  const { runArchetypeDemandTestFlow } = await import(
    '@/l2/ideas/archetypeDemandTest'
  );
  await runArchetypeDemandTestFlow(DEMO_TENANT_ID, archetypeInstanceId);
  revalidatePath('/founder/ideas');
  revalidatePath('/founder/business');
}

export async function pauseArchetypeAction(archetypeInstanceId: string) {
  await prisma.archetypeInstance.update({
    where: { id: archetypeInstanceId, tenantId: DEMO_TENANT_ID },
    data: { state: 'PAUSED' }
  });
  revalidatePath('/founder/ideas');
}

export async function killArchetypeAction(archetypeInstanceId: string) {
  await prisma.archetypeInstance.update({
    where: { id: archetypeInstanceId, tenantId: DEMO_TENANT_ID },
    data: { state: 'KILLED' }
  });
  revalidatePath('/founder/ideas');
}


