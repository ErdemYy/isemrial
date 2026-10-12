import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
  Logger,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";
import * as argon2 from "argon2";
import * as crypto from "crypto";
import { Role } from "@prisma/client";

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(private readonly prisma: PrismaService) {}

  private hashToken(token: string): string {
    return crypto.createHash("sha256").update(token).digest("hex");
  }

  private generateSessionToken(): string {
    return crypto.randomBytes(32).toString("hex");
  }

  private slugify(text: string): string {
    return text
      .toLowerCase()
      .replace(/ğ/g, "g")
      .replace(/ü/g, "u")
      .replace(/ş/g, "s")
      .replace(/ı/g, "i")
      .replace(/ö/g, "o")
      .replace(/ç/g, "c")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  async register(dto: RegisterDto, ipAddress?: string, userAgent?: string) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase().trim() },
    });

    if (existingUser) {
      throw new ConflictException("Bu e-posta adresi zaten kullanımda.");
    }

    const passwordHash = await argon2.hash(dto.password, {
      type: argon2.argon2id,
    });

    const baseSlug = this.slugify(dto.organizationName) || "atolye";
    const uniqueSlug = `${baseSlug}-${crypto.randomBytes(3).toString("hex")}`;
    const token = this.generateSessionToken();
    const tokenHash = this.hashToken(token);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // Atomic transaction: Create User, Organization, Membership, Session
    const result = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: dto.email.toLowerCase().trim(),
          fullName: dto.fullName.trim(),
          passwordHash,
          phone: dto.phone?.trim() || null,
        },
      });

      const organization = await tx.organization.create({
        data: {
          name: dto.organizationName.trim(),
          slug: uniqueSlug,
          phone: dto.phone?.trim() || null,
        },
      });

      const membership = await tx.membership.create({
        data: {
          userId: user.id,
          organizationId: organization.id,
          role: Role.OWNER,
        },
      });

      await tx.session.create({
        data: {
          tokenHash,
          userId: user.id,
          organizationId: organization.id,
          expiresAt,
          ipAddress,
          userAgent,
        },
      });

      return { user, organization, membership };
    });

    this.logger.log(`Yeni kullanıcı ve atölye kaydedildi: ${result.user.email} (${result.organization.name})`);

    return {
      token,
      user: {
        id: result.user.id,
        email: result.user.email,
        fullName: result.user.fullName,
        phone: result.user.phone,
      },
      organization: {
        id: result.organization.id,
        name: result.organization.name,
        slug: result.organization.slug,
        role: result.membership.role,
      },
    };
  }

  async login(dto: LoginDto, ipAddress?: string, userAgent?: string) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase().trim() },
      include: {
        memberships: {
          include: {
            organization: true,
          },
        },
      },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException("E-posta adresi veya parola hatalı.");
    }

    const isPasswordValid = await argon2.verify(user.passwordHash, dto.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException("E-posta adresi veya parola hatalı.");
    }

    if (!user.memberships || user.memberships.length === 0) {
      throw new UnauthorizedException("Kullanıcıya atanmış aktif bir atölye veya işletme bulunamadı.");
    }

    const activeMembership = user.memberships[0];
    const token = this.generateSessionToken();
    const tokenHash = this.hashToken(token);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await this.prisma.session.create({
      data: {
        tokenHash,
        userId: user.id,
        organizationId: activeMembership.organizationId,
        expiresAt,
        ipAddress,
        userAgent,
      },
    });

    this.logger.log(`Kullanıcı giriş yaptı: ${user.email} (${activeMembership.organization.name})`);

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        phone: user.phone,
      },
      organization: {
        id: activeMembership.organization.id,
        name: activeMembership.organization.name,
        slug: activeMembership.organization.slug,
        role: activeMembership.role,
      },
    };
  }

  async logout(token: string) {
    if (!token) return;
    const tokenHash = this.hashToken(token);
    await this.prisma.session.deleteMany({
      where: { tokenHash },
    });
  }

  async getMe(userId: string, organizationId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        memberships: {
          include: {
            organization: true,
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException("Kullanıcı bulunamadı.");
    }

    const activeMembership = user.memberships.find((m) => m.organizationId === organizationId) || user.memberships[0];

    return {
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        phone: user.phone,
      },
      organization: {
        id: activeMembership.organization.id,
        name: activeMembership.organization.name,
        slug: activeMembership.organization.slug,
        role: activeMembership.role,
      },
      memberships: user.memberships.map((m) => ({
        organizationId: m.organizationId,
        organizationName: m.organization.name,
        organizationSlug: m.organization.slug,
        role: m.role,
      })),
    };
  }
}
