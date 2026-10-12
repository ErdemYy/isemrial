import { IsNotEmpty, IsOptional, IsString } from "class-validator";

export class UpdateStatusDto {
  @IsString({ message: "Durum alanı zorunludur." })
  @IsNotEmpty({ message: "Durum boş olamaz." })
  status: string; // Accepts enum key or frontend string e.g. "hazir", "islemde", etc.

  @IsOptional()
  @IsString()
  note?: string;
}
