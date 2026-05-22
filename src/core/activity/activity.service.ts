import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { ActivityLogRequestedPayload } from '../events/app-event.types';

@Injectable()
export class ActivityService {
  constructor(private readonly prisma: PrismaService) {}

  async create(payload: ActivityLogRequestedPayload) {
    return this.prisma.activityLog.create({
      data: {
        userId: payload.userId,
        title: payload.title,
        description: payload.description,
        entity: payload.entity,
        entityId: payload.entityId,
        metadata: payload.metadata as any,
      },
    });
  }

  async findUserTimeline(userId: string) {
    return this.prisma.activityLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }
}