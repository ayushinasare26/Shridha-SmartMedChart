import { prisma } from '../config/prisma';
import { generateAuditHash } from './hmac';
import { Request } from 'express';

interface AuditOptions {
  userId?: string;
  patientId?: string;
  action: string;
  resource: string;
  resourceId?: string;
  detail?: string;
  req?: Request;
  severity?: string;
}

export async function createAuditLog(opts: AuditOptions): Promise<void> {
  try {
    const timestamp = new Date().toISOString();
    const hmacHash = generateAuditHash({
      userId: opts.userId,
      action: opts.action,
      resource: opts.resource,
      resourceId: opts.resourceId,
      timestamp,
    });

    await prisma.auditLog.create({
      data: {
        userId: opts.userId,
        patientId: opts.patientId,
        action: opts.action,
        resource: opts.resource,
        resourceId: opts.resourceId,
        detail: opts.detail,
        ipAddress: opts.req?.ip || opts.req?.socket?.remoteAddress,
        workstation: opts.req?.headers['x-workstation'] as string || 'UNKNOWN',
        hmacHash,
        severity: opts.severity || 'Normal',
      },
    });
  } catch (err) {
    console.error('[AUDIT] Failed to write audit log:', err);
  }
}
