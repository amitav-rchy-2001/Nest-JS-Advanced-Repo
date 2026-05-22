import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { SystemAlertPayload } from '../events/app-event.types';

@Injectable()
export class SystemAlertService {
  constructor(private readonly prisma: PrismaService) {}

  async create(payload: SystemAlertPayload) {
    return this.prisma.systemAlert.create({
      data: {
        title: payload.title,
        message: payload.message,
        severity: payload.severity,
        metadata: payload.metadata as any,
      },
    });
  }

  async resolve(alertId: string) {
    return this.prisma.systemAlert.update({
      where: { id: alertId },
      data: {
        status: 'RESOLVED',
        resolvedAt: new Date(),
      },
    });
  }
}