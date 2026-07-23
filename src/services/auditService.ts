import { api } from './api';
import { AuditLog, initialAuditLogs } from '../store/mockDb';

class AuditService {
  async getAuditLogs(): Promise<AuditLog[]> {
    try {
      const response = await api.get('/api/v1/audit-logs');
      if (Array.isArray(response.data) && response.data.length > 0) {
        return response.data;
      }
    } catch (e) {
      console.warn("Backend audit logs API failed, using mock data.", e);
    }
    return initialAuditLogs;
  }

  async createAuditLog(log: Omit<AuditLog, 'id' | 'timestamp'>): Promise<AuditLog> {
    try {
      const response = await api.post('/api/v1/audit-logs', log);
      if (response.data?.id) return response.data;
    } catch (e) {
      console.warn("Backend create audit log failed.");
    }
    const newLog: AuditLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      ...log
    };
    initialAuditLogs.unshift(newLog);
    return newLog;
  }
}

export const auditService = new AuditService();
