import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { AuditLogRequestedPayload } from '../events/app-event.types';

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async create(payload: AuditLogRequestedPayload) {
    return this.prisma.auditLog.create({
      data: {
        action: payload.action,
        entity: payload.entity,
        entityId: payload.entityId,
        userId: payload.userId,
        oldValue: payload.oldValue as any,
        newValue: payload.newValue as any,
        metadata: payload.metadata as any,
        ipAddress: payload.ipAddress,
        userAgent: payload.userAgent,
      },
    });
  }

  async findByEntity(entity: string, entityId: string) {
    return this.prisma.auditLog.findMany({
      where: { entity, entityId },
      orderBy: { createdAt: 'desc' },
    });
  }
}