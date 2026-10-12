import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from "class-validator";

export class RegisterDto {
  @IsString({ message: "Ad Soyad metin olmalıdır." })
  @IsNotEmpty({ message: "Ad Soyad alanı zorunludur." })
  @MinLength(2, { message: "Ad Soyad en az 2 karakter olmalıdır." })
  fullName: string;

  @IsEmail({}, { message: "Geçerli bir e-posta adresi giriniz." })
  email: string;

  @IsString({ message: "Parola metin olmalıdır." })
  @MinLength(8, { message: "Parola en az 8 karakter olmalıdır." })
  password: string;

  @IsString({ message: "İşletme adı metin olmalıdır." })
  @IsNotEmpty({ message: "İşletme / Atölye adı zorunludur." })
  @MinLength(2, { message: "İşletme adı en az 2 karakter olmalıdır." })
  organizationName: string;

  @IsOptional()
  @IsString()
  phone?: string;
}
