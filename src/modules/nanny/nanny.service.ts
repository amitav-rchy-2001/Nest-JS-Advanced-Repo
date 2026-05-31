import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service';
import { UpdateNannyProfileDto } from './dto/nanny.dto';

@Injectable()
export class NannyService {
  constructor(private readonly prisma: PrismaService) {}

  async profile(userId: string) {
    await this.requireNanny(userId);
    return this.prisma.nannyProfile.findUnique({
      where: { userId },
      include: { user: { include: { userLanguages: true } } },
    });
  }

  async updateProfile(userId: string, dto: UpdateNannyProfileDto) {
    await this.requireNanny(userId);
    const [user, profile] = await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: { fullName: dto.fullName },
      }),
      this.prisma.nannyProfile.upsert({
        where: { userId },
        update: { preferredLanguage: dto.preferredLanguage },
        create: { userId, preferredLanguage: dto.preferredLanguage },
      }),
    ]);

    return { user, profile };
  }

  async documents(userId: string) {
    await this.requireNanny(userId);
    return this.prisma.identityDocument.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async status(userId: string) {
    await this.requireNanny(userId);
    const profile = await this.prisma.nannyProfile.findUnique({
      where: { userId },
      select: { accountStatus: true },
    });
    const documents = await this.prisma.identityDocument.findMany({
      where: { userId },
      select: { id: true, documentType: true, verificationStatus: true },
    });

    return { accountStatus: profile?.accountStatus, documents };
  }

  private async requireNanny(userId: string) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
    });

    if (user.role !== 'nanny') {
      throw new ForbiddenException('Nanny account required');
    }

    return user;
  }
}
