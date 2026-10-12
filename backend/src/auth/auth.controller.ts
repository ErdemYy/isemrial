import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  Res,
  UseGuards,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { Request, Response } from "express";
import { AuthService } from "./auth.service";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";
import { AuthGuard } from "../common/guards/auth.guard";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { AuthenticatedUserContext } from "../common/types";

const COOKIE_NAME = "isemrial_session";
const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
  path: "/",
};

@Controller("api/auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("register")
  @HttpCode(HttpStatus.CREATED)
  async register(
    @Body() dto: RegisterDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers["user-agent"];

    const result = await this.authService.register(dto, ipAddress, userAgent);

    res.cookie(COOKIE_NAME, result.token, COOKIE_OPTIONS);

    return {
      success: true,
      data: {
        user: result.user,
        organization: result.organization,
      },
    };
  }

  @Post("login")
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers["user-agent"];

    const result = await this.authService.login(dto, ipAddress, userAgent);

    res.cookie(COOKIE_NAME, result.token, COOKIE_OPTIONS);

    return {
      success: true,
      data: {
        user: result.user,
        organization: result.organization,
      },
    };
  }

  @Post("logout")
  @HttpCode(HttpStatus.OK)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const token =
      req.cookies?.[COOKIE_NAME] ||
      (req.headers.authorization?.startsWith("Bearer ")
        ? req.headers.authorization.substring(7)
        : null);

    if (token) {
      await this.authService.logout(token);
    }

    res.clearCookie(COOKIE_NAME, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
    });

    return {
      success: true,
      message: "Başarıyla çıkış yapıldı.",
    };
  }

  @Get("me")
  @UseGuards(AuthGuard)
  async getMe(@CurrentUser() user: AuthenticatedUserContext) {
    const data = await this.authService.getMe(user.id, user.organizationId);
    return {
      success: true,
      data,
    };
  }
}
