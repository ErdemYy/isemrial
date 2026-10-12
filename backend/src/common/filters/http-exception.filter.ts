import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { Response } from "express";

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = "Beklenmeyen bir sunucu hatası oluştu.";
    let errorType = "InternalServerError";

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      if (typeof res === "string") {
        message = res;
      } else if (typeof res === "object" && res !== null) {
        const resObj = res as Record<string, any>;
        message = resObj["message"] || exception.message;
        errorType = resObj["error"] || exception.name;
      }
    } else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      // Safe Prisma error mapping
      switch (exception.code) {
        case "P2002":
          status = HttpStatus.CONFLICT;
          errorType = "ConflictError";
          const target = (exception.meta?.target as string[]) || [];
          message = `Bu kayıt zaten mevcut (${target.join(", ")}).`;
          break;
        case "P2025":
          status = HttpStatus.NOT_FOUND;
          errorType = "NotFoundError";
          message = "İstenen kayıt bulunamadı.";
          break;
        default:
          status = HttpStatus.BAD_REQUEST;
          errorType = "DatabaseError";
          message = "Veritabanı işleminde bir hata oluştu.";
          break;
      }
      this.logger.warn(`Prisma Error [${exception.code}]: ${exception.message}`);
    } else {
      this.logger.error("Bilinmeyen Hata:", exception);
    }

    response.status(status).json({
      success: false,
      statusCode: status,
      error: errorType,
      message,
      timestamp: new Date().toISOString(),
    });
  }
}
