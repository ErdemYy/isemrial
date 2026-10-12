import { IsOptional, IsString, MaxLength } from "class-validator";

export class UpdateOrganizationDto {
  @IsOptional()
  @IsString({ message: "İşletme adı metin olmalıdır." })
  @MaxLength(100, { message: "İşletme adı en fazla 100 karakter olabilir." })
  name?: string;

  @IsOptional()
  @IsString({ message: "Telefon alanı metin olmalıdır." })
  @MaxLength(30, { message: "Telefon numarası en fazla 30 karakter olabilir." })
  phone?: string;

  @IsOptional()
  @IsString({ message: "Adres alanı metin olmalıdır." })
  @MaxLength(255, { message: "Adres en fazla 255 karakter olabilir." })
  address?: string;
}
