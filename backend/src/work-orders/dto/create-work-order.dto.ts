import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from "class-validator";
import { Type } from "class-transformer";

export class CreateWorkOrderDto {
  @IsOptional()
  @IsString()
  customerId?: string;

  @IsString({ message: "Müşteri adı zorunludur." })
  @IsNotEmpty({ message: "Müşteri adı boş olamaz." })
  @MinLength(2, { message: "Müşteri adı en az 2 karakter olmalıdır." })
  customerName: string;

  @IsString({ message: "Telefon numarası zorunludur." })
  @IsNotEmpty({ message: "Telefon numarası boş olamaz." })
  customerPhone: string;

  @IsOptional()
  @IsString()
  customerEmail?: string;

  @IsString({ message: "Cihaz kategorisi zorunludur." })
  @IsNotEmpty()
  deviceType: string; // "Telefon" | "Bilgisayar" | "Tablet" | "Diğer"

  @IsString({ message: "Cihaz marka ve modeli zorunludur." })
  @IsNotEmpty({ message: "Cihaz marka ve modeli boş olamaz." })
  deviceModel: string;

  @IsOptional()
  @IsString()
  deviceSerial?: string;

  @IsOptional()
  @IsString()
  screenPasscode?: string;

  @IsString({ message: "Arıza şikayeti zorunludur." })
  @IsNotEmpty({ message: "Arıza şikayeti boş olamaz." })
  issueSummary: string;

  @IsOptional()
  @IsString()
  physicalCondition?: string;

  @IsOptional()
  @IsString()
  priority?: string; // "dusuk" | "normal" | "yuksek" | "acil"

  @IsOptional()
  @IsString()
  technicianName?: string;

  @IsOptional()
  @IsString()
  estimatedCompletion?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: "Tahmini tutar geçerli bir sayı olmalıdır." })
  @Min(0, { message: "Tahmini tutar negatif olamaz." })
  estimatedPrice?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: "Alınan avans geçerli bir sayı olmalıdır." })
  @Min(0, { message: "Alınan avans negatif olamaz." })
  paidAmount?: number;
}
