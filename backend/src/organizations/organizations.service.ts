import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class OrganizationsService {
  constructor(private readonly prisma: PrismaService) {}

  async getCurrent(organizationId: string) {
    const org = await this.prisma.organization.findUnique({
      where: { id: organizationId },
      include: {
        memberships: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                email: true,
                phone: true,
              },
            },
          },
        },
      },
    });

    if (!org) {
      throw new NotFoundException("İşletme bulunamadı.");
    }

    return {
      id: org.id,
      name: org.name,
      slug: org.slug,
      phone: org.phone,
      address: org.address,
      createdAt: org.createdAt,
      members: org.memberships.map((m) => ({
        id: m.user.id,
        fullName: m.user.fullName,
        email: m.user.email,
        phone: m.user.phone,
        role: m.role,
      })),
    };
  }

  async updateCurrent(
    organizationId: string,
    data: { name?: string; phone?: string; address?: string },
  ) {
    const updated = await this.prisma.organization.update({
      where: { id: organizationId },
      data: {
        name: data.name?.trim(),
        phone: data.phone?.trim(),
        address: data.address?.trim(),
      },
    });

    return updated;
  }
}
