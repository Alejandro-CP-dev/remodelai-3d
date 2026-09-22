import * as adminRepo from '../repositories/admin.repository';
import * as auditRepo from '../repositories/audit.repository';

export async function getMetrics() {
  return adminRepo.getAdminMetrics();
}

export async function getAuditLogs() {
  return auditRepo.getAuditLogs();
}
