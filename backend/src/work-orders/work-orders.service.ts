import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Logger,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateWorkOrderDto } from "./dto/create-work-order.dto";
import { UpdateStatusDto } from "./dto/update-status.dto";
import { AddNoteDto } from "./dto/add-note.dto";
import {
  DeviceType,
  Prisma,
  WorkOrderPriority,
  WorkOrderStatus,
} from "@prisma/client";

const STATUS_TO_DB: Record<string, WorkOrderStatus> = {
  yeni: WorkOrderStatus.YENI,
  incelemede: WorkOrderStatus.INCELEMEDE,
  teklif_bekliyor: WorkOrderStatus.TEKLIF_BEKLIYOR,
  onay_bekliyor: WorkOrderStatus.ONAY_BEKLIYOR,
  islemde: WorkOrderStatus.ISLEMDE,
  parca_bekliyor: WorkOrderStatus.PARCA_BEKLIYOR,
  hazir: WorkOrderStatus.HAZIR,
  teslim_edildi: WorkOrderStatus.TESLIM_EDILDI,
  iptal: WorkOrderStatus.IPTAL,
};

const DB_TO_STATUS: Record<WorkOrderStatus, string> = {
  [WorkOrderStatus.YENI]: "yeni",
  [WorkOrderStatus.INCELEMEDE]: "incelemede",
  [WorkOrderStatus.TEKLIF_BEKLIYOR]: "teklif_bekliyor",
  [WorkOrderStatus.ONAY_BEKLIYOR]: "onay_bekliyor",
  [WorkOrderStatus.ISLEMDE]: "islemde",
  [WorkOrderStatus.PARCA_BEKLIYOR]: "parca_bekliyor",
  [WorkOrderStatus.HAZIR]: "hazir",
  [WorkOrderStatus.TESLIM_EDILDI]: "teslim_edildi",
  [WorkOrderStatus.IPTAL]: "iptal",
};

const STATUS_LABELS: Record<WorkOrderStatus, string> = {
  [WorkOrderStatus.YENI]: "Yeni Kayıt",
  [WorkOrderStatus.INCELEMEDE]: "İncelemede",
  [WorkOrderStatus.TEKLIF_BEKLIYOR]: "Teklif Bekliyor",
  [WorkOrderStatus.ONAY_BEKLIYOR]: "Onay Bekliyor",
  [WorkOrderStatus.ISLEMDE]: "Tamirde / İşlemde",
  [WorkOrderStatus.PARCA_BEKLIYOR]: "Parça Bekliyor",
  [WorkOrderStatus.HAZIR]: "Teslime Hazır",
  [WorkOrderStatus.TESLIM_EDILDI]: "Teslim Edildi",
  [WorkOrderStatus.IPTAL]: "İptal Edildi",
};

const PRIORITY_TO_DB: Record<string, WorkOrderPriority> = {
  dusuk: WorkOrderPriority.DUSUK,
  normal: WorkOrderPriority.NORMAL,
  yuksek: WorkOrderPriority.YUKSEK,
  acil: WorkOrderPriority.ACIL,
};

const DB_TO_PRIORITY: Record<WorkOrderPriority, string> = {
  [WorkOrderPriority.DUSUK]: "dusuk",
  [WorkOrderPriority.NORMAL]: "normal",
  [WorkOrderPriority.YUKSEK]: "yuksek",
  [WorkOrderPriority.ACIL]: "acil",
};

const DEVICE_TYPE_TO_DB: Record<string, DeviceType> = {
  Telefon: DeviceType.TELEFON,
  Bilgisayar: DeviceType.BILGISAYAR,
  Tablet: DeviceType.TABLET,
  Diğer: DeviceType.DIGER,
};

const DB_TO_DEVICE_TYPE: Record<DeviceType, string> = {
  [DeviceType.TELEFON]: "Telefon",
  [DeviceType.BILGISAYAR]: "Bilgisayar",
  [DeviceType.TABLET]: "Tablet",
  [DeviceType.DIGER]: "Diğer",
};

@Injectable()
export class WorkOrdersService {
  private readonly logger = new Logger(WorkOrdersService.name);

  constructor(private readonly prisma: PrismaService) {}

  private mapDbOrder(o: any) {
    return {
      id: o.id,
      orderNumber: o.orderNumber,
      customerId: o.customerId,
      customerName: o.customer?.name || "",
      customerPhone: o.customer?.phone || "",
      customerEmail: o.customer?.email || "",
      customerNotes: o.customer?.notes || "",
      deviceType: DB_TO_DEVICE_TYPE[o.deviceType as DeviceType] || "Telefon",
      deviceModel: o.deviceModel,
      deviceSerial: o.deviceSerial || "",
      screenPasscode: o.screenPasscode || "",
      issueSummary: o.issueSummary,
      physicalCondition: o.physicalCondition || "",
      status: DB_TO_STATUS[o.status as WorkOrderStatus] || "yeni",
      statusLabel: STATUS_LABELS[o.status as WorkOrderStatus] || "Yeni Kayıt",
      priority: DB_TO_PRIORITY[o.priority as WorkOrderPriority] || "normal",
      technicianName: o.technicianName,
      technicianId: o.technicianId,
      estimatedPrice: Number(o.estimatedPrice),
      paidAmount: Number(o.paidAmount),
      estimatedCompletion: o.estimatedCompletion || "Bugün 18:00",
      createdAt: o.createdAt.toISOString(),
      updatedAt: o.updatedAt.toISOString(),
      notes: (o.notes || []).map((n: any) => ({
        id: n.id,
        author: n.authorName,
        content: n.content,
        createdAt: n.createdAt.toISOString(),
      })),
      timeline: (o.timeline || []).map((t: any) => ({
        id: t.id,
        action: t.action,
        title: t.title,
        actor: t.actorName,
        description: t.description || "",
        oldStatus: t.oldStatus ? DB_TO_STATUS[t.oldStatus as WorkOrderStatus] : undefined,
        newStatus: t.newStatus ? DB_TO_STATUS[t.newStatus as WorkOrderStatus] : undefined,
        timestamp: t.createdAt.toISOString(),
      })),
    };
  }

  async list(
    organizationId: string,
    filters: {
      status?: string;
      search?: string;
      technician?: string;
      deviceType?: string;
    },
  ) {
    const where: Prisma.WorkOrderWhereInput = {
      organizationId,
    };

    if (filters.status && filters.status !== "all") {
      const dbStatus = STATUS_TO_DB[filters.status.toLowerCase()] || (filters.status as WorkOrderStatus);
      if (dbStatus) {
        where.status = dbStatus;
      }
    }

    if (filters.technician && filters.technician !== "all") {
      where.technicianName = filters.technician;
    }

    if (filters.deviceType && filters.deviceType !== "all") {
      const dbType = DEVICE_TYPE_TO_DB[filters.deviceType];
      if (dbType) {
        where.deviceType = dbType;
      }
    }

    if (filters.search && filters.search.trim()) {
      const q = filters.search.trim();
      where.OR = [
        { orderNumber: { contains: q, mode: "insensitive" } },
        { deviceModel: { contains: q, mode: "insensitive" } },
        { deviceSerial: { contains: q, mode: "insensitive" } },
        { customer: { name: { contains: q, mode: "insensitive" } } },
        { customer: { phone: { contains: q, mode: "insensitive" } } },
      ];
    }

    const orders = await this.prisma.workOrder.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        customer: true,
        notes: { orderBy: { createdAt: "asc" } },
        timeline: { orderBy: { createdAt: "desc" } },
      },
    });

    return orders.map((o) => this.mapDbOrder(o));
  }

  async getById(organizationId: string, idOrNumber: string) {
    const order = await this.prisma.workOrder.findFirst({
      where: {
        organizationId, // IDOR protection: strictly tenant-isolated
        OR: [{ id: idOrNumber }, { orderNumber: idOrNumber }],
      },
      include: {
        customer: true,
        notes: { orderBy: { createdAt: "asc" } },
        timeline: { orderBy: { createdAt: "desc" } },
      },
    });

    if (!order) {
      throw new NotFoundException(`"${idOrNumber}" numaralı veya kimlikli iş emri bulunamadı.`);
    }

    return this.mapDbOrder(order);
  }

  async create(organizationId: string, actorName: string, dto: CreateWorkOrderDto) {
    const dbDeviceType = DEVICE_TYPE_TO_DB[dto.deviceType] || DeviceType.TELEFON;
    const dbPriority = PRIORITY_TO_DB[dto.priority?.toLowerCase() || "normal"] || WorkOrderPriority.NORMAL;

    let attempts = 0;
    const maxAttempts = 5;

    while (attempts < maxAttempts) {
      try {
        const newOrder = await this.prisma.$transaction(async (tx) => {
          // 1. Resolve or create customer in the same tenant
          let customerId = dto.customerId;
          if (customerId) {
            const existingCust = await tx.customer.findFirst({
              where: { id: customerId, organizationId },
            });
            if (!existingCust) {
              throw new BadRequestException("Seçilen müşteri bu işletmeye ait değil.");
            }
          } else {
            // Look up by phone in tenant
            let cust = await tx.customer.findFirst({
              where: { organizationId, phone: dto.customerPhone.trim() },
            });
            if (!cust) {
              cust = await tx.customer.create({
                data: {
                  organizationId,
                  name: dto.customerName.trim(),
                  phone: dto.customerPhone.trim(),
                  email: dto.customerEmail?.toLowerCase().trim() || null,
                },
              });
            }
            customerId = cust.id;
          }

          // 2. Determine unique order number by finding the highest order number in organization
          const existingOrders = await tx.workOrder.findMany({
            where: { organizationId },
            select: { orderNumber: true },
          });

          let maxNum = 1040;
          for (const o of existingOrders) {
            const match = o.orderNumber.match(/\d+/);
            if (match) {
              const num = parseInt(match[0], 10);
              if (!isNaN(num) && num > maxNum) {
                maxNum = num;
              }
            }
          }

          const nextNum = maxNum + 1 + attempts;
          const orderNumber = `İE-${nextNum}`;

          // 3. Create WorkOrder
          const createdOrder = await tx.workOrder.create({
            data: {
              organizationId,
              orderNumber,
              customerId,
              technicianName: dto.technicianName?.trim() || "Murat Usta",
              deviceType: dbDeviceType,
              deviceModel: dto.deviceModel.trim(),
              deviceSerial: dto.deviceSerial?.trim() || null,
              screenPasscode: dto.screenPasscode?.trim() || null,
              issueSummary: dto.issueSummary.trim(),
              physicalCondition: dto.physicalCondition?.trim() || "Genel kullanım izleri.",
              status: WorkOrderStatus.YENI,
              priority: dbPriority,
              estimatedPrice: new Prisma.Decimal(dto.estimatedPrice || 0),
              paidAmount: new Prisma.Decimal(dto.paidAmount || 0),
              estimatedCompletion: dto.estimatedCompletion?.trim() || "Bugün 18:00",
              timeline: {
                create: {
                  organizationId,
                  action: "created",
                  title: "İş Emri Açıldı",
                  actorName,
                  description: "Müşteri kabulü yapıldı ve servis kaydı oluşturuldu.",
                },
              },
            },
            include: {
              customer: true,
              notes: true,
              timeline: true,
            },
          });

          return createdOrder;
        });

        this.logger.log(`Yeni iş emri oluşturuldu: ${newOrder.orderNumber} (${organizationId})`);
        return this.mapDbOrder(newOrder);
      } catch (err) {
        if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
          attempts++;
          this.logger.warn(`İş emri numarası çakışması algılandı, yeniden deneniyor (deneme ${attempts}/${maxAttempts})...`);
          if (attempts >= maxAttempts) {
            throw new ConflictException("Eşzamanlı istekler nedeniyle iş emri numarası üretilemedi. Lütfen tekrar deneyiniz.");
          }
          continue;
        }
        throw err;
      }
    }
  }

  async updateStatus(
    organizationId: string,
    orderId: string,
    actorName: string,
    dto: UpdateStatusDto,
  ) {
    const existing = await this.prisma.workOrder.findFirst({
      where: { id: orderId, organizationId },
    });

    if (!existing) {
      throw new NotFoundException("Güncellenecek iş emri bulunamadı.");
    }

    const newDbStatus =
      STATUS_TO_DB[dto.status.toLowerCase()] ||
      (dto.status.toUpperCase() as WorkOrderStatus);

    if (!newDbStatus || !Object.values(WorkOrderStatus).includes(newDbStatus)) {
      throw new BadRequestException(`Geçersiz durum: ${dto.status}`);
    }

    const oldStatusLabel = STATUS_LABELS[existing.status];
    const newStatusLabel = STATUS_LABELS[newDbStatus];

    const updated = await this.prisma.$transaction(async (tx) => {
      // 1. Update status
      const order = await tx.workOrder.update({
        where: { id: existing.id },
        data: {
          status: newDbStatus,
          completedAt: newDbStatus === WorkOrderStatus.TESLIM_EDILDI ? new Date() : undefined,
        },
      });

      // 2. Append TimelineEvent
      await tx.timelineEvent.create({
        data: {
          organizationId,
          workOrderId: order.id,
          action: "status_change",
          title: "Durum Güncellendi",
          actorName,
          oldStatus: existing.status,
          newStatus: newDbStatus,
          description: dto.note?.trim() || `${oldStatusLabel} ➔ ${newStatusLabel}`,
        },
      });

      // 3. If note included, also add note
      if (dto.note && dto.note.trim()) {
        await tx.workOrderNote.create({
          data: {
            organizationId,
            workOrderId: order.id,
            authorName: actorName,
            content: dto.note.trim(),
          },
        });
      }

      return order;
    });

    return this.getById(organizationId, updated.id);
  }

  async addNote(
    organizationId: string,
    orderId: string,
    actorName: string,
    dto: AddNoteDto,
  ) {
    const existing = await this.prisma.workOrder.findFirst({
      where: { id: orderId, organizationId },
    });

    if (!existing) {
      throw new NotFoundException("Not eklenecek iş emri bulunamadı.");
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.workOrderNote.create({
        data: {
          organizationId,
          workOrderId: existing.id,
          authorName: actorName,
          content: dto.content.trim(),
        },
      });

      await tx.timelineEvent.create({
        data: {
          organizationId,
          workOrderId: existing.id,
          action: "note_added",
          title: "Servis Notu Eklendi",
          actorName,
          description: dto.content.trim(),
        },
      });
    });

    return this.getById(organizationId, existing.id);
  }

  async getMetrics(organizationId: string) {
    const orders = await this.prisma.workOrder.findMany({
      where: { organizationId },
      select: {
        status: true,
        priority: true,
      },
    });

    const totalCustomers = await this.prisma.customer.count({
      where: { organizationId },
    });

    const totalOrders = orders.length;
    const inProgressCount = orders.filter((o) => o.status === WorkOrderStatus.ISLEMDE).length;
    const pendingApprovalCount = orders.filter((o) => o.status === WorkOrderStatus.ONAY_BEKLIYOR).length;
    const waitingPartsCount = orders.filter((o) => o.status === WorkOrderStatus.PARCA_BEKLIYOR).length;
    const readyCount = orders.filter((o) => o.status === WorkOrderStatus.HAZIR).length;
    const todayUrgentCount = orders.filter((o) => o.priority === WorkOrderPriority.ACIL).length;

    return {
      totalOrders,
      inProgressCount,
      pendingApprovalCount,
      waitingPartsCount,
      readyCount,
      todayUrgentCount,
      totalCustomers,
    };
  }
}
