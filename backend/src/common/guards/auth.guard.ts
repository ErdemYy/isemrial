import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
} from "@nestjs/common";
import * as crypto from "crypto";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    // 1. Extract session token from HttpOnly cookie or Authorization Bearer header
    let token = request.cookies?.["isemrial_session"];
    if (!token && request.headers.authorization) {
      const parts = request.headers.authorization.split(" ");
      if (parts.length === 2 && parts[0] === "Bearer") {
        token = parts[1];
      }
    }

    if (!token) {
      throw new UnauthorizedException("Geçerli bir oturum bulunamadı. Lütfen giriş yapınız.");
    }

    // 2. Hash token with SHA-256 to look up in database
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    const session = await this.prisma.session.findUnique({
      where: { tokenHash },
      include: {
        user: {
          include: {
            memberships: {
              include: {
                organization: true,
              },
            },
          },
        },
      },
    });

    if (!session) {
      throw new UnauthorizedException("Oturum geçersiz. Lütfen tekrar giriş yapınız.");
    }

    if (session.expiresAt < new Date()) {
      // Clean up expired session
      await this.prisma.session.delete({ where: { id: session.id } }).catch(() => {});
      throw new UnauthorizedException("Oturum süresi doldu. Lütfen tekrar giriş yapınız.");
    }

    const user = session.user;
    if (!user || !user.isActive) {
      throw new UnauthorizedException("Kullanıcı hesabı aktif değil.");
    }

    // 3. Resolve active organization membership
    const activeMembership = session.organizationId
      ? user.memberships.find((m) => m.organizationId === session.organizationId) || user.memberships[0]
      : user.memberships[0];

    if (!activeMembership) {
      throw new ForbiddenException("Kullanıcının kayıtlı olduğu aktif bir atölye bulunamadı.");
    }

    // 4. Attach verified user context to request
    request.user = {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      phone: user.phone,
      organizationId: activeMembership.organizationId,
      organizationName: activeMembership.organization.name,
      organizationSlug: activeMembership.organization.slug,
      role: activeMembership.role,
    };
    request.sessionToken = token;

    return true;
  }
}
