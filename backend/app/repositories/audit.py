from app.models.audit import AuditLog

class AuditRepository:
    async def create(self, audit_log: AuditLog) -> AuditLog:
        return await audit_log.insert()

audit_repository = AuditRepository()
