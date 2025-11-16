import { prisma } from './db';

type EventPayload = Record<string, unknown>;

export async function logEvent(params: {
  tenantId: string;
  type: string;
  payload?: EventPayload;
  flowInstanceId?: string;
  primaryEntityId?: string;
}) {
  const { tenantId, type, payload = {}, flowInstanceId, primaryEntityId } =
    params;

  return prisma.event.create({
    data: {
      tenantId,
      type,
      payload: payload as any, // Prisma Json type
      flowInstanceId,
      primaryEntityId
    }
  });
}



