import { ExportRecord, User } from '../../src/types';
import { saveExport } from '../repositories/export.repository';
import { logAudit } from '../repositories/audit.repository';

export async function logExport(record: ExportRecord, user: User | undefined) {
  await saveExport(record);
  await logAudit({
    userId: record.userId || user?.id || 'anon',
    userName: user?.name || 'Usuario',
    action: 'export_render',
    entityType: 'export',
    entityId: record.id || `exp-${Date.now()}`,
    status: 'SUCCESS',
    metadata: { format: record.format, resolution: record.resolution }
  });
  return { success: true };
}
