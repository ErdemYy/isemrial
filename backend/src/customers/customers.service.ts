import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateCustomerDto } from "./dto/create-customer.dto";
import { Prisma, WorkOrderStatus } from "@prisma/client";

@Injectable()
export class CustomersService {
  constructor(private readonly prisma: PrismaService) {}

  async list(organizationId: string, search?: string) {
    const where: Prisma.CustomerWhereInput = {
      organizationId,
    };

    if (search && search.trim()) {
      const q = search.trim();
      where.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { phone: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
      ];
    }

    const customers = await this.prisma.customer.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        workOrders: {
          select: {
            id: true,
            orderNumber: true,
            status: true,
            deviceModel: true,
            estimatedPrice: true,
          },
        },
      },
    });

    return customers.map((c) => {
      const activeOrdersCount = c.workOrders.filter(
        (o) => o.status !== WorkOrderStatus.TESLIM_EDILDI && o.status !== WorkOrderStatus.IPTAL,
      ).length;

      const totalVolume = c.workOrders.reduce(
        (sum, o) => sum + Number(o.estimatedPrice),
        0,
      );

      return {
        id: c.id,
        name: c.name,
        phone: c.phone,
        email: c.email,
        notes: c.notes,
        createdAt: c.createdAt,
        totalOrdersCount: c.workOrders.length,
        activeOrdersCount,
        totalVolume,
        recentDevices: Array.from(new Set(c.workOrders.map((o) => o.deviceModel))).slice(0, 3),
      };
    });
  }

  async getById(organizationId: string, id: string) {
    const customer = await this.prisma.customer.findFirst({
      where: {
        id,
        organizationId, // IDOR protection: strictly scoped to active organization
      },
      include: {
        workOrders: {
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            orderNumber: true,
            deviceType: true,
            deviceModel: true,
            issueSummary: true,
            status: true,
            priority: true,
            technicianName: true,
            estimatedPrice: true,
            paidAmount: true,
            createdAt: true,
          },
        },
      },
    });

    if (!customer) {
      throw new NotFoundException("Müşteri kaydı bulunamadı.");
    }

    const totalVolume = customer.workOrders.reduce(
      (sum, o) => sum + Number(o.estimatedPrice),
      0,
    );

    return {
      id: customer.id,
      name: customer.name,
      phone: customer.phone,
      email: customer.email,
      notes: customer.notes,
      createdAt: customer.createdAt,
      totalVolume,
      workOrders: customer.workOrders.map((o) => ({
        ...o,
        estimatedPrice: Number(o.estimatedPrice),
        paidAmount: Number(o.paidAmount),
      })),
    };
  }

  async create(organizationId: string, dto: CreateCustomerDto) {
    const customer = await this.prisma.customer.create({
      data: {
        organizationId,
        name: dto.name.trim(),
        phone: dto.phone.trim(),
        email: dto.email?.toLowerCase().trim() || null,
        notes: dto.notes?.trim() || null,
      },
    });

    return customer;
  }
}
