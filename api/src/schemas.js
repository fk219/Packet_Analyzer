import { z } from 'zod';

export const rulesSchema = z.object({
  blockedApps: z.array(z.string().min(1).max(64)).max(40).optional().default([]),
  blockedDomains: z.array(z.string().min(1).max(255)).max(40).optional().default([]),
  blockedIps: z.array(z.string().min(1).max(64)).max(40).optional().default([])
});
