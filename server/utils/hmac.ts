import { createHmac } from 'crypto';

export function generateHmac(data: string): string {
  const secret = process.env.JWT_SECRET || 'fallback-audit-secret';
  return createHmac('sha256', secret).update(data).digest('hex');
}

export function generateAuditHash(entry: {
  userId?: string;
  action: string;
  resource: string;
  resourceId?: string;
  timestamp: string;
}): string {
  const payload = JSON.stringify(entry);
  return generateHmac(payload);
}
