import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { ValidationPipe, Logger } from "@nestjs/common";
import { HttpExceptionFilter } from "./common/filters/http-exception.filter";
import * as cookieParser from "cookie-parser";

function validateEnvironment(logger: Logger) {
  const isProduction = process.env.NODE_ENV === "production";

  if (!process.env.DATABASE_URL) {
    logger.error("FATAL: DATABASE_URL ortam değişkeni tanımlanmamış!");
    throw new Error("Eksik ortam değişkeni: DATABASE_URL");
  }

  if (isProduction) {
    const sessionSecret = process.env.SESSION_SECRET;
    if (!sessionSecret || sessionSecret.includes("change-this") || sessionSecret.length < 32) {
      logger.error("FATAL: Üretim ortamında SESSION_SECRET güvenli ve en az 32 karakter olmalıdır!");
      throw new Error("Güvenlik hatası: Üretim için geçersiz SESSION_SECRET");
    }

    const frontendOrigin = process.env.FRONTEND_ORIGIN;
    if (!frontendOrigin || !frontendOrigin.startsWith("https://")) {
      logger.warn("UYARI: Üretim ortamında FRONTEND_ORIGIN https:// ile başlamalıdır!");
    }
  }
}

async function bootstrap() {
  const logger = new Logger("Bootstrap");
  validateEnvironment(logger);

  const app = await NestFactory.create(AppModule);

  const port = process.env.PORT || 4000;
  const frontendOrigin = process.env.FRONTEND_ORIGIN || "http://localhost:3000";

  // Reverse proxy support (for deployment behind Nginx/Caddy/Traefik)
  if (process.env.TRUST_PROXY === "true") {
    const expressApp = app.getHttpAdapter().getInstance();
    expressApp.set("trust proxy", 1);
    logger.log("🛡️ Reverse proxy arkasında trust proxy etkinleştirildi.");
  }

  // 1. Cookie Parser
  app.use(cookieParser());

  // 2. CORS configuration (allows credentials and designated origin)
  const isProduction = process.env.NODE_ENV === "production";
  const allowedOrigins = isProduction
    ? [frontendOrigin]
    : [frontendOrigin, "http://localhost:3000", "http://127.0.0.1:3000"];

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept"],
  });

  // 3. Global Input Validation with DTO whitelist protection
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // 4. Global Exception Filter
  app.useGlobalFilters(new HttpExceptionFilter());

  await app.listen(port);
  logger.log(`🚀 İşEmriAl Backend API çalışıyor: http://localhost:${port}`);
  logger.log(`🔒 İzin verilen frontend origin: ${frontendOrigin}`);
}

bootstrap();

