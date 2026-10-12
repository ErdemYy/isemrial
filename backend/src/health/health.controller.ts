import { Controller, Get, HttpCode, HttpStatus } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Controller("api/health")
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  async check() {
    let dbStatus = "healthy";
    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch {
      dbStatus = "unreachable";
    }

    return {
      status: "ok",
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      services: {
        database: dbStatus,
      },
    };
  }
}
