import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service';
import { CreateChildDto, UpdateParentProfileDto } from './dto/parent.dto';

@Injectable()
export class ParentService {
  constructor(private readonly prisma: PrismaService) {}

  async profile(userId: string) {
    await this.requireParent(userId);
    return this.prisma.parentProfile.findUnique({
      where: { userId },
      include: { user: { include: { userLanguages: true } } },
    });
  }

  async updateProfile(userId: string, dto: UpdateParentProfileDto) {
    await this.requireParent(userId);
    const [user, profile] = await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: { fullName: dto.fullName, phone: dto.phone },
      }),
      this.prisma.parentProfile.upsert({
        where: { userId },
        update: {
          addressLine1: dto.addressLine1,
          street: dto.street,
          postalCode: dto.postalCode,
          city: dto.city,
          state: dto.state,
        },
        create: {
          userId,
          addressLine1: dto.addressLine1,
          street: dto.street,
          postalCode: dto.postalCode,
          city: dto.city,
          state: dto.state,
        },
      }),
    ]);

    return { user, profile };
  }

  async subscription(userId: string) {
    await this.requireParent(userId);
    return this.prisma.subscription.findFirst({
      where: { userId },
      include: { plan: true, payments: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async addChild(userId: string, dto: CreateChildDto) {
    await this.requireParent(userId);

    return this.prisma.child.create({
      data: {
        parentId: userId,
        name: dto.name,
        ageRange: dto.ageRange,
        educationalDays: dto.educationalDays ?? [],
        educationalStartTime: dto.educationalStartTime,
        educationalEndTime: dto.educationalEndTime,
        wakeupTime: dto.wakeupTime,
        napWindowFrom: dto.napWindowFrom,
        napWindowTo: dto.napWindowTo,
        bedtimeFrom: dto.bedtimeFrom,
        bedtimeTo: dto.bedtimeTo,
        restrictions: dto.restrictions,
      },
    });
  }

  async children(userId: string) {
    await this.requireParent(userId);

    return this.prisma.child.findMany({
      where: { parentId: userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  private async requireParent(userId: string) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
    });

    if (user.role !== 'parent') {
      throw new ForbiddenException('Parent account required');
    }

    return user;
  }
}
